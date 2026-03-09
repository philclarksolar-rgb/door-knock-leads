"use client";

import React from "react";

function toDateInputValue(d?: Date | string | null) {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function ChronologicalSearchFields({
  chronologicalPreset,
  setChronologicalPreset,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd,
}: {
  chronologicalPreset: "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom";
  setChronologicalPreset: (
    value: "today" | "yesterday" | "thisWeek" | "thisMonth" | "custom"
  ) => void;
  dateStart: string;
  setDateStart: (value: string) => void;
  dateEnd: string;
  setDateEnd: (value: string) => void;
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium">Time Range</label>
        <select
          value={chronologicalPreset}
          onChange={(e) => setChronologicalPreset(e.target.value as any)}
          className="mt-1 w-full rounded-2xl border px-3 py-2"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {chronologicalPreset === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Start</label>
            <input
              type="date"
              max={toDateInputValue(new Date())}
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="mt-1 w-full rounded-2xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End</label>
            <input
              type="date"
              max={toDateInputValue(new Date())}
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="mt-1 w-full rounded-2xl border px-3 py-2"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
