// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import RecentSalePanel from "./map/RecentSalePanel";
import SatellitePreviewModal from "./map/SatellitePreviewModal";
import useLeafletMap from "../hooks/useLeafletMap";
import useRecentSales from "../hooks/useRecentSales";

const RADIUS_OPTIONS = [0.25, 0.5, 1, 2, 5, 10, 20];

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
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
  onPrefillLeadAddress,
  onCreateLeadDirect,
}: any) {

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const layerRef = useRef(null);

  const [radius, setRadius] = useState(1);
  const [userLocation, setUserLocation] = useState(null);

  const [recentSales, setRecentSales] = useState([]);

  const [selectedPoint, setSelectedPoint] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSatellite, setShowSatellite] = useState(false);

  const nearbyLeads = useMemo(() => {
    if (!userLocation) return [];

    return leads.filter((lead) => {
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

      const map = L.map(mapContainerRef.current).setView(
        [32.7157, -117.1611],
        12
      );

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap contributors" }
      ).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);

      map.on("click", (e) => {
        setSelectedSale(null);
        setSelectedPoint({
          lat: e.latlng.lat,
          lon: e.latlng.lng,
        });
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
    useRecentSales(setRecentSales, userLocation, radius);
  }, [userLocation, radius]);

  useEffect(() => {
    useLeafletMap(
      mapContainerRef,
      mapRef,
      leafletRef,
      layerRef,
      (sale) => setSelectedSale(sale),
      (lead) => onOpenLead(lead.id),
      nearbyLeads,
      recentSales,
      selectedPoint,
      userLocation
    );
  }, [nearbyLeads, recentSales, selectedPoint, userLocation]);

  function createLeadFromSale(sale) {
    onPrefillLeadAddress({
      id: `${sale.latitude}-${sale.longitude}`,
      display_name: sale.formattedAddress || sale.address,
      lat: sale.latitude,
      lon: sale.longitude,
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

    </div>
  );
}
