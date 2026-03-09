"use client";

import { useMemo } from "react";
import { computeLeadStatus } from "../lib/leadUtils";

export default function FollowUpDashboard({ leads }: any) {
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);

  const followUpsToday = useMemo(() => {
    return leads.filter((lead: any) => {
      if (!lead.reminderDate) return false;
      return lead.reminderDate.slice(0, 10) === todayString;
    });
  }, [leads, todayString]);

  const expiringLeads = useMemo(() => {
    const now = new Date();

    return leads.filter((lead: any) => {
      const status = computeLeadStatus(lead);

      if (status !== "Expiring Lead") return false;

      const created = new Date(lead.createdAt);
      const diffDays =
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays >= 7 && diffDays <= 9;
    });
  }, [leads]);

  const todayCalendar = useMemo(() => {
    return leads
      .filter((lead: any) => lead.reminderDate)
      .sort(
        (a: any, b: any) =>
          new Date(a.reminderDate).getTime() -
          new Date(b.reminderDate).getTime()
      );
  }, [leads]);

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* TODAY FOLLOWUPS */}

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="text-lg font-semibold mb-3">
          Today’s Follow-Ups
        </div>

        {followUpsToday.length === 0 && expiringLeads.length === 0 && (
          <div className="text-sm text-slate-500">
            No follow-ups required today
          </div>
        )}

        <div className="space-y-2">

          {followUpsToday.map((lead: any) => (
            <div
              key={lead.id}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <div className="font-medium">{lead.fullName}</div>
              <div className="text-slate-500">{lead.address}</div>
            </div>
          ))}

          {expiringLeads.map((lead: any) => (
            <div
              key={lead.id}
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm"
            >
              <div className="font-medium">{lead.fullName}</div>
              <div className="text-slate-500">
                Expiring lead — follow up soon
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* FOLLOWUP CALENDAR */}

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="text-lg font-semibold mb-3">
          Follow-Up Calendar
        </div>

        {todayCalendar.length === 0 && (
          <div className="text-sm text-slate-500">
            No scheduled follow-ups
          </div>
        )}

        <div className="space-y-2">

          {todayCalendar.map((lead: any) => (
            <div
              key={lead.id}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <div className="font-medium">
                {new Date(lead.reminderDate).toLocaleDateString()}
              </div>
              <div className="text-slate-500">
                {lead.fullName}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
