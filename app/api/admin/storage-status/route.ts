import { NextResponse } from "next/server"
import { checkStorageUsage } from "@/lib/storageMonitor"
import { getSystemSettings } from "@/lib/recentSalesSettings"

export async function GET() {

  try {

    const usage = await checkStorageUsage()

    const settings = await getSystemSettings()

    return NextResponse.json({
      bytes: usage.bytes,
      percent: usage.percent,
      attachmentsFrozen:
        settings.attachments_global_freeze === "true"
    })

  } catch (error:any) {

    return NextResponse.json(
      { error:error?.message },
      { status:500 }
    )

  }
}
