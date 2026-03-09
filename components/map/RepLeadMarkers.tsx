// @ts-nocheck
"use client";

import { getInitials } from "../../lib/leadCreators";

export default function RepLeadMarkers({
  leaflet,
  layer,
  leads,
  userLocation,
  selectedPoint,
  sessionUserId,
  isAdmin,
  onOpenLead,
  onOtherRepLeadClick,
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

    const isMine = lead.ownerUserId === sessionUserId;

    if (isMine) {
      L.circleMarker([lead.lat, lead.lon], {
        radius: 7,
        color: "blue",
      })
        .addTo(layer)
        .on("click", () => onOpenLead(lead.id));

      return;
    }

    const initials = getInitials(lead.creatorName);

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="
          width:28px;
          height:28px;
          border-radius:9999px;
          background:#e5e7eb;
          border:2px solid #6b7280;
          color:#111827;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:700;
        ">
          ${initials}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lead.lat, lead.lon], { icon }).addTo(layer);

    marker.on("click", () => {
      if (isAdmin) {
        onOpenLead(lead.id);
        return;
      }

      onOtherRepLeadClick(lead);
    });
  });

  if (selectedPoint) {
    L.circleMarker([selectedPoint.lat, selectedPoint.lon], {
      radius: 9,
      color: "orange",
    }).addTo(layer);
  }
}
