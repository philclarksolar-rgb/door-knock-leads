export function getTile(lat: number, lng: number) {
  const tileSize = 0.05

  const tileLat = Math.floor(lat / tileSize) * tileSize
  const tileLon = Math.floor(lng / tileSize) * tileSize

  return {
    tileLat: Number(tileLat.toFixed(6)),
    tileLon: Number(tileLon.toFixed(6)),
    tileSize,
  }
}

export function getTileBounds(tileIdOrLat: string | number, tileLonArg?: number) {
  const tileSize = 0.05

  if (typeof tileIdOrLat === "string") {
    const parts = tileIdOrLat.replace("tile_", "").split("_")
    const minLat = Number(parts[0])
    const minLon = Number(parts[1])

    return {
      minLat,
      minLon,
      maxLat: minLat + tileSize,
      maxLon: minLon + tileSize,
    }
  }

  const minLat = Number(tileIdOrLat)
  const minLon = Number(tileLonArg)

  return {
    minLat,
    minLon,
    maxLat: minLat + tileSize,
    maxLon: minLon + tileSize,
  }
}

export async function getRentcastTile(bounds: {
  minLat: number
  minLon: number
  maxLat: number
  maxLon: number
}) {
  const apiKey = process.env.RENTCAST_API_KEY

  if (!apiKey) {
    throw new Error("Missing RENTCAST_API_KEY")
  }

  const url =
    "https://api.rentcast.io/v1/listings/sale" +
    `?latitude=${(bounds.minLat + bounds.maxLat) / 2}` +
    `&longitude=${(bounds.minLon + bounds.maxLon) / 2}` +
    `&radius=5` +
    `&limit=50`

  const res = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`RentCast request failed: ${text}`)
  }

  const data = await res.json()

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data

  return []
}
