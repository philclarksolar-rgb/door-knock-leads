export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTileId, getTileBounds } from "@/lib/mapTile";
import { checkRequestAllowed } from "@/lib/recentSalesGovernor";
import { getRentcastTile } from "@/lib/rentcastTiles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lng, radius, userId, isAdmin } = body;

    const { allowed } = await checkRequestAllowed(userId, isAdmin);

    if (!allowed) {
      return NextResponse.json({
        blocked: true,
        reason: "API limit reached",
      });
    }

    const tileId = getTileId(lat, lng);

    const bounds = getTileBounds(tileId);

    const sales = await getRentcastTile(bounds);

    return NextResponse.json({
      sales,
      tileId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "recent-sales failed" }, { status: 500 });
  }
}
