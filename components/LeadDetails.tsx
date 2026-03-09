"use client"

import FileUploader from "@/components/FileUploader"

type Lead = {
  id: string
  fullName: string
  phone: string
  address: string
  roofPhotoPath?: string | null
  panelPhotoPath?: string | null
  utilityBillPath?: string | null
}

type Props = {
  lead: Lead | null
  onUpdateLead: (updates:any)=>void
}

export default function LeadDetails({
  lead,
  onUpdateLead
}:Props){

  if(!lead){
    return null
  }

  return (

    <div className="space-y-6 border rounded-2xl p-4 bg-white">

      <div className="text-xl font-semibold">
        Lead Details
      </div>

      <div>
        <div className="font-medium">
          {lead.fullName}
        </div>

        <div className="text-sm text-gray-600">
          {lead.phone}
        </div>

        <div className="text-sm text-gray-600">
          {lead.address}
        </div>
      </div>

      {/* Roof Photo */}

      <div className="space-y-2">

        <div className="font-medium">
          Roof Photo
        </div>

        <FileUploader
          leadId={lead.id}
          type="roof"
          onUploaded={(path)=>{

            onUpdateLead({
              ...lead,
              roofPhotoPath:path
            })

          }}
        />

        {lead.roofPhotoPath && (
          <div className="text-sm text-gray-500">
            Uploaded
          </div>
        )}

      </div>

      {/* Panel Photo */}

      <div className="space-y-2">

        <div className="font-medium">
          Electrical Panel
        </div>

        <FileUploader
          leadId={lead.id}
          type="panel"
          onUploaded={(path)=>{

            onUpdateLead({
              ...lead,
              panelPhotoPath:path
            })

          }}
        />

        {lead.panelPhotoPath && (
          <div className="text-sm text-gray-500">
            Uploaded
          </div>
        )}

      </div>

      {/* Utility Bill */}

      <div className="space-y-2">

        <div className="font-medium">
          Utility Bill (PDF)
        </div>

        <FileUploader
          leadId={lead.id}
          type="bill"
          onUploaded={(path)=>{

            onUpdateLead({
              ...lead,
              utilityBillPath:path
            })

          }}
        />

        {lead.utilityBillPath && (
          <div className="text-sm text-gray-500">
            Uploaded
          </div>
        )}

      </div>

    </div>

  )

}
