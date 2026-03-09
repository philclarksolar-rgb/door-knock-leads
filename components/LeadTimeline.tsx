"use client";

import React from "react";
import { Clock3 } from "lucide-react";

type ContactEntry = {
  id: string;
  label: string;
  contactMade: boolean;
  at: string;
};

type TimelineLead = {
  createdAt: string;
  reminderDate: string;
  contactLog: ContactEntry[];
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function buildTimeline(lead: TimelineLead) {
  const items: Array<{
    id: string;
    title: string;
    subtitle: string;
    at: string;
  }> = [];

  if (lead.createdAt) {
    items.push({
      id: "lead-created",
      title: "Lead Created",
      subtitle: "Lead entered into the tracker",
      at: lead.createdAt,
    });
  }

  if (lead.reminderDate) {
    items.push({
      id: "followup-scheduled",
      title: "Follow-Up Scheduled",
      subtitle: `Follow-up date set for ${formatDateTime(lead.reminderDate)}`,
      at: lead.reminderDate,
    });
  }

  lead.contactLog
    .filter((entry) => entry.label !== "LEAD CREATION")
    .forEach((entry) => {
      items.push({
        id: `contact-${entry.id}`,
        title: "Contact Attempted",
        subtitle: `Contact made: ${entry.contactMade ? "Yes" : "No"}`,
        at: entry.at,
      });
    });

  return items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

export default function LeadTimeline({
  lead,
}: {
  lead: TimelineLead;
}) {
  const items = buildTimeline(lead);

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="inline-flex items-center gap-2 font-medium">
        <Clock3 className="h-4 w-4" /> Timeline
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-slate-500">No timeline activity yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-sm text-slate-600">{item.subtitle}</div>
              <div className="mt-1 text-xs text-slate-500">
                {formatDateTime(item.at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
