import { NextResponse } from "next/server"
import { dischargeStorage } from "@/lib/storageCleanup"

export async function POST() {

  try {

    await dischargeStorage()

    return NextResponse.json({
      success:true
    })

  } catch (error:any) {

    return NextResponse.json(
      { error:error?.message },
      { status:500 }
    )

  }
}
