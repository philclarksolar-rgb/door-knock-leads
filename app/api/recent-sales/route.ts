export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTileBounds, getTile } from "@/lib/rentcastTiles";
import { checkRequestAllowed } from "@/lib/recentSalesGovernor";
import { getRentcastTile } from "@/lib/rentcastTiles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const { tileLat, tileLon } = getTile(lat, lng);

    const { data: cached } = await supabase
      .from("rentcast_cache")
      .select("*")
      .eq("tile_lat", tileLat)
      .eq("tile_lon", tileLon);

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

      await supabase.from("rentcast_cache").insert(rows);
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
