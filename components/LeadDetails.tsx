"use client";

import React from "react";
import { Bell, MapPin, Trash2, X, ExternalLink } from "lucide-react";
import LeadNotes from "./LeadNotes";
import LeadContactLog from "./LeadContactLog";

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
  isClosed: boolean;
  contactLog: ContactEntry[];
  notes: NoteEntry[];
};

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
  onMarkClosedDeal,
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
  onMarkClosedDeal: () => void;
}) {
  if (!lead) return null;

  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {lead.fullName}
          {lead.isClosed ? (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              Closed Deal
            </span>
          ) : null}
        </div>

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

      {!lead.isClosed ? (
        <div className="rounded-2xl border p-4">
          <button
            onClick={onMarkClosedDeal}
            className="rounded-2xl bg-green-600 px-4 py-2 text-white"
          >
            MARK AS CLOSED DEAL
          </button>
        </div>
      ) : null}

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

      <LeadContactLog
        contactMade={contactMade}
        setContactMade={setContactMade}
        onContactAgain={onContactAgain}
        contactLog={lead.contactLog}
      />

      <LeadNotes
        noteText={noteText}
        setNoteText={setNoteText}
        onAddNote={onAddNote}
        notes={lead.notes}
      />

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
