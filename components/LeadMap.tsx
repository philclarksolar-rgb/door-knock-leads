"use client";

// @ts-nocheck

import React, { useEffect, useRef } from "react";

export type LeadMapLead = {
  id: string;
  fullName: string;
  address: string;
  lat: number | null;
  lon: number | null;
  createdAt?: string;
};

function averageCenter(points: LeadMapLead[]) {
  const valid = points.filter(
    (p) => typeof p.lat === "number" && typeof p.lon === "number"
  );

  if (valid.length === 0) {
    return [32.7157, -117.1611];
  }

  const avgLat = valid.reduce((sum, p) => sum + p.lat, 0) / valid.length;
  const avgLon = valid.reduce((sum, p) => sum + p.lon, 0) / valid.length;

  return [avgLat, avgLon];
}

function googleMapsUrl(lat: number, lon: number) {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

function directionsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${lat},${lon}`
  )}&travelmode=driving`;
}

export default function LeadMap({ leads }: { leads: LeadMapLead[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: any;
    let L: any;

    async function initMap() {
      if (!mapRef.current) return;

      const plotted = leads.filter(
        (lead) => typeof lead.lat === "number" && typeof lead.lon === "number"
      );

      const center = averageCenter(plotted);

      const leaflet = await import("leaflet");
      L = leaflet.default;

      if (mapRef.current._leaflet_id) return;

      map = L.map(mapRef.current).setView(center, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      plotted.forEach((lead) => {
        const marker = L.circleMarker([lead.lat, lead.lon], {
          radius: 10,
          weight: 2,
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:180px">
            <div style="font-weight:600;margin-bottom:6px;">${lead.fullName || "Unnamed Lead"}</div>
            <div style="font-size:14px;margin-bottom:8px;">${lead.address || "No address"}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <a href="${googleMapsUrl(lead.lat, lead.lon)}" target="_blank" rel="noreferrer"
                 style="background:#0f172a;color:white;padding:8px 10px;border-radius:8px;text-align:center;text-decoration:none;font-size:14px;">
                 Open in Maps
              </a>
              <a href="${directionsUrl(lead.lat, lead.lon)}" target="_blank" rel="noreferrer"
                 style="background:#2563eb;color:white;padding:8px 10px;border-radius:8px;text-align:center;text-decoration:none;font-size:14px;">
                 Navigate to Lead
              </a>
            </div>
          </div>
        `);
      });
    }

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [leads]);

  const count = leads.filter(
    (lead) => typeof lead.lat === "number" && typeof lead.lon === "number"
  ).length;

  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b px-4 py-4">
        <div className="text-lg font-semibold">Lead Map</div>
        <div className="text-sm text-slate-500">{count} mapped lead(s)</div>
      </div>

      <div ref={mapRef} className="h-[420px] w-full" />
    </div>
  );
}
