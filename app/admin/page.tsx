"use client"

import { useEffect, useState } from "react"

export default function AdminPage(){

  const [storage,setStorage] = useState<any>(null)

  async function refreshStorage(){

    const res =
      await fetch("/api/admin/storage-status")

    const data =
      await res.json()

    setStorage(data)

  }

  async function freezeAttachments(){

    await fetch(
      "/api/admin/attachment-control",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          action:"freeze"
        })
      }
    )

    alert("Attachments frozen")

  }

  async function unfreezeAttachments(){

    await fetch(
      "/api/admin/attachment-control",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          action:"unfreeze"
        })
      }
    )

    alert("Attachments unfrozen")

  }

  async function dischargeStorage(){

    await fetch(
      "/api/admin/storage-clean",
      {
        method:"POST"
      }
    )

    alert("Cleanup complete")

    refreshStorage()

  }

  useEffect(()=>{

    refreshStorage()

  },[])

  return(

    <div className="max-w-3xl mx-auto p-6 space-y-8">

      <div className="text-2xl font-semibold">
        Admin Dashboard
      </div>

      {/* Storage Meter */}

      {storage && (

        <div className="border rounded-xl p-4 bg-white">

          <div className="font-medium mb-2">
            Storage Usage
          </div>

          <div>
            {storage.percentUsed}% used
          </div>

        </div>

      )}

      {/* Attachment Controls */}

      <div className="border rounded-xl p-4 bg-white space-y-3">

        <div className="font-medium">
          Attachment Controls
        </div>

        <button
          onClick={freezeAttachments}
          className="bg-red-600 text-white px-4 py-2 rounded-xl"
        >
          Freeze Attachments
        </button>

        <button
          onClick={unfreezeAttachments}
          className="bg-green-600 text-white px-4 py-2 rounded-xl"
        >
          Unfreeze Attachments
        </button>

      </div>

      {/* Cleanup */}

      <div className="border rounded-xl p-4 bg-white space-y-3">

        <div className="font-medium">
          Storage Cleanup
        </div>

        <button
          onClick={dischargeStorage}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl"
        >
          Discharge Cached Data → 90%
        </button>

      </div>

    </div>

  )

}
