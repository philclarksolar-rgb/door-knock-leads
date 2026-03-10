import { createClient } from "@supabase/supabase-js"
import { getTileId, getTileBounds } from "@/lib/mapTile"
import { checkRequestAllowed } from "@/lib/recentSalesGovernor"
import { getRentcastTile } from "@/lib/rentcastTiles"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const lat = Number(searchParams.get("lat"))
    const lon = Number(searchParams.get("lon"))

    if (!lat || !lon) {
      return new Response(JSON.stringify({ error: "Missing coordinates" }), {
        status: 400
      })
    }

    // Determine tile
    const tileId = getTileId(lat, lon)

    // Check cached data first
    const { data: cached } = await supabase
      .from("recent_sales_cache")
      .select("*")
      .eq("tile_id", tileId)
      .single()

    if (cached) {
      return Response.json({
        source: "cache",
        sales: cached.sales
      })
    }

    // Check if API request allowed
    const allowed = await checkRequestAllowed()

    if (!allowed) {
      return Response.json({
        source: "blocked",
        sales: []
      })
    }

    // Determine tile bounds
    const bounds = getTileBounds(tileId)

    // Fetch from RentCast
    const sales = await getRentcastTile(bounds)

    // Cache result
    await supabase.from("recent_sales_cache").insert({
      tile_id: tileId,
      sales
    })

    return Response.json({
      source: "rentcast",
      sales
    })

  } catch (err) {
    console.error(err)

    return new Response(
      JSON.stringify({ error: "Failed to load recent sales" }),
      { status: 500 }
    )
  }
}
