"use client";

import React from "react";
import {
  Bell,
  MapPin,
  Trash2,
  X,
  ExternalLink,
  Phone,
  MessageSquare,
  Navigation,
} from "lucide-react";
import LeadNotes from "./LeadNotes";
import LeadContactLog from "./LeadContactLog";
import LeadTimeline from "./LeadTimeline";

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
  isCancelled: boolean;
  phone?: string;
  contactLog: ContactEntry[];
  notes: NoteEntry[];
  createdAt?: string;
};

function normalizedPhone(phone?: string) {
  return (phone || "").replace(/[^\d+]/g, "");
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
  onMarkClosedDeal,
  onMarkCancelledDeal,
  onReviveDeal,
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
  onMarkCancelledDeal: () => void;
  onReviveDeal: () => void;
}) {
  if (!lead) return null;

  const phone = normalizedPhone(lead.phone);
  const canCallOrText = !!phone;

  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {lead.fullName}
          {lead.isCancelled ? (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
              Cancelled Deal
            </span>
          ) : lead.isClosed ? (
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

        <div className="mt-3 flex flex-wrap gap-2">
          {canCallOrText ? (
            <>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                <Phone className="h-4 w-4" /> CALL
              </a>

              <a
                href={`sms:${phone}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                <MessageSquare className="h-4 w-4" /> TEXT
              </a>
            </>
          ) : null}

          {lead.mapsUrl ? (
            <a
              href={lead.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              <Navigation className="h-4 w-4" /> DIRECTIONS
            </a>
          ) : null}
        </div>

        {lead.mapsUrl ? (
          <a
            href={lead.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm underline"
          >
            <ExternalLink className="h-3 w-3" /> Open in Maps
          </a>
        ) : null}
      </div>

      {!lead.isClosed && !lead.isCancelled ? (
        <div className="rounded-2xl border p-4">
          <button
            onClick={onMarkClosedDeal}
            className="rounded-2xl bg-green-600 px-4 py-2 text-white"
          >
            MARK AS CLOSED DEAL
          </button>
        </div>
      ) : null}

      {lead.isClosed ? (
        <div className="rounded-2xl border p-4">
          <button
            onClick={onMarkCancelledDeal}
            className="rounded-2xl bg-red-600 px-4 py-2 text-white"
          >
            MARK AS CANCELLED DEAL
          </button>
        </div>
      ) : null}

      {lead.isCancelled ? (
        <div className="space-y-3 rounded-2xl border p-4">
          <div className="inline-flex items-center gap-2 font-medium">
            <Bell className="h-4 w-4" /> REVIVE DEAL
          </div>

          <input
            type="date"
            value={newReminderDate}
            onChange={(e) => setNewReminderDate(e.target.value)}
            className="w-full rounded-2xl border px-3 py-2"
          />

          <button
            onClick={onReviveDeal}
            className="rounded-2xl bg-amber-600 px-4 py-2 text-white"
          >
            REVIVE DEAL
          </button>
        </div>
      ) : null}

      {!lead.isCancelled ? (
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
      ) : null}

      <LeadTimeline
        lead={{
          createdAt: lead.createdAt || "",
          reminderDate: lead.reminderDate,
          contactLog: lead.contactLog,
        }}
      />

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
