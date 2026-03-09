"use client";

import React from "react";
import FileUploader from "@/components/FileUploader";

export default function LeadDetails({
  lead,
  noteText,
  setNoteText,
  contactMade,
  setContactMade,
  newReminderDate,
  setNewReminderDate,
  onClose,
  onSaveReminder,
  onContactAgain,
  onAddNote,
  onMarkClosedDeal,
  onMarkCancelledDeal,
  onReviveDeal,
  onUpdateLead,
  onDeleteLead,
  sessionUserId,
  role,
}: any) {
  if (!lead) return null;

  const isAdmin = role === "admin" || role === "master_admin";
  const readOnly = isAdmin && lead.ownerUserId && lead.ownerUserId !== sessionUserId;

  function handleUploaded(pathKey: string, path: string) {
    if (readOnly) return;
    onUpdateLead({
      [pathKey]: path,
    });
  }

  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Lead Details</div>
          <div className="text-sm text-slate-500">{lead.address}</div>
          <div className="text-sm text-slate-500">
            Owner: {lead.creatorName || "Unknown"}
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-2xl border px-3 py-2 text-sm"
        >
          Close
        </button>
      </div>

      {readOnly ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Admin read-only mode. You can view this rep’s lead but cannot edit it.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm font-medium">Full Name</div>
          <div className="mt-1 rounded-2xl border bg-slate-50 px-3 py-2">
            {lead.fullName || "—"}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">Phone</div>
          <div className="mt-1 rounded-2xl border bg-slate-50 px-3 py-2">
            {lead.phone || "—"}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-medium">Email</div>
          <div className="mt-1 rounded-2xl border bg-slate-50 px-3 py-2">
            {lead.email || "—"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 rounded-2xl border p-3">
          <div className="font-medium">Roof Photo</div>
          {!readOnly ? (
            <FileUploader
              leadId={lead.id}
              type="roof"
              onUploaded={(path) => handleUploaded("roofPhotoPath", path)}
            />
          ) : null}
          <div className="text-sm text-slate-500">
            {lead.roofPhotoPath ? "Uploaded" : "None"}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border p-3">
          <div className="font-medium">Electrical Panel</div>
          {!readOnly ? (
            <FileUploader
              leadId={lead.id}
              type="panel"
              onUploaded={(path) => handleUploaded("panelPhotoPath", path)}
            />
          ) : null}
          <div className="text-sm text-slate-500">
            {lead.panelPhotoPath ? "Uploaded" : "None"}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border p-3">
          <div className="font-medium">Utility Bill (PDF)</div>
          {!readOnly ? (
            <FileUploader
              leadId={lead.id}
              type="bill"
              onUploaded={(path) => handleUploaded("utilityBillPath", path)}
            />
          ) : null}
          <div className="text-sm text-slate-500">
            {lead.utilityBillPath ? "Uploaded" : "None"}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="font-medium">Reminder</div>

        <input
          type="date"
          value={newReminderDate || lead.reminderDate || ""}
          onChange={(e) => setNewReminderDate(e.target.value)}
          disabled={readOnly}
          className="w-full rounded-2xl border px-3 py-2 disabled:bg-slate-100"
        />

        {!readOnly ? (
          <button
            onClick={onSaveReminder}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            Save Reminder
          </button>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="font-medium">Contact Log</div>

        <select
          value={contactMade}
          onChange={(e) => setContactMade(e.target.value)}
          disabled={readOnly}
          className="w-full rounded-2xl border px-3 py-2 disabled:bg-slate-100"
        >
          <option value="yes">Contact Made</option>
          <option value="no">No Contact</option>
        </select>

        {!readOnly ? (
          <button
            onClick={onContactAgain}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            Add Contact Entry
          </button>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="font-medium">Notes</div>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          disabled={readOnly}
          rows={4}
          className="w-full rounded-2xl border px-3 py-2 disabled:bg-slate-100"
        />

        {!readOnly ? (
          <button
            onClick={onAddNote}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            Add Note
          </button>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={onMarkClosedDeal}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-white"
          >
            Mark as Closed Deal
          </button>

          <button
            onClick={onMarkCancelledDeal}
            className="rounded-2xl bg-red-600 px-4 py-2 text-white"
          >
            Mark as Cancelled Deal
          </button>

          <button
            onClick={onReviveDeal}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-white"
          >
            Revive Deal
          </button>

          <button
            onClick={onDeleteLead}
            className="rounded-2xl border border-red-300 px-4 py-2 text-red-700"
          >
            Delete Lead
          </button>
        </div>
      ) : null}
    </div>
  );
}
