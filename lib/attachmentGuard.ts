import { getStorageUsage } from "./storageMonitor"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FREEZE_THRESHOLD = 0.95

export async function attachmentsAllowed() {

  const usage = await getStorageUsage()

  if (usage.percent >= FREEZE_THRESHOLD) {

    await supabase
      .from("system_settings")
      .upsert({
        key: "attachments_global_freeze",
        value: "true"
      })

    return false
  }

  const { data } =
    await supabase
      .from("system_settings")
      .select("value")
      .eq("key","attachments_global_freeze")
      .single()

  if(data?.value === "true"){
    return false
  }

  return true

}
