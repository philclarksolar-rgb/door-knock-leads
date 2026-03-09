"use client";

import React from "react";

export default function MapMarkers({
  leaflet,
  layer,
  userLocation,
  leads,
  selectedPoint,
  onOpenLead,
}: any) {

  if (!leaflet || !layer) return;

  const L = leaflet;

  layer.clearLayers();

  if (userLocation) {
    L.circleMarker([userLocation.lat, userLocation.lon], {
      radius: 8,
      color: "green",
    }).addTo(layer);
  }

  leads.forEach((lead: any) => {
    if (!lead.lat || !lead.lon) return;

    L.circleMarker([lead.lat, lead.lon], {
      radius: 7,
      color: "blue",
    })
      .addTo(layer)
      .on("click", () => onOpenLead(lead.id));
  });

  if (selectedPoint) {
    L.circleMarker([selectedPoint.lat, selectedPoint.lon], {
      radius: 9,
      color: "orange",
    }).addTo(layer);
  }
}
