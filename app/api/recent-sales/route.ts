import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getTileId, getTileBounds } from "@/lib/mapTile"
import { checkRequestAllowed } from "@/lib/recentSalesGovernor"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

  try{

    const body = await req.json()

    const { lat, lon } = body

    const tileId =
      getTileId(lat,lon)

    /* check cache */

    const { data:cached } =
      await supabase
        .from("rentcast_cache")
        .select("*")
        .eq("tile_id",tileId)

    if(cached && cached.length > 0){

      return NextResponse.json({
        source:"cache",
        sales:cached
      })

    }

    /* check API governor */

    const allowed =
      await checkRequestAllowed()

    if(!allowed){

      return NextResponse.json({
        source:"blocked",
        sales:[]
      })

    }

    const bounds =
      getTileBounds(lat,lon)

    const url =
      `https://api.rentcast.io/v1/properties/sale` +
      `?minLatitude=${bounds.minLat}` +
      `&maxLatitude=${bounds.maxLat}` +
      `&minLongitude=${bounds.minLon}` +
      `&maxLongitude=${bounds.maxLon}` +
      `&daysSinceSold=180`

    const response =
      await fetch(url,{
        headers:{
          "X-Api-Key":
          process.env.RENTCAST_API_KEY!
        }
      })

    const data =
      await response.json()

    if(data?.properties){

      for(const home of data.properties){

        await supabase
          .from("rentcast_cache")
          .insert({

            lat:home.latitude,
            lon:home.longitude,
            address:home.address,
            sale_date:home.lastSaleDate,
            sale_price:home.lastSalePrice,
            tile_id:tileId

          })

      }

    }

    return NextResponse.json({
      source:"rentcast",
      sales:data.properties || []
    })

  }catch(error:any){

    return NextResponse.json(
      {
        error:error?.message
      },
      { status:500 }
    )

  }

}
