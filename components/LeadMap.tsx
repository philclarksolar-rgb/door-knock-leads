// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import MapCanvas from "./map/MapCanvas";
import RecentSalePanel from "./map/RecentSalePanel";
import SatellitePreviewModal from "./map/SatellitePreviewModal";
import RentcastWarningBanner from "./map/RentcastWarningBanner";
import PaidRequestPrompt from "./map/PaidRequestPrompt";

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
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
  );

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
  onCreateLeadDirect,
  userId,
  isAdmin,
}: any) {
  const [radius, setRadius] = useState(1);
  const [userLocation, setUserLocation] = useState<any>(null);

  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [addressInput, setAddressInput] = useState("");
  const [verifiedAddress, setVerifiedAddress] = useState<any>(null);

  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSatellite, setShowSatellite] = useState(false);

  const [admin45Warning, setAdmin45Warning] = useState(false);
  const [rentcastMessage, setRentcastMessage] = useState("");

  const [showPaidPrompt, setShowPaidPrompt] = useState(false);
  const [disableUntilResetChoice, setDisableUntilResetChoice] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    });
  }, []);

  const nearbyLeads = useMemo(() => {
    if (!userLocation) return [];

    return leads.filter((lead: any) => {
      if (!lead.lat || !lead.lon) return false;

      const d = haversineMiles(
        userLocation.lat,
        userLocation.lon,
        lead.lat,
        lead.lon
      );

      return d <= radius;
    });
  }, [leads, userLocation, radius]);

  async function fetchRecentSales(adminApproval = false, disableUntilReset = false) {
    if (!userLocation) return;

    const params = new URLSearchParams({
      lat: String(userLocation.lat),
      lng: String(userLocation.lon),
      radius: String(radius),
      userId: userId || "",
      isAdmin: String(!!isAdmin),
      adminApproval: String(adminApproval),
      disableUntilReset: String(disableUntilReset),
    });

    const res = await fetch(`/api/recent-sales?${params}`);

    const data = await res.json();

    if (data.adminThresholdWarning && isAdmin) {
      setAdmin45Warning(true);
    }

    if (data.requiresAdminApproval && isAdmin) {
      setShowPaidPrompt(true);
      return;
    }

    setRecentSales(data.results || []);
    setRentcastMessage(data.message || "");
  }

  useEffect(() => {
    fetchRecentSales();
  }, [userLocation, radius]);

  async function handleMapClick(lat: number, lon: number) {
    setSelectedSale(null);

    const addr = await reverseGeocode(lat, lon);

    setSelectedPoint({ lat, lon });
    setAddressInput(addr.display_name);
    setVerifiedAddress(addr);
  }

  function createLeadFromSale(sale: any) {
    const lat = sale.latitude ?? sale.lat;
    const lon = sale.longitude ?? sale.lon;

    onPrefillLeadAddress({
      id: sale.id || `${lat}-${lon}`,
      display_name: sale.formattedAddress || sale.address,
      lat,
      lon,
      mapsUrl: `https://maps.google.com/?q=${lat},${lon}`,
    });
  }

  async function clear45Warning() {
    await fetch("/api/admin/rentcast-control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "clear45Alert" }),
    });

    setAdmin45Warning(false);
  }

  return (
    <div className="space-y-4 border rounded-2xl p-4 bg-white">

      <RentcastWarningBanner
        open={admin45Warning}
        onDismiss={clear45Warning}
      />

      {rentcastMessage ? (
        <div className="rounded-xl border bg-slate-50 p-3 text-sm">
          {rentcastMessage}
        </div>
      ) : null}

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

      <div className="relative">

        <MapCanvas
          userLocation={userLocation}
          nearbyLeads={nearbyLeads}
          recentSales={recentSales}
          selectedPoint={selectedPoint}
          onMapClick={handleMapClick}
          onLeadClick={onOpenLead}
          onSaleClick={setSelectedSale}
        />

        <button
          onClick={onCreateLeadDirect}
          className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
        >
          ➕ Add Lead
        </button>

      </div>

      {selectedPoint ? (
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
      ) : null}

      <RecentSalePanel
        sale={selectedSale}
        onSatellitePreview={() => setShowSatellite(true)}
        onCreateLead={() => createLeadFromSale(selectedSale)}
        onClose={() => setSelectedSale(null)}
      />

      <SatellitePreviewModal
        sale={selectedSale}
        open={showSatellite}
        onClose={() => setShowSatellite(false)}
      />

      <PaidRequestPrompt
        open={showPaidPrompt}
        disableUntilReset={disableUntilResetChoice}
        setDisableUntilReset={setDisableUntilResetChoice}
        onCancel={() => {
          setShowPaidPrompt(false);
          setDisableUntilResetChoice(false);
        }}
        onProceed={() => fetchRecentSales(true, disableUntilResetChoice)}
      />

    </div>
  );
}
