// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import MapMarkers from "./MapMarkers";
import MapAddressConfirm from "./MapAddressConfirm";

const RADIUS_OPTIONS = [0.25, 0.5, 1, 2, 5, 10, 20];

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
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

async function reverseGeocode(lat: number, lon: number) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${lat}&lon=${lon}`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    id: `${lat}-${lon}`,
    display_name: data.display_name,
    lat,
    lon,
    mapsUrl: `https://maps.google.com/?q=${lat},${lon}`,
  };
}

export default function LeadMap({
  leads,
  onOpenLead,
  onPrefillLeadAddress,
}: any) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const layerRef = useRef(null);

  const [radius, setRadius] = useState(1);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [addressInput, setAddressInput] = useState("");
  const [verifiedAddress, setVerifiedAddress] = useState<any>(null);

  const nearbyLeads = useMemo(() => {
    if (!userLocation) return [];

    return leads.filter((lead: any) => {
      if (!lead.lat || !lead.lon) return false;

      const distance = haversineMiles(
        userLocation.lat,
        userLocation.lon,
        lead.lat,
        lead.lon
      );

      return distance <= radius;
    });
  }, [leads, radius, userLocation]);

  useEffect(() => {
    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const L = (await import("leaflet")).default;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current).setView([32.7157, -117.1611], 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);

      map.on("click", async (e: any) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        setSelectedPoint({ lat, lon });

        const addr = await reverseGeocode(lat, lon);
        setAddressInput(addr.display_name);
        setVerifiedAddress(addr);
      });

      navigator.geolocation.getCurrentPosition((pos) => {
        const location = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };

        setUserLocation(location);
        map.setView([location.lat, location.lon], 15);
      });
    }

    initMap();
  }, []);

  useEffect(() => {
    MapMarkers({
      leaflet: leafletRef.current,
      layer: layerRef.current,
      userLocation,
      leads: nearbyLeads,
      selectedPoint,
      onOpenLead,
    });
  }, [nearbyLeads, selectedPoint, userLocation, onOpenLead]);

  return (
    <div className="space-y-4 border rounded-2xl p-4 bg-white">
      <div className="flex justify-between items-center">
        <div className="font-semibold">Nearby Leads Map</div>

        <select
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r} mi
            </option>
          ))}
        </select>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full rounded-xl border"
      />

      <MapAddressConfirm
        selectedPoint={selectedPoint}
        addressInput={addressInput}
        setAddressInput={setAddressInput}
        verifiedAddress={verifiedAddress}
        onPrefillLeadAddress={onPrefillLeadAddress}
      />
    </div>
  );
}
