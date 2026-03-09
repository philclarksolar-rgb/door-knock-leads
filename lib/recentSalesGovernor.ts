import { createClient } from "@supabase/supabase-js";
import { getTile } from "./rentcastTiles";
import {
  getSystemSettings,
  setSystemSetting,
  boolFromSetting,
  monthKey,
  resetMonthIfNeeded,
} from "./recentSalesSettings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CACHE_TTL_DAYS = 30;

export async function getMonthlyRequestCount() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("rentcast_api_usage")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString());

  if (error) throw error;

  return count ?? 0;
}

export async function getCachedTile(tileLat: number, tileLon: number) {
  const cutoff = new Date(
    Date.now() - CACHE_TTL_DAYS * 86400000
  ).toISOString();

  const { data, error } = await supabase
    .from("rentcast_cache")
    .select("*")
    .eq("tile_lat", tileLat)
    .eq("tile_lon", tileLon)
    .gte("cached_at", cutoff);

  if (error) throw error;

  return data ?? [];
}

export async function insertCachedSales(rows: any[]) {
  if (!rows.length) return;

  const { error } = await supabase
    .from("rentcast_cache")
    .insert(rows);

  if (error) throw error;
}

export async function logApiUsage({
  userId,
  lat,
  lng,
  radius,
  paidRequest,
}: any) {
  const { error } = await supabase
    .from("rentcast_api_usage")
    .insert({
      user_id: userId,
      lat,
      lon: lng,
      radius,
      paid_request: paidRequest,
    });

  if (error) throw error;
}

export async function evaluateGovernor({
  lat,
  lng,
  radius,
  userId,
  isAdmin,
  adminApproval,
  disableUntilReset,
}: any) {

  const { tileLat, tileLon } = getTile(lat, lng);

  let settings = await getSystemSettings();
  settings = await resetMonthIfNeeded(settings);

  const cached = await getCachedTile(tileLat, tileLon);
  const requestCount = await getMonthlyRequestCount();

  const globalFreeze = boolFromSetting(settings.rentcast_global_freeze);
  const paidLockUntilReset = boolFromSetting(
    settings.rentcast_paid_lock_until_reset
  );

  const alertPending = boolFromSetting(settings.rentcast_45_alert_pending);
  const alertMonth = settings.rentcast_45_alert_month || "";
  const nowMonth = monthKey();

  const adminThresholdWarning =
    isAdmin && requestCount >= 45 && alertPending && alertMonth === nowMonth;

  if (globalFreeze) {
    return {
      kind: "blocked",
      tileLat,
      tileLon,
      payload: {
        source: "cache",
        results: cached,
        globalFreeze: true,
      },
    };
  }

  if (paidLockUntilReset) {
    return {
      kind: "blocked",
      tileLat,
      tileLon,
      payload: {
        source: "cache",
        results: cached,
        paidLockUntilReset: true,
      },
    };
  }

  if (cached.length > 0) {
    return {
      kind: "cache",
      tileLat,
      tileLon,
      payload: {
        source: "cache",
        results: cached,
        adminThresholdWarning,
      },
    };
  }

  if (requestCount >= 45 && !isAdmin) {

    await setSystemSetting("rentcast_global_freeze", "true");

    if (alertMonth !== nowMonth || !alertPending) {
      await setSystemSetting("rentcast_45_alert_pending", "true");
      await setSystemSetting("rentcast_45_alert_month", nowMonth);
    }

    return {
      kind: "blocked",
      tileLat,
      tileLon,
      payload: {
        source: "cache",
        results: cached,
        globalFreeze: true,
      },
    };
  }

  if (requestCount >= 50) {

    if (!isAdmin) {
      return {
        kind: "blocked",
        tileLat,
        tileLon,
        payload: {
          source: "cache",
          results: cached,
          requiresAdminApproval: true,
        },
      };
    }

    if (!adminApproval) {
      return {
        kind: "blocked",
        tileLat,
        tileLon,
        payload: {
          requiresAdminApproval: true,
        },
      };
    }

    if (disableUntilReset) {
      await setSystemSetting("rentcast_paid_lock_until_reset", "true");

      return {
        kind: "blocked",
        tileLat,
        tileLon,
        payload: {
          paidLockUntilReset: true,
        },
      };
    }
  }

  return {
    kind: "allow",
    tileLat,
    tileLon,
    requestCount,
    paidRequest: requestCount >= 50,
    adminThresholdWarning,
  };
}
