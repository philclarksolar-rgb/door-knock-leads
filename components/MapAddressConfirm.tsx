"use client";

import React from "react";

export default function MapAddressConfirm({
  selectedPoint,
  addressInput,
  setAddressInput,
  verifiedAddress,
  onPrefillLeadAddress,
}: any) {

  if (!selectedPoint) return null;

  return (
    <div className="border rounded-xl p-3 bg-yellow-50">

      <div className="font-medium mb-2">
        Confirm Address
      </div>

      <input
        value={addressInput}
        onChange={(e) => setAddressInput(e.target.value)}
        className="w-full border rounded-lg px-2 py-1 mb-2"
      />

      <button
        onClick={() => onPrefillLeadAddress(verifiedAddress)}
        className="bg-green-600 text-white px-3 py-1 rounded-lg"
      >
        Add Lead Here
      </button>

    </div>
  );
}
