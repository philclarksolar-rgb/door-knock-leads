import { createClient } from "@supabase/supabase-js";
import {
  boolFromSetting,
  getSystemSettings,
  monthKey,
  resetMonthIfNeeded,
  setSystemSetting,
} from "./recentSalesSettings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CACHE_TTL_DAYS = 30;
const TILE_SIZE = 0.1;

export function tileCoord(value: number) {
  return Math.floor(value / TILE_SIZE) * TILE_SIZE;
}

export async function getMonthlyRequestCount() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("rentcast_api_usage")
    .select("*", { count: "exact", head: true })
    .gte("created_at", start.toISOString());

  if (error) throw error;
  return count || 0;
}

export async function getCachedTile(tileLat: number, tileLon: number) {
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 86400000).toISOString();

  const { data, error } = await supabase
    .from("rentcast_cache")
    .select("*")
    .eq("tile_lat", tileLat)
    .eq("tile_lon", tileLon)
    .gte("cached_at", cutoff);

  if (error) throw error;
  return data || [];
}

export function normalizeSale(sale: any, tileLat: number, tileLon: number) {
  return {
    address: sale.formattedAddress || sale.addressLine1 || sale.address || "",
    lat: sale.latitude,
    lon: sale.longitude,
    sale_price: sale.lastSalePrice || sale.price || null,
    sale_date: sale.lastSaleDate || null,
    tile_lat: tileLat,
    tile_lon: tileLon,
  };
}

export async function insertCachedSales(rows: any[]) {
  if (!rows.length) return;
  const { error } = await supabase.from("rentcast_cache").insert(rows);
  if (error) throw error;
}

export async function logApiUsage(args: {
  userId: string | null;
  lat: number;
  lng: number;
  radius: number;
  paidRequest: boolean;
}) {
  const { error } = await supabase.from("rentcast_api_usage").insert({
    user_id: args.userId,
    lat: args.lat,
    lon: args.lng,
    radius: args.radius,
    paid_request: args.paidRequest,
  });

  if (error) throw error;
}

export async function evaluateGovernor(args: {
  lat: number;
  lng: number;
  radius: number;
  userId: string | null;
  isAdmin: boolean;
  adminApproval: boolean;
  disableUntilReset: boolean;
}) {
  const tileLat = tileCoord(args.lat);
  const tileLon = tileCoord(args.lng);

  let settings = await getSystemSettings();
  settings = await resetMonthIfNeeded(settings);

  const cached = await getCachedTile(tileLat, tileLon);
  const requestCount = await getMonthlyRequestCount();

  const globalFreeze = boolFromSetting(settings.rentcast_global_freeze);
  const paidLockUntilReset = boolFromSetting(settings.rentcast_paid_lock_until_reset);
  const alertPending = boolFromSetting(settings.rentcast_45_alert_pending);
  const alertMonth = settings.rentcast_45_alert_month || "";
  const nowMonth = monthKey();

  const adminThresholdWarning =
    args.isAdmin && requestCount >= 45 && alertPending && alertMonth === nowMonth;

  if (globalFreeze) {
    return {
      kind: "blocked",
      tileLat,
      tileLon,
      cached,
      requestCount,
      payload: {
        source: "cache",
        results: cached,
        requestCount,
        globalFreeze: true,
        adminThresholdWarning,
        message: "RentCast requests are globally frozen.",
      },
    };
  }

  if (paidLockUntilReset) {
    return {
      kind: "blocked",
      tileLat,
      tileLon,
      cached,
      requestCount,
      payload: {
        source: "cache",
        results: cached,
        requestCount,
        paidLockUntilReset: true,
        adminThresholdWarning,
        message: "New RentCast requests are disabled until the month resets.",
      },
    };
  }

  if (cached.length > 0) {
    return {
      kind: "cache",
      tileLat,
      tileLon,
      cached,
      requestCount,
      payload: {
        source: "cache",
        results: cached,
        requestCount,
        adminThresholdWarning,
      },
    };
  }

  if (requestCount >= 45 && !args.isAdmin) {
    await setSystemSetting("rentcast_global_freeze", "true");

    if (alertMonth !== nowMonth || !alertPending) {
      await setSystemSetting("rentcast_45_alert_pending", "true");
      await setSystemSetting("rentcast_45_alert_month", nowMonth);
    }

    return {
      kind: "blocked",
      tileLat,
      tileLon,
      cached,
      requestCount,
      payload: {
        source: "cache",
        results: cached,
        requestCount,
        globalFreeze: true,
        adminThresholdWarning: false,
        message: "RentCast cache is frozen for non-admin users this month.",
      },
    };
  }

  if (requestCount >= 45) {
    await setSystemSetting("rentcast_global_freeze", "true");

    if (alertMonth !== nowMonth || !alertPending) {
      await setSystemSetting("rentcast_45_alert_pending", "true");
      await setSystemSetting("rentcast_45_alert_month", nowMonth);
    }
  }

  if (requestCount >= 50) {
    if (!args.isAdmin) {
      return {
        kind: "blocked",
        tileLat,
        tileLon,
        cached,
        requestCount,
        payload: {
          source: "cache",
          results: cached,
          requestCount,
          requiresAdminApproval: true,
          message: "Paid territory reached. Admin approval is required.",
        },
      };
    }

    if (!args.adminApproval) {
      return {
        kind: "blocked",
        tileLat,
        tileLon,
        cached,
        requestCount,
        payload: {
          source: "cache",
          results: cached,
          requestCount,
          requiresAdminApproval: true,
          message:
            "RentCast free limit reached. Proceeding will use a paid request.",
        },
      };
    }

    if (args.disableUntilReset) {
      await setSystemSetting("rentcast_paid_lock_until_reset", "true");

      return {
        kind: "blocked",
        tileLat,
        tileLon,
        cached,
        requestCount,
        payload: {
          source: "cache",
          results: cached,
          requestCount,
          paidLockUntilReset: true,
          message: "New RentCast requests are now disabled until month reset.",
        },
      };
    }
  }

  return {
    kind: "allow",
    tileLat,
    tileLon,
    cached,
    requestCount,
    adminThresholdWarning,
    paidRequest: requestCount >= 50,
  };
}
