"use client";

import React from "react";

export default function PaidRequestPrompt({
  open,
  disableUntilReset,
  setDisableUntilReset,
  onCancel,
  onProceed,
}: {
  open: boolean;
  disableUntilReset: boolean;
  setDisableUntilReset: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel: () => void;
  onProceed: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="text-lg font-semibold">RentCast paid territory</div>

        <div className="mt-2 text-sm text-slate-600">
          This request is beyond the free monthly limit and may incur charges.
          Proceed?
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disableUntilReset}
            onChange={(e) => setDisableUntilReset(e.target.checked)}
          />
          Disable all new paid RentCast requests until month reset
        </label>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border px-4 py-2"
          >
            No
          </button>

          <button
            onClick={onProceed}
            className="rounded-xl bg-red-600 px-4 py-2 text-white"
          >
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
