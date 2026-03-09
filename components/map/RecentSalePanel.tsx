"use client";

import React from "react";

type RecentSale = {
  id?: string | number;
  address: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  price?: number;
  lastSaleDate?: string;
};

function formatPrice(value?: number) {
  if (!value) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function RecentSalePanel({
  sale,
  onSatellitePreview,
  onCreateLead,
  onClose,
}: {
  sale: RecentSale | null;
  onSatellitePreview: () => void;
  onCreateLead: () => void;
  onClose: () => void;
}) {
  if (!sale) return null;

  return (
    <div className="border rounded-xl p-3 bg-amber-50 space-y-2">
      <div className="font-medium">🏡 Recently Sold</div>

      <div>{sale.formattedAddress || sale.address}</div>

      <div className="text-sm text-slate-600">
        Sold: {sale.lastSaleDate || "—"} · {formatPrice(sale.price)}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onSatellitePreview}
          className="bg-slate-900 text-white px-3 py-1 rounded-lg"
        >
          Satellite Preview
        </button>

        <button
          onClick={onCreateLead}
          className="bg-green-600 text-white px-3 py-1 rounded-lg"
        >
          Create Lead
        </button>

        <button
          onClick={onClose}
          className="border px-3 py-1 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}
