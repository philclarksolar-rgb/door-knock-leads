import { NextResponse } from "next/server"
import { getStorageUsage } from "@/lib/storageMonitor"

export async function GET() {

  try {

    const usage = await getStorageUsage()

    return NextResponse.json({
      success: true,
      bytes: usage.bytes,
      percent: usage.percent,
      percentUsed: Math.round(usage.percent * 100)
    })

  } catch (error:any) {

    return NextResponse.json(
      {
        success:false,
        error:error?.message || "storage check failed"
      },
      { status:500 }
    )

  }

}
