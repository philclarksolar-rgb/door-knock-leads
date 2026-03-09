"use client";

import React from "react";
import { Database } from "lucide-react";

export type LeadTableLead = {
  id: string;
  fullName: string;
  createdAt: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export default function LeadTable({
  leads,
  currentPage,
  totalPages,
  onSelectLead,
  onPrevPage,
  onNextPage,
}: {
  leads: LeadTableLead[];
  currentPage: number;
  totalPages: number;
  onSelectLead: (id: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="inline-flex items-center gap-2 text-lg font-semibold">
          <Database className="h-5 w-5" /> Lead Database
        </div>
        <div className="text-sm text-slate-500">{leads.length} visible</div>
      </div>

      <div className="grid grid-cols-[1.8fr_1fr] gap-3 border-b bg-slate-50 px-3 py-3 text-xs font-medium uppercase text-slate-500">
        <div>Name</div>
        <div>Created</div>
      </div>

      {leads.length === 0 ? (
        <div className="px-4 py-8 text-sm text-slate-500">No leads found.</div>
      ) : (
        leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onSelectLead(lead.id)}
            className="grid w-full grid-cols-[1.8fr_1fr] items-center gap-3 border-b px-3 py-3 text-left text-sm hover:bg-slate-50"
          >
            <div className="truncate font-medium">{lead.fullName || "—"}</div>
            <div className="text-slate-500">{formatDate(lead.createdAt)}</div>
          </button>
        ))
      )}

      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-sm text-slate-500">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={onPrevPage}
            className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={onNextPage}
            className="rounded-2xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
