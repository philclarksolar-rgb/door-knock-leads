"use client";

import React from "react";
import { Clock } from "lucide-react";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function LeadContactLog({
  contactMade,
  setContactMade,
  onContactAgain,
  contactLog,
}: {
  contactMade: string;
  setContactMade: React.Dispatch<React.SetStateAction<string>>;
  onContactAgain: () => void;
  contactLog: Array<{
    id: string;
    label: string;
    contactMade: boolean;
    at: string;
  }>;
}) {
  return (
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
        {contactLog.slice().reverse().map((entry) => (
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
  );
}
