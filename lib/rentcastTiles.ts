export const TILE_SIZE = 0.1;

export function tileCoord(value: number) {
  return Math.floor(value / TILE_SIZE) * TILE_SIZE;
}

export function getTile(lat: number, lon: number) {
  return {
    tileLat: tileCoord(lat),
    tileLon: tileCoord(lon),
  };
}
