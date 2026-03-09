// app/api/recent-sales/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RENTCAST_KEY = process.env.RENTCAST_API_KEY!;

const CACHE_TTL_DAYS = 30;
const TILE_SIZE = 0.1;

function tileCoord(value:number){
  return Math.floor(value / TILE_SIZE) * TILE_SIZE;
}

async function getMonthlyRequestCount(){

  const { data } = await supabase
    .from("rentcast_api_usage")
    .select("id", { count: "exact", head: true })
    .gte(
      "created_at",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    );

  return data?.length ?? 0;
}

export async function GET(req:Request){

  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 10);

  if(!lat || !lng){
    return NextResponse.json({error:"Missing coordinates"});
  }

  const tileLat = tileCoord(lat);
  const tileLon = tileCoord(lng);

  // ---------- CACHE CHECK ----------

  const { data:cached } = await supabase
    .from("rentcast_cache")
    .select("*")
    .eq("tile_lat",tileLat)
    .eq("tile_lon",tileLon)
    .gte(
      "cached_at",
      new Date(Date.now() - CACHE_TTL_DAYS*86400000).toISOString()
    );

  if(cached && cached.length){

    return NextResponse.json({
      source:"cache",
      results:cached
    });

  }

  // ---------- USAGE CHECK ----------

  const requestCount = await getMonthlyRequestCount();

  if(requestCount >= 45){

    return NextResponse.json({

      source:"locked",

      message:"RentCast request limit approaching — cache frozen",

      results:cached ?? []

    });

  }

  // ---------- RENTCAST CALL ----------

  const url =
  `https://api.rentcast.io/v1/properties/sale` +
  `?latitude=${lat}` +
  `&longitude=${lng}` +
  `&radius=${radius}` +
  `&soldWithinMonths=6`;

  const rc = await fetch(url,{
    headers:{
      "X-Api-Key":RENTCAST_KEY
    }
  });

  const sales = await rc.json();

  if(!Array.isArray(sales)){
    return NextResponse.json({results:[]});
  }

  // ---------- STORE CACHE ----------

  const rows = sales.map((s:any)=>({

    address:s.formattedAddress ?? s.addressLine1,

    lat:s.latitude,
    lon:s.longitude,

    sale_price:s.lastSalePrice,
    sale_date:s.lastSaleDate,

    tile_lat:tileLat,
    tile_lon:tileLon

  }));

  await supabase.from("rentcast_cache").insert(rows);

  await supabase.from("rentcast_api_usage").insert({

    lat,
    lon:lng,
    radius

  });

  return NextResponse.json({

    source:"rentcast",
    results:rows

  });

}
