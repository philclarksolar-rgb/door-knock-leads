// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Lead = {
  id: string;
  fullName: string;
  address: string;
  lat: number | null;
  lon: number | null;
  createdAt: string;
};

type VerifiedAddress = {
  id: string | number;
  display_name: string;
  lat: number;
  lon: number;
  mapsUrl: string;
};

type RecentSale = {
  id?: string | number;
  address: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  price?: number;
  lastSaleDate?: string;
};

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

function formatPrice(value?: number) {
  if (!value) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function LeadMap({
  leads,
  onOpenLead,
  onPrefillLeadAddress,
  onCreateLeadDirect,
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

  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [selectedSale, setSelectedSale] = useState<RecentSale | null>(null);
  const [showSatellite, setShowSatellite] = useState(false);

  const nearbyLeads = useMemo(() => {
    if (!userLocation) return [];

    return leads.filter((lead: Lead) => {
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

        setSelectedSale(null);
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
    async function loadRecentSales() {
      if (!userLocation) return;

      try {
        const res = await fetch(
          `/api/recent-sales?lat=${userLocation.lat}&lng=${userLocation.lon}&radius=${radius}`
        );
        const data = await res.json();
        setRecentSales(Array.isArray(data) ? data : data?.results || []);
      } catch {
        setRecentSales([]);
      }
    }

    loadRecentSales();
  }, [userLocation, radius]);

  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !layerRef.current) return;

    layerRef.current.clearLayers();

    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lon], {
        radius: 8,
        color: "green",
      }).addTo(layerRef.current);
    }

    nearbyLeads.forEach((lead: Lead) => {
      if (!lead.lat || !lead.lon) return;

      L.circleMarker([lead.lat, lead.lon], {
        radius: 7,
        color: "blue",
      })
        .addTo(layerRef.current)
        .on("click", () => {
          setSelectedPoint(null);
          setSelectedSale(null);
          onOpenLead(lead.id);
        });
    });

    recentSales.forEach((sale: RecentSale) => {
      if (!sale.latitude || !sale.longitude) return;

      L.circleMarker([sale.latitude, sale.longitude], {
        radius: 8,
        color: "#d97706",
        fillColor: "#f59e0b",
        fillOpacity: 0.95,
      })
        .addTo(layerRef.current)
        .on("click", () => {
          setSelectedPoint(null);
          setSelectedSale(sale);
        });
    });

    if (selectedPoint) {
      L.circleMarker([selectedPoint.lat, selectedPoint.lon], {
        radius: 9,
        color: "orange",
      }).addTo(layerRef.current);
    }
  }, [nearbyLeads, recentSales, selectedPoint, userLocation, onOpenLead]);

  function createLeadFromSale(sale: RecentSale) {
    onPrefillLeadAddress({
      id: sale.id || `${sale.latitude}-${sale.longitude}`,
      display_name: sale.formattedAddress || sale.address,
      lat: sale.latitude,
      lon: sale.longitude,
      mapsUrl: `https://maps.google.com/?q=${sale.latitude},${sale.longitude}`,
    });
  }

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

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[420px] w-full rounded-xl border"
        />

        <button
          onClick={onCreateLeadDirect}
          className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
        >
          ➕ Add Lead
        </button>
      </div>

      {selectedPoint && (
        <div className="border rounded-xl p-3 bg-yellow-50">
          <div className="font-medium mb-2">Confirm Address</div>

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
      )}

      {selectedSale && (
        <div className="border rounded-xl p-3 bg-amber-50 space-y-2">
          <div className="font-medium">🏡 Recently Sold</div>
          <div>{selectedSale.formattedAddress || selectedSale.address}</div>
          <div className="text-sm text-slate-600">
            Sold: {selectedSale.lastSaleDate || "—"} · {formatPrice(selectedSale.price)}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowSatellite(true)}
              className="bg-slate-900 text-white px-3 py-1 rounded-lg"
            >
              Satellite Preview
            </button>

            <button
              onClick={() => createLeadFromSale(selectedSale)}
              className="bg-green-600 text-white px-3 py-1 rounded-lg"
            >
              Create Lead
            </button>

            <button
              onClick={() => setSelectedSale(null)}
              className="border px-3 py-1 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSatellite && selectedSale && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <div className="font-semibold">Satellite Preview</div>
              <div className="text-sm text-slate-600">
                {selectedSale.formattedAddress || selectedSale.address}
              </div>
            </div>

            <button
              onClick={() => setShowSatellite(false)}
              className="border px-3 py-1 rounded-lg"
            >
              Close
            </button>
          </div>

          <iframe
            title="Satellite Preview"
            className="h-[calc(100vh-80px)] w-full"
            src={`https://www.arcgis.com/home/webmap/viewer.html?center=${selectedSale.longitude},${selectedSale.latitude}&level=19&basemapUrl=https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`}
          />
        </div>
      )}
    </div>
  );
}
