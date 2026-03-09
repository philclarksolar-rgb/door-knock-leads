// @ts-nocheck

export default async function useRecentSales(
  setRecentSales,
  userLocation,
  radius
) {
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
