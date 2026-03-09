"use client"

import { useState } from "react"
import { uploadFile } from "@/lib/uploadFile"

type Props = {
  leadId: string
  type: "roof" | "panel" | "bill"
  onUploaded: (path: string) => void
}

export default function FileUploader({
  leadId,
  type,
  onUploaded
}: Props) {

  const [uploading,setUploading] = useState(false)

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ){

    const file = e.target.files?.[0]

    if(!file) return

    setUploading(true)

    try{

      const result =
        await uploadFile(file,type,leadId)

      onUploaded(result.path)

    }catch(err){

      alert("Upload failed")

    }

    setUploading(false)

  }

  return (

    <div className="space-y-2">

      <input
        type="file"
        accept={
          type === "bill"
            ? "application/pdf"
            : "image/*"
        }
        onChange={handleUpload}
      />

      {uploading && (
        <div className="text-sm text-gray-500">
          Uploading...
        </div>
      )}

    </div>

  )

}
