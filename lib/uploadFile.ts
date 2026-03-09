import { createClient } from "@supabase/supabase-js"
import { attachmentsAllowed } from "./attachmentGuard"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadFile(
  file: File,
  type: "roof" | "panel" | "bill",
  leadId: string
){

  const allowed = await attachmentsAllowed()

  if(!allowed){

    throw new Error(
      "Attachments are temporarily disabled because storage is nearly full."
    )

  }

  const fileName =
    `${leadId}_${Date.now()}_${file.name}`

  const path =
    `${type}/${fileName}`

  const { error } =
    await supabase.storage
      .from("lead-files")
      .upload(path,file)

  if(error){
    throw error
  }

  const { data } =
    supabase.storage
      .from("lead-files")
      .getPublicUrl(path)

  return {
    path,
    url: data.publicUrl
  }

}
