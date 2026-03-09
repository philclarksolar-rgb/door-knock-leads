"use client";

import React from "react";

export default function RepLeadPrompt({
  open,
  repName,
  onCancel,
  onCreateRedundant,
}: {
  open: boolean;
  repName: string;
  onCancel: () => void;
  onCreateRedundant: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="text-lg font-semibold">Existing Rep Lead</div>

        <div className="mt-2 text-sm text-slate-600">
          Rep: {repName || "Unknown"}
        </div>

        <div className="mt-4 text-sm text-slate-600">
          Create a redundant lead for yourself at this address?
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={onCreateRedundant}
            className="rounded-xl bg-slate-900 px-4 py-2 text-white"
          >
            Create Redundant Lead
          </button>
        </div>
      </div>
    </div>
  );
}
