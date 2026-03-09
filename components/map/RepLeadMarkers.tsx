// @ts-nocheck
"use client";

import { getInitials } from "../../lib/leadCreators";

function getCellSizeForZoom(zoom: number) {
  if (zoom >= 18) return 0.0015;
  if (zoom >= 17) return 0.0025;
  if (zoom >= 16) return 0.004;
  if (zoom >= 15) return 0.006;
  if (zoom >= 14) return 0.01;
  if (zoom >= 13) return 0.015;
  return 0.025;
}

function clusterLeads(leads: any[], zoom: number) {
  const cellSize = getCellSizeForZoom(zoom);
  const groups = new Map<string, any[]>();

  leads.forEach((lead) => {
    if (!lead.lat || !lead.lon) return;

    const latKey = Math.floor(lead.lat / cellSize);
    const lonKey = Math.floor(lead.lon / cellSize);
    const key = `${latKey}_${lonKey}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(lead);
  });

  return Array.from(groups.values()).map((group) => {
    if (group.length === 1) {
      return {
        type: "single",
        lead: group[0],
      };
    }

    const avgLat =
      group.reduce((sum, item) => sum + Number(item.lat || 0), 0) / group.length;

    const avgLon =
      group.reduce((sum, item) => sum + Number(item.lon || 0), 0) / group.length;

    return {
      type: "cluster",
      count: group.length,
      lat: avgLat,
      lon: avgLon,
      leads: group,
    };
  });
}

export default function RepLeadMarkers({
  leaflet,
  map,
  layer,
  leads,
  userLocation,
  selectedPoint,
  sessionUserId,
  isAdmin,
  onOpenLead,
  onOtherRepLeadClick,
}: any) {
  if (!leaflet || !layer || !map) return;

  const L = leaflet;
  layer.clearLayers();

  if (userLocation) {
    L.circleMarker([userLocation.lat, userLocation.lon], {
      radius: 8,
      color: "green",
    }).addTo(layer);
  }

  const zoom = map.getZoom();
  const clustered = clusterLeads(leads, zoom);

  clustered.forEach((item: any) => {
    if (item.type === "cluster") {
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width:34px;
            height:34px;
            border-radius:9999px;
            background:#ddd6fe;
            border:2px solid #7c3aed;
            color:#4c1d95;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:12px;
            font-weight:700;
          ">
            ${item.count}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker([item.lat, item.lon], { icon })
        .addTo(layer)
        .on("click", () => {
          map.setView([item.lat, item.lon], Math.min(zoom + 2, 19));
        });

      return;
    }

    const lead = item.lead;
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
