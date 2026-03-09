"use client";

import React from "react";

export default function SpecificSearchFields({
  text,
  setText,
}: {
  text: string;
  setText: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">Name / Address / Phone / Email</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-1 w-full rounded-2xl border px-3 py-2"
      />
    </div>
  );
}
