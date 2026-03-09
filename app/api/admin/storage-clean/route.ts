import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getStorageUsage } from "@/lib/storageMonitor"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STORAGE_LIMIT_BYTES = 1000000000
const TARGET_PERCENT = 0.90

async function deleteFolder(prefix:string){

  const { data } =
    await supabase.storage
      .from("lead-files")
      .list(prefix,{ limit:1000 })

  if(!data) return

  for(const file of data){

    await supabase.storage
      .from("lead-files")
      .remove([`${prefix}/${file.name}`])

  }

}

async function deleteRentcastCache(){

  await supabase
    .from("rentcast_cache")
    .delete()
    .neq("id","00000000-0000-0000-0000-000000000000")

}

export async function POST(){

  try{

    let usage = await getStorageUsage()

    const targetBytes =
      STORAGE_LIMIT_BYTES * TARGET_PERCENT

    if(usage.bytes <= targetBytes){

      return NextResponse.json({
        success:true,
        message:"Storage already below 90%"
      })

    }

    /* STEP 1 — delete roof photos */

    await deleteFolder("roof")

    usage = await getStorageUsage()

    if(usage.bytes <= targetBytes){

      return NextResponse.json({
        success:true,
        message:"Roof photos cleared"
      })

    }

    /* STEP 2 — delete panel photos */

    await deleteFolder("panel")

    usage = await getStorageUsage()

    if(usage.bytes <= targetBytes){

      return NextResponse.json({
        success:true,
        message:"Panel photos cleared"
      })

    }

    /* STEP 3 — delete recent homes cache */

    await deleteRentcastCache()

    return NextResponse.json({
      success:true,
      message:"Cache cleared"
    })

  }catch(error:any){

    return NextResponse.json(
      {
        success:false,
        error:error?.message || "cleanup failed"
      },
      { status:500 }
    )

  }

}
