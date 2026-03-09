"use client";

import React, { useRef } from "react";
import {
  Image as ImageIcon,
  FileText,
  Upload,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type LeadAttachmentLead = {
  id: string;
  roofPhotoPath?: string | null;
  panelPhotoPath?: string | null;
  utilityBillPath?: string | null;
};

function publicUrl(path?: string | null) {
  if (!path) return "";
  const { data } = supabase.storage
    .from("lead-attachments")
    .getPublicUrl(path);
  return data.publicUrl;
}

function safeFileName(original: string) {
  return original.replace(/[^\w\d.\-]/g, "_").toLowerCase();
}

export default function LeadAttachments({
  lead,
  updateLead,
}: {
  lead: LeadAttachmentLead;
  updateLead: (updates: Partial<LeadAttachmentLead>) => void;
}) {
  const roofInput = useRef<HTMLInputElement>(null);
  const panelInput = useRef<HTMLInputElement>(null);
  const billInput = useRef<HTMLInputElement>(null);

  async function uploadFile(
    file: File,
    category: "roof" | "panel" | "bill"
  ) {
    const fileName = safeFileName(file.name);
    const path = `${lead.id}/${category}-${Date.now()}-${fileName}`;

    const { error } = await supabase.storage
      .from("lead-attachments")
      .upload(path, file);

    if (error) {
      alert("Upload failed.");
      return;
    }

    if (category === "roof") updateLead({ roofPhotoPath: path });
    if (category === "panel") updateLead({ panelPhotoPath: path });
    if (category === "bill") updateLead({ utilityBillPath: path });
  }

  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    category: "roof" | "panel"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    alert(
      "Reminder: Please turn OFF Live Photos before uploading roof or panel images."
    );

    uploadFile(file, category);
  }

  function handleBillUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Utility bill must be a PDF file.");
      return;
    }

    uploadFile(file, "bill");
  }

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="font-medium">Attachments</div>

      {/* Roof Photo */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <ImageIcon className="h-4 w-4" />
          Roof Photo
        </div>

        {lead.roofPhotoPath ? (
          <a
            href={publicUrl(lead.roofPhotoPath)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm underline"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        ) : (
          <>
            <button
              onClick={() => roofInput.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-white text-sm"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>

            <input
              type="file"
              accept="image/*"
              ref={roofInput}
              hidden
              onChange={(e) => handleImageUpload(e, "roof")}
            />
          </>
        )}
      </div>

      {/* Panel Photo */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <ImageIcon className="h-4 w-4" />
          Panel Photo
        </div>

        {lead.panelPhotoPath ? (
          <a
            href={publicUrl(lead.panelPhotoPath)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm underline"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        ) : (
          <>
            <button
              onClick={() => panelInput.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-white text-sm"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>

            <input
              type="file"
              accept="image/*"
              ref={panelInput}
              hidden
              onChange={(e) => handleImageUpload(e, "panel")}
            />
          </>
        )}
      </div>

      {/* Utility Bill */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Utility Bill (PDF)
        </div>

        {lead.utilityBillPath ? (
          <a
            href={publicUrl(lead.utilityBillPath)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm underline"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        ) : (
          <>
            <button
              onClick={() => billInput.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-white text-sm"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>

            <input
              type="file"
              accept="application/pdf"
              ref={billInput}
              hidden
              onChange={handleBillUpload}
            />
          </>
        )}
      </div>
    </div>
  );
}
