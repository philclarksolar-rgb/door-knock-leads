"use client";

import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

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
    return [32.7157, -117.1611] as [number, number];
  }

  const avgLat =
    valid.reduce((sum, p) => sum + (p.lat as number), 0) / valid.length;
  const avgLon =
    valid.reduce((sum, p) => sum + (p.lon as number), 0) / valid.length;

  return [avgLat, avgLon] as [number, number];
}

function mapsQuery(lat: number, lon: number) {
  return `${lat},${lon}`;
}

function googleMapsUrl(lat: number, lon: number) {
  return `https://maps.google.com/?q=${mapsQuery(lat, lon)}`;
}

function directionsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    mapsQuery(lat, lon)
  )}&travelmode=driving`;
}

export default function LeadMap({
  leads,
}: {
  leads: LeadMapLead[];
}) {
  const plotted = useMemo(
    () =>
      leads.filter(
        (lead) => typeof lead.lat === "number" && typeof lead.lon === "number"
      ),
    [leads]
  );

  const center = useMemo<[number, number]>(() => averageCenter(plotted), [plotted]);

  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b px-4 py-4">
        <div className="text-lg font-semibold">Lead Map</div>
        <div className="text-sm text-slate-500">
          {plotted.length} mapped lead(s)
        </div>
      </div>

      <div className="h-[420px] w-full">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {plotted.map((lead) => (
            <CircleMarker
              key={lead.id}
              center={[lead.lat as number, lead.lon as number]}
              radius={10}
              pathOptions={{ weight: 2 }}
            >
              <Popup>
                <div className="space-y-2 min-w-[180px]">
                  <div className="font-semibold">
                    {lead.fullName || "Unnamed Lead"}
                  </div>

                  <div className="text-sm">
                    {lead.address || "No address"}
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={googleMapsUrl(lead.lat as number, lead.lon as number)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-slate-900 px-3 py-2 text-center text-sm text-white"
                    >
                      Open in Maps
                    </a>

                    <a
                      href={directionsUrl(lead.lat as number, lead.lon as number)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-center text-sm text-white"
                    >
                      Navigate to Lead
                    </a>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
