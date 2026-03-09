import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RENTCAST_KEY = process.env.RENTCAST_API_KEY!;
const CACHE_TTL_DAYS = 30;
const TILE_SIZE = 0.1;

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function tileCoord(value: number) {
  return Math.floor(value / TILE_SIZE) * TILE_SIZE;
}

function boolFromSetting(value?: string | null) {
  return (value || "").toLowerCase() === "true";
}

async function getSystemSettings() {
  const { data, error } = await supabase
    .from("system_settings")
    .select("key,value");

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.key] = row.value;
  }
  return map;
}

async function setSystemSetting(key: string, value: string) {
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) throw error;
}

async function resetMonthIfNeeded(settings: Record<string, string>) {
  const nowMonth = monthKey();
  const savedMonth = settings.rentcast_current_month || "";

  if (savedMonth === nowMonth) return settings;

  await setSystemSetting("rentcast_current_month", nowMonth);
  await setSystemSetting("rentcast_global_freeze", "false");
  await setSystemSetting("rentcast_paid_lock_until_reset", "false");
  await setSystemSetting("rentcast_45_alert_pending", "false");
  await setSystemSetting("rentcast_45_alert_month", "");
  await setSystemSetting("rentcast_last_reset_at", new Date().toISOString());

  return {
    ...settings,
    rentcast_current_month: nowMonth,
    rentcast_global_freeze: "false",
    rentcast_paid_lock_until_reset: "false",
    rentcast_45_alert_pending: "false",
    rentcast_45_alert_month: "",
    rentcast_last_reset_at: new Date().toISOString(),
  };
}

async function getMonthlyRequestCount() {
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

async function getCachedTile(tileLat: number, tileLon: number) {
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

function normalizeSale(sale: any, tileLat: number, tileLon: number) {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius = Number(searchParams.get("radius") ?? 15);
    const userId = searchParams.get("userId") || null;
    const isAdmin = searchParams.get("isAdmin") === "true";
    const adminApproval = searchParams.get("adminApproval") === "true";
    const disableUntilReset = searchParams.get("disableUntilReset") === "true";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates." }, { status: 400 });
    }

    const tileLat = tileCoord(lat);
    const tileLon = tileCoord(lng);

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
      isAdmin && requestCount >= 45 && alertPending && alertMonth === nowMonth;

    if (globalFreeze) {
      return NextResponse.json({
        source: "cache",
        results: cached,
        requestCount,
        globalFreeze: true,
        adminThresholdWarning,
        message: "RentCast requests are globally frozen.",
      });
    }

    if (paidLockUntilReset) {
      return NextResponse.json({
        source: "cache",
        results: cached,
        requestCount,
        paidLockUntilReset: true,
        adminThresholdWarning,
        message: "New RentCast requests are disabled until the month resets.",
      });
    }

    if (cached.length > 0) {
      return NextResponse.json({
        source: "cache",
        results: cached,
        requestCount,
        adminThresholdWarning,
      });
    }

    if (requestCount >= 45 && !isAdmin) {
      if (!globalFreeze) {
        await setSystemSetting("rentcast_global_freeze", "true");
      }

      if (alertMonth !== nowMonth || !alertPending) {
        await setSystemSetting("rentcast_45_alert_pending", "true");
        await setSystemSetting("rentcast_45_alert_month", nowMonth);
      }

      return NextResponse.json({
        source: "cache",
        results: cached,
        requestCount,
        globalFreeze: true,
        adminThresholdWarning: false,
        message: "RentCast cache is frozen for non-admin users this month.",
      });
    }

    if (requestCount >= 45 && !globalFreeze) {
      await setSystemSetting("rentcast_global_freeze", "true");
    }

    if (requestCount >= 45 && (alertMonth !== nowMonth || !alertPending)) {
      await setSystemSetting("rentcast_45_alert_pending", "true");
      await setSystemSetting("rentcast_45_alert_month", nowMonth);
    }

    if (requestCount >= 50) {
      if (!isAdmin) {
        return NextResponse.json({
          source: "cache",
          results: cached,
          requestCount,
          requiresAdminApproval: true,
          message: "Paid territory reached. Admin approval is required.",
        });
      }

      if (!adminApproval) {
        return NextResponse.json({
          source: "cache",
          results: cached,
          requestCount,
          requiresAdminApproval: true,
          message:
            "RentCast free limit reached. Proceeding will use a paid request.",
        });
      }

      if (disableUntilReset) {
        await setSystemSetting("rentcast_paid_lock_until_reset", "true");

        return NextResponse.json({
          source: "cache",
          results: cached,
          requestCount,
          paidLockUntilReset: true,
          message: "New RentCast requests are now disabled until month reset.",
        });
      }
    }

    const rentcastUrl =
      `https://api.rentcast.io/v1/properties/sale` +
      `?latitude=${lat}` +
      `&longitude=${lng}` +
      `&radius=${radius}` +
      `&soldWithinMonths=6`;

    const rc = await fetch(rentcastUrl, {
      headers: {
        "X-Api-Key": RENTCAST_KEY,
      },
      cache: "no-store",
    });

    if (!rc.ok) {
      return NextResponse.json(
        { error: `RentCast error ${rc.status}` },
        { status: rc.status }
      );
    }

    const sales = await rc.json();
    const results = Array.isArray(sales)
      ? sales.map((sale: any) => normalizeSale(sale, tileLat, tileLon))
      : [];

    if (results.length > 0) {
      await supabase.from("rentcast_cache").insert(results);
    }

    await supabase.from("rentcast_api_usage").insert({
      user_id: userId,
      lat,
      lon: lng,
      radius,
      paid_request: requestCount >= 50,
    });

    return NextResponse.json({
      source: "rentcast",
      results,
      requestCount: requestCount + 1,
      adminThresholdWarning:
        isAdmin &&
        (adminThresholdWarning || (requestCount + 1 >= 45 && alertMonth !== nowMonth)),
      paidRequest: requestCount >= 50,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unknown recent-sales error." },
      { status: 500 }
    );
  }
}
