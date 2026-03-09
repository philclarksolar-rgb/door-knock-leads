"use client";

import React, { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  fullName: string;
  address: string;
  lat: number | null;
  lon: number | null;
  createdAt: string;
  isClosed?: boolean;
  isCancelled?: boolean;
};

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LeadMap({
  leads,
  onOpenLead,
}: {
  leads: Lead[];
  onOpenLead: (id: string) => void;
}) {
  const [radius, setRadius] = useState(1);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        console.log("Location permission denied");
      }
    );
  }, []);

  const nearbyLeads = useMemo(() => {
    if (!userLocation) return [];

    return leads.filter((lead) => {
      if (lead.lat == null || lead.lon == null) return false;

      const distance = haversineMiles(
        userLocation.lat,
        userLocation.lon,
        lead.lat,
        lead.lon
      );

      return distance <= radius;
    });
  }, [leads, radius, userLocation]);

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Nearby Leads</div>

        <select
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm"
        >
          <option value={0.25}>0.25 mi</option>
          <option value={0.5}>0.5 mi</option>
          <option value={1}>1 mi</option>
          <option value={2}>2 mi</option>
          <option value={5}>5 mi</option>
          <option value={10}>10 mi</option>
          <option value={20}>20 mi</option>
        </select>
      </div>

      {!userLocation && (
        <div className="text-sm text-gray-500">
          Waiting for location permission…
        </div>
      )}

      {userLocation && nearbyLeads.length === 0 && (
        <div className="text-sm text-gray-500">
          No leads within {radius} miles
        </div>
      )}

      {nearbyLeads.map((lead) => (
        <button
          key={lead.id}
          onClick={() => onOpenLead(lead.id)}
          className="w-full border rounded-xl p-3 text-left hover:bg-slate-100"
        >
          <div className="font-medium">{lead.fullName}</div>
          <div className="text-sm text-gray-500">{lead.address}</div>
        </button>
      ))}
    </div>
  );
}
