import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function haversineMiles(
  lat1:number,
  lon1:number,
  lat2:number,
  lon2:number
){

  const toRad = (v:number)=>(v*Math.PI)/180

  const R = 3958.8

  const dLat = toRad(lat2-lat1)
  const dLon = toRad(lon2-lon1)

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1))*
    Math.cos(toRad(lat2))*
    Math.sin(dLon/2)**2

  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export async function POST(req:Request){

  try{

    const body = await req.json()

    const { lat, lon, radius } = body

    const { data:leads } =
      await supabase
        .from("leads")
        .select("*")

    const nearby =
      leads?.filter((lead:any)=>{

        if(!lead.lat || !lead.lon){
          return false
        }

        const distance =
          haversineMiles(
            lat,
            lon,
            lead.lat,
            lead.lon
          )

        return distance <= radius

      }) || []

    return NextResponse.json({
      leads: nearby
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
