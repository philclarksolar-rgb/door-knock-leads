// @ts-nocheck

export default async function useLeafletMap(
  mapContainerRef,
  mapRef,
  leafletRef,
  layerRef,
  onMapClick,
  onLeadClick,
  leads,
  recentSales,
  selectedPoint,
  userLocation
) {
  const L = leafletRef.current;

  if (!L || !layerRef.current) return;

  layerRef.current.clearLayers();

  if (userLocation) {
    L.circleMarker([userLocation.lat, userLocation.lon], {
      radius: 8,
      color: "green",
    }).addTo(layerRef.current);
  }

  leads.forEach((lead) => {
    if (!lead.lat || !lead.lon) return;

    L.circleMarker([lead.lat, lead.lon], {
      radius: 7,
      color: "blue",
    })
      .addTo(layerRef.current)
      .on("click", () => onLeadClick(lead));
  });

  recentSales.forEach((sale) => {
    if (!sale.latitude || !sale.longitude) return;

    L.circleMarker([sale.latitude, sale.longitude], {
      radius: 8,
      color: "#d97706",
      fillColor: "#f59e0b",
      fillOpacity: 0.95,
    })
      .addTo(layerRef.current)
      .on("click", () => onMapClick(sale));
  });

  if (selectedPoint) {
    L.circleMarker([selectedPoint.lat, selectedPoint.lon], {
      radius: 9,
      color: "orange",
    }).addTo(layerRef.current);
  }
}
