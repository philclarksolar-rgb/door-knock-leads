"use client";

import React from "react";

export default function RentcastWarningBanner({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  if (!open) return null;

  return (
    <div className="rounded-xl border border-orange-300 bg-orange-50 p-3">
      <div className="font-medium text-orange-800">
        RentCast hit 45 requests this month
      </div>

      <div className="mt-1 text-sm text-orange-700">
        Cached data remains available. Non-admin users can no longer trigger
        new RentCast requests this month.
      </div>

      <button
        onClick={onDismiss}
        className="mt-3 rounded-lg bg-orange-600 px-3 py-1 text-white"
      >
        Dismiss Warning
      </button>
    </div>
  );
}
