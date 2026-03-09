import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadFile(
  file: File,
  type: "roof" | "panel" | "bill",
  leadId: string
) {

  const fileName =
    `${leadId}_${Date.now()}_${file.name}`

  const path =
    `${type}/${fileName}`

  const { data, error } =
    await supabase.storage
      .from("lead-files")
      .upload(path, file)

  if (error) throw error

  const { data: publicUrl } =
    supabase.storage
      .from("lead-files")
      .getPublicUrl(path)

  return {
    path,
    url: publicUrl.publicUrl
  }

}
