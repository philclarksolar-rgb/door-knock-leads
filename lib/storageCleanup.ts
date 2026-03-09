import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TARGET_PERCENT = 0.90
const STORAGE_LIMIT_BYTES = 1000000000

async function getUsage() {

  const { data } = await supabase
    .from("storage_usage")
    .select("*")
    .order("checked_at", { ascending:false })
    .limit(1)

  return data?.[0] || null
}

async function deleteFolder(prefix:string) {

  const { data } = await supabase
    .storage
    .from("lead-files")
    .list(prefix)

  if (!data) return

  for (const file of data) {

    await supabase
      .storage
      .from("lead-files")
      .remove([`${prefix}/${file.name}`])

  }
}

async function deleteRentcastCache() {

  await supabase
    .from("rentcast_cache")
    .delete()
}

export async function dischargeStorage() {

  const usage = await getUsage()

  if (!usage) return

  const targetBytes = STORAGE_LIMIT_BYTES * TARGET_PERCENT

  if (usage.bytes_used <= targetBytes) return

  await deleteFolder("roof")

  const afterRoof = await getUsage()

  if (afterRoof.bytes_used <= targetBytes) return

  await deleteFolder("panel")

  const afterPanel = await getUsage()

  if (afterPanel.bytes_used <= targetBytes) return

  await deleteRentcastCache()
}
