"use client";

import React from "react";

type RecentSale = {
  address: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
};

export default function SatellitePreviewModal({
  sale,
  open,
  onClose,
}: {
  sale: RecentSale | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !sale) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <div className="font-semibold">Satellite Preview</div>
          <div className="text-sm text-slate-600">
            {sale.formattedAddress || sale.address}
          </div>
        </div>

        <button
          onClick={onClose}
          className="border px-3 py-1 rounded-lg"
        >
          Close
        </button>
      </div>

      <iframe
        title="Satellite Preview"
        className="h-[calc(100vh-80px)] w-full"
        src={`https://www.arcgis.com/home/webmap/viewer.html?center=${sale.longitude},${sale.latitude}&level=19&basemapUrl=https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`}
      />
    </div>
  );
}
