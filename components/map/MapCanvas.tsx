// @ts-nocheck
"use client";

import React, { useEffect, useRef } from "react";

export default function MapCanvas({
  userLocation,
  nearbyLeads,
  recentSales,
  selectedPoint,
  onMapClick,
  onLeadClick,
  onSaleClick,
}: any) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const layerRef = useRef(null);

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

      map.on("click", (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    initMap();
  }, []);

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

    nearbyLeads.forEach((lead: any) => {
      if (!lead.lat || !lead.lon) return;

      L.circleMarker([lead.lat, lead.lon], {
        radius: 7,
        color: "blue",
      })
        .addTo(layerRef.current)
        .on("click", () => onLeadClick(lead.id));
    });

    recentSales.forEach((sale: any) => {
      const lat = sale.latitude ?? sale.lat;
      const lon = sale.longitude ?? sale.lon;

      if (!lat || !lon) return;

      L.circleMarker([lat, lon], {
        radius: 8,
        color: "#d97706",
        fillColor: "#f59e0b",
        fillOpacity: 0.9,
      })
        .addTo(layerRef.current)
        .on("click", () => onSaleClick(sale));
    });

    if (selectedPoint) {
      L.circleMarker([selectedPoint.lat, selectedPoint.lon], {
        radius: 9,
        color: "orange",
      }).addTo(layerRef.current);
    }
  }, [nearbyLeads, recentSales, selectedPoint, userLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[420px] w-full rounded-xl border"
    />
  );
}
