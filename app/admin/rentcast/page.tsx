"use client";

import React, { useEffect, useState } from "react";

type RentcastStatus = {
  requestCount: number;
  globalFreeze: boolean;
  paidLockUntilReset: boolean;
  alertPending: boolean;
  error?: string;
};

function statusColor(count: number) {
  if (count >= 50) return "text-red-700 bg-red-50 border-red-200";
  if (count >= 45) return "text-orange-700 bg-orange-50 border-orange-200";
  if (count >= 30) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}

export default function RentcastAdminPage() {
  const [status, setStatus] = useState<RentcastStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function loadStatus() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rentcast-control", {
        cache: "no-store",
      });
      const data = await res.json();
      setStatus(data);
    } catch (error: any) {
      setStatus({
        requestCount: 0,
        globalFreeze: false,
        paidLockUntilReset: false,
        alertPending: false,
        error: error?.message || "Could not load RentCast status.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string) {
    try {
      setWorking(true);
      setMessage("");

      const res = await fetch("/api/admin/rentcast-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Action failed.");
      }

      setStatus(data);
      setMessage(`Action completed: ${action}`);
    } catch (error: any) {
      setMessage(error?.message || "Action failed.");
    } finally {
      setWorking(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white">
          <div className="text-3xl font-bold">RentCast Admin Controls</div>
          <div className="mt-2 text-slate-300">
            Control API freezing, paid-territory lockouts, and alert state.
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            Loading RentCast status...
          </div>
        ) : null}

        {!loading && status ? (
          <>
            {status.alertPending ? (
              <div className="rounded-3xl border border-orange-300 bg-orange-50 p-5 shadow-sm">
                <div className="text-lg font-semibold text-orange-800">
                  Warning: RentCast hit 45 requests this month
                </div>
                <div className="mt-2 text-sm text-orange-700">
                  Cache is now frozen for non-admin users. Cached data remains
                  available. You can clear this warning after reviewing it.
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => runAction("clear45Alert")}
                    disabled={working}
                    className="rounded-2xl bg-orange-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Clear 45-Request Warning
                  </button>
                </div>
              </div>
            ) : null}

            {status.error ? (
              <div className="rounded-3xl border border-red-300 bg-red-50 p-5 shadow-sm text-red-700">
                {status.error}
              </div>
            ) : null}

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">Monthly RentCast Usage</div>
                  <div className="mt-2 text-sm text-slate-500">
                    Tracks real RentCast calls this calendar month.
                  </div>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 text-lg font-semibold ${statusColor(
                    status.requestCount
                  )}`}
                >
                  {status.requestCount} / 50
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold">Global Freeze</div>
                <div className="mt-2 text-sm text-slate-500">
                  Freezes or unfreezes new RentCast requests across the whole system.
                </div>

                <div className="mt-4 rounded-2xl border px-4 py-3">
                  <div className="text-sm text-slate-500">Current state</div>
                  <div className="mt-1 font-medium">
                    {status.globalFreeze ? "Frozen" : "Not frozen"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => runAction("freeze")}
                    disabled={working}
                    className="rounded-2xl bg-red-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Freeze RentCast
                  </button>

                  <button
                    onClick={() => runAction("unfreeze")}
                    disabled={working}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Unfreeze RentCast
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold">Paid Territory Lock</div>
                <div className="mt-2 text-sm text-slate-500">
                  Blocks all new paid-territory RentCast calls until the month resets.
                </div>

                <div className="mt-4 rounded-2xl border px-4 py-3">
                  <div className="text-sm text-slate-500">Current state</div>
                  <div className="mt-1 font-medium">
                    {status.paidLockUntilReset
                      ? "Locked until reset"
                      : "Paid requests allowed with admin approval"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => runAction("lockPaid")}
                    disabled={working}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Disable Paid Requests
                  </button>

                  <button
                    onClick={() => runAction("unlockPaid")}
                    disabled={working}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    Allow Paid Requests
                  </button>
                </div>
              </div>
            </div>

            {message ? (
              <div className="rounded-3xl border bg-white p-4 shadow-sm text-sm text-slate-700">
                {message}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
