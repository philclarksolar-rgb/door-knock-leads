export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTileBounds, getTile, getRentcastTile } from "@/lib/rentcastTiles";
import { checkRequestAllowed } from "@/lib/recentSalesGovernor";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("supabaseKey is required.");
  }

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid coordinates" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { tileLat, tileLon } = getTile(lat, lng);

    const { data: cached, error: cacheError } = await supabase
      .from("rentcast_cache")
      .select("*")
      .eq("tile_lat", tileLat)
      .eq("tile_lon", tileLon);

    if (cacheError) {
      console.error(cacheError);
    }

    if (cached && cached.length > 0) {
      return NextResponse.json({
        source: "cache",
        sales: cached,
      });
    }

    const allowed = await checkRequestAllowed();

    if (!allowed) {
      return NextResponse.json({
        blocked: true,
        source: "blocked",
        sales: [],
      });
    }

    const bounds = getTileBounds(tileLat, tileLon);
    const sales = await getRentcastTile(bounds);

    if (sales.length > 0) {
      const rows = sales.map((sale: any) => ({
        tile_lat: tileLat,
        tile_lon: tileLon,
        cached_at: new Date().toISOString(),
        ...sale,
      }));

      const { error: insertError } = await supabase
        .from("rentcast_cache")
        .insert(rows);

      if (insertError) {
        console.error(insertError);
      }
    }

    return NextResponse.json({
      source: "rentcast",
      sales,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "recent-sales failed" },
      { status: 500 }
    );
  }
}
