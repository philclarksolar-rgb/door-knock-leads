import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STORAGE_LIMIT_BYTES = 1000000000

export async function getStorageUsage() {

  const { data, error } =
    await supabase.storage.from("lead-files").list("", {
      limit: 10000,
      offset: 0
    })

  if(error){
    throw error
  }

  let totalBytes = 0

  for(const file of data){

    if(file.metadata?.size){
      totalBytes += file.metadata.size
    }

  }

  const percent =
    totalBytes / STORAGE_LIMIT_BYTES

  return {
    bytes: totalBytes,
    percent
  }

}
