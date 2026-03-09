"use client";

import React from "react";

type Lead = {
  id: string;
  fullName: string;
  createdAt: string;
  reminderDate?: string | null;
  isClosed?: boolean;
  isCancelled?: boolean;
};

function getLeadStatus(lead: Lead) {
  if (lead.isCancelled) return "Cancelled";
  if (lead.isClosed) return "Closed";

  if (lead.reminderDate) return "Followup";

  const created = new Date(lead.createdAt);
  const now = new Date();

  const ageDays =
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays < 7) return "New";
  if (ageDays < 14) return "Expiring";

  return "Old";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    New: "bg-blue-100 text-blue-700",
    Followup: "bg-yellow-100 text-yellow-800",
    Expiring: "bg-orange-100 text-orange-700",
    Old: "bg-gray-200 text-gray-700",
    Closed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function LeadTable({
  leads,
  currentPage,
  totalPages,
  onSelectLead,
  onPrevPage,
  onNextPage,
}: {
  leads: Lead[];
  currentPage: number;
  totalPages: number;
  onSelectLead: (id: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden">

      <div className="px-4 py-3 font-semibold border-b">
        Lead Database
      </div>

      {leads.length === 0 && (
        <div className="p-4 text-sm text-gray-500">
          No leads yet
        </div>
      )}

      {leads.map((lead) => {
        const status = getLeadStatus(lead);

        return (
          <div
            key={lead.id}
            onClick={() => onSelectLead(lead.id)}
            className="flex items-center justify-between px-4 py-3 border-b cursor-pointer hover:bg-slate-100"
          >
            <div>
              <div className="font-medium">
                {lead.fullName}
              </div>

              <div className="text-xs text-gray-500">
                Created{" "}
                {new Date(lead.createdAt).toLocaleDateString()}
              </div>
            </div>

            <StatusBadge status={status} />
          </div>
        );
      })}

      {/* Pagination */}

      <div className="flex items-center justify-between p-3">

        <button
          onClick={onPrevPage}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          Prev
        </button>

        <div className="text-sm">
          Page {currentPage} of {totalPages}
        </div>

        <button
          onClick={onNextPage}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          Next
        </button>

      </div>
    </div>
  );
}
