import { createClient } from "@supabase/supabase-js"
import { attachmentsAllowed } from "./attachmentGuard"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function compressImage(file:File){

  if(!file.type.startsWith("image")){
    return file
  }

  const imageBitmap =
    await createImageBitmap(file)

  const canvas =
    document.createElement("canvas")

  const maxSize = 1600

  let width = imageBitmap.width
  let height = imageBitmap.height

  if(width > maxSize || height > maxSize){

    const ratio =
      Math.min(
        maxSize / width,
        maxSize / height
      )

    width = width * ratio
    height = height * ratio

  }

  canvas.width = width
  canvas.height = height

  const ctx =
    canvas.getContext("2d")

  ctx?.drawImage(
    imageBitmap,
    0,
    0,
    width,
    height
  )

  const blob =
    await new Promise<Blob>((resolve)=>{

      canvas.toBlob(
        (b)=>resolve(b!),
        "image/jpeg",
        0.75
      )

    })

  return new File(
    [blob],
    file.name.replace(/\..+$/,".jpg"),
    { type:"image/jpeg" }
  )

}

export async function uploadFile(
  file:File,
  type:"roof"|"panel"|"bill",
  leadId:string
){

  const allowed =
    await attachmentsAllowed()

  if(!allowed){

    throw new Error(
      "Attachments are disabled because storage is nearly full."
    )

  }

  if(type !== "bill"){

    file =
      await compressImage(file)

  }

  const fileName =
    `${leadId}_${type}.${type==="bill"?"pdf":"jpg"}`

  const path =
    `${type}/${fileName}`

  const { error } =
    await supabase.storage
      .from("lead-files")
      .upload(path,file,{
        upsert:true
      })

  if(error){
    throw error
  }

  const { data } =
    supabase.storage
      .from("lead-files")
      .getPublicUrl(path)

  return{
    path,
    url:data.publicUrl
  }

}
