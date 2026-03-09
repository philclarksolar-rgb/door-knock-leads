"use client";

import React from "react";
import { statusFilterOptions, type LeadStatus } from "../../lib/leadUtils";

export default function StatusFilter({
  statusFilter,
  setStatusFilter,
  includeClosedDeals,
  setIncludeClosedDeals,
}: {
  statusFilter: "all" | LeadStatus;
  setStatusFilter: (value: "all" | LeadStatus) => void;
  includeClosedDeals: boolean;
  setIncludeClosedDeals: (value: boolean) => void;
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="mt-1 w-full rounded-2xl border px-3 py-2"
        >
          <option value="all">All statuses</option>
          {statusFilterOptions().map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeClosedDeals}
          onChange={(e) => setIncludeClosedDeals(e.target.checked)}
        />
        Include closed deals
      </label>
    </>
  );
}
