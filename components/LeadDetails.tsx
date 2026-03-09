"use client";

import React from "react";
import { Bell, Clock, FileText, MapPin, Trash2, X, ExternalLink } from "lucide-react";

export type ContactEntry = {
  id: string;
  label: string;
  contactMade: boolean;
  at: string;
};

export type NoteEntry = {
  id: string;
  text: string;
  at: string;
};

export type LeadDetailsLead = {
  id: string;
  fullName: string;
  address: string;
  mapsUrl: string | null;
  reminderDate: string;
  contactLog: ContactEntry[];
  notes: NoteEntry[];
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

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
  onDeleteLead,
}: {
  lead: LeadDetailsLead | null;
  noteText: string;
  setNoteText: React.Dispatch<React.SetStateAction<string>>;
  contactMade: string;
  setContactMade: React.Dispatch<React.SetStateAction<string>>;
  newReminderDate: string;
  setNewReminderDate: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSaveReminder: () => void;
  onContactAgain: () => void;
  onAddNote: () => void;
  onDeleteLead: () => void;
}) {
  if (!lead) return null;

  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{lead.fullName}</div>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border p-4">
        <div className="inline-flex items-center gap-2 font-medium">
          <MapPin className="h-4 w-4" /> Address
        </div>
        <div className="mt-1">{lead.address}</div>
        {lead.mapsUrl ? (
          <a
            href={lead.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm underline"
          >
            <ExternalLink className="h-3 w-3" /> Open in Maps
          </a>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="inline-flex items-center gap-2 font-medium">
          <Bell className="h-4 w-4" /> ADD REMINDER
        </div>
        <input
          type="date"
          value={newReminderDate || lead.reminderDate}
          onChange={(e) => setNewReminderDate(e.target.value)}
          className="w-full rounded-2xl border px-3 py-2"
        />
        <button
          onClick={onSaveReminder}
          className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
        >
          Save Reminder
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="inline-flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4" /> Contact Log
        </div>

        <div className="flex gap-3 items-end">
          <div>
            <label className="text-sm font-medium">Contact Made?</label>
            <select
              value={contactMade}
              onChange={(e) => setContactMade(e.target.value)}
              className="mt-1 rounded-2xl border px-3 py-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <button
            onClick={onContactAgain}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            Contact Again
          </button>
        </div>

        <div className="space-y-2">
          {lead.contactLog.slice().reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between gap-3 rounded-2xl border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{entry.label}</div>
                <div className="text-slate-500">
                  Contact Made: {entry.contactMade ? "Yes" : "No"}
                </div>
              </div>
              <div className="text-slate-500">{formatDateTime(entry.at)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="inline-flex items-center gap-2 font-medium">
          <FileText className="h-4 w-4" /> Notes
        </div>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="min-h-[120px] w-full rounded-2xl border px-3 py-2"
          placeholder="Type note here"
        />

        <div className="flex justify-end">
          <button
            onClick={onAddNote}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
          >
            Add Note
          </button>
        </div>

        <div className="space-y-2">
          {lead.notes.slice().reverse().map((note) => (
            <div key={note.id} className="rounded-2xl border p-3 text-sm">
              <div className="mb-1 text-slate-500">{formatDateTime(note.at)}</div>
              <div className="whitespace-pre-wrap">{note.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onDeleteLead}
          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-white"
        >
          <Trash2 className="h-4 w-4" /> DELETE LEAD
        </button>
      </div>
    </div>
  );
}
