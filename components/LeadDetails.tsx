"use client";

import React from "react";
import {
  Bell,
  Clock,
  FileText,
  MapPin,
  Trash2,
  X,
  ExternalLink,
  Mic,
  MicOff,
} from "lucide-react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

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
  const [isDictating, setIsDictating] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  function startDictation() {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      alert("Voice dictation is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsDictating(true);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognition.onerror = () => {
      setIsDictating(false);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setNoteText((prev) => {
        const base = prev.trim();
        const next = transcript.trim();
        if (!next) return prev;
        return base ? `${base} ${next}` : next;
      });
    };

    recognition.start();
  }

  function stopDictation() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsDictating(false);
  }

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

        <div className="flex flex-wrap gap-2">
          {!isDictating ? (
            <button
              onClick={startDictation}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-white"
            >
              <Mic className="h-4 w-4" /> Start Dictation
            </button>
          ) : (
            <button
              onClick={stopDictation}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-white"
            >
              <MicOff className="h-4 w-4" /> Stop Dictation
            </button>
          )}

          {isDictating ? (
            <div className="self-center text-sm text-red-600">Listening…</div>
          ) : null}
        </div>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="min-h-[120px] w-full rounded-2xl border px-3 py-2"
          placeholder="Type or dictate note here"
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
