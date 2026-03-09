export function getTileId(lat:number,lon:number){

  const tileSize = 0.02

  const latTile =
    Math.floor(lat / tileSize)

  const lonTile =
    Math.floor(lon / tileSize)

  return `tile_${latTile}_${lonTile}`

}

export function getTileBounds(lat:number,lon:number){

  const tileSize = 0.02

  const latTile =
    Math.floor(lat / tileSize)

  const lonTile =
    Math.floor(lon / tileSize)

  const minLat =
    latTile * tileSize

  const minLon =
    lonTile * tileSize

  const maxLat =
    minLat + tileSize

  const maxLon =
    minLon + tileSize

  return {
    minLat,
    minLon,
    maxLat,
    maxLon
  }

}
