import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req:Request){

  try{

    const body = await req.json()

    const action = body.action

    if(action === "freeze"){

      await supabase
        .from("system_settings")
        .upsert({
          key:"attachments_global_freeze",
          value:"true"
        })

    }

    if(action === "unfreeze"){

      await supabase
        .from("system_settings")
        .upsert({
          key:"attachments_global_freeze",
          value:"false"
        })

    }

    return NextResponse.json({
      success:true
    })

  }catch(error:any){

    return NextResponse.json(
      {
        success:false,
        error:error?.message || "attachment control failed"
      },
      { status:500 }
    )

  }

}
