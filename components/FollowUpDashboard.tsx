"use client";

import React from "react";

type Lead = {
  id: string;
  fullName: string;
  address: string;
  reminderDate?: string | null;
  createdAt: string;
  isClosed?: boolean;
  isCancelled?: boolean;
};

function isExpiring(lead: Lead) {
  const created = new Date(lead.createdAt);
  const now = new Date();
  const ageDays =
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

  return ageDays >= 7 && ageDays < 14;
}

export default function FollowUpDashboard({
  leads,
  onOpenLead,
}: {
  leads: Lead[];
  onOpenLead: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const followupsToday = leads.filter(
    (l) =>
      !l.isClosed &&
      !l.isCancelled &&
      l.reminderDate &&
      l.reminderDate.slice(0, 10) === today
  );

  const expiringRecent = leads.filter(
    (l) => !l.isClosed && !l.isCancelled && !l.reminderDate && isExpiring(l)
  );

  return (
    <div className="space-y-4">

      {/* TODAY'S FOLLOWUPS */}

      <div className="rounded-2xl border p-4">
        <div className="font-semibold mb-3">
          TODAY'S FOLLOWUPS
        </div>

        {followupsToday.length === 0 && (
          <div className="text-sm text-gray-500">
            None scheduled today
          </div>
        )}

        {followupsToday.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onOpenLead(lead.id)}
            className="p-3 rounded-xl border mb-2 cursor-pointer hover:bg-slate-100"
          >
            <div className="font-medium">{lead.fullName}</div>
            <div className="text-sm text-gray-500">{lead.address}</div>
          </div>
        ))}
      </div>

      {/* FOLLOWUP CALENDAR */}

      <div className="rounded-2xl border p-4">
        <div className="font-semibold mb-3">
          FOLLOWUP CALENDAR
        </div>

        {leads
          .filter((l) => l.reminderDate && !l.isClosed && !l.isCancelled)
          .sort(
            (a, b) =>
              new Date(a.reminderDate!).getTime() -
              new Date(b.reminderDate!).getTime()
          )
          .slice(0, 10)
          .map((lead) => (
            <div
              key={lead.id}
              onClick={() => onOpenLead(lead.id)}
              className="p-3 rounded-xl border mb-2 cursor-pointer hover:bg-slate-100"
            >
              <div className="font-medium">{lead.fullName}</div>
              <div className="text-sm text-gray-500">
                {lead.reminderDate}
              </div>
            </div>
          ))}
      </div>

      {/* EXPIRING LEADS */}

      <div className="rounded-2xl border p-4">
        <div className="font-semibold mb-3">
          RECENTLY EXPIRING LEADS
        </div>

        {expiringRecent.length === 0 && (
          <div className="text-sm text-gray-500">
            None recently expiring
          </div>
        )}

        {expiringRecent.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onOpenLead(lead.id)}
            className="p-3 rounded-xl border mb-2 cursor-pointer hover:bg-yellow-50"
          >
            <div className="font-medium">{lead.fullName}</div>
            <div className="text-sm text-gray-500">{lead.address}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
