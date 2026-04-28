/**
 * Static dataset for the world-spinner demo. Module-level constants — never
 * placed in `Data`, never round-tripped through the engine. The sim's `Data`
 * is just `{ angle, pulses }`. The dots themselves stay here, imported
 * directly by the renderer.
 *
 * This is the central discipline the demo teaches: a 100MB dataset (or a
 * 12kB one — same idea) belongs outside the simulation.
 */

export type LatLon = { lat: number; lon: number };

/** ~500 points uniformly distributed on the sphere via Fibonacci spiral. */
function fibonacciSphere(n: number): LatLon[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const out: LatLon[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const z = 1 - (2 * i + 1) / n; // -1..1
    const lat = (Math.asin(z) * 180) / Math.PI;
    const lon = (((i / phi) % 1) * 360) - 180;
    out[i] = { lat, lon };
  }
  return out;
}

export const WORLD_DOTS: LatLon[] = fibonacciSphere(520);

/** Hand-picked anchor points roughly matching major cities — these are the
 *  candidate origins for the animated pulses. */
export const PULSE_ANCHORS: LatLon[] = [
  { lat: 40.7128, lon: -74.006 }, // New York
  { lat: 51.5074, lon: -0.1278 }, // London
  { lat: 48.8566, lon: 2.3522 }, // Paris
  { lat: 35.6762, lon: 139.6503 }, // Tokyo
  { lat: 22.3193, lon: 114.1694 }, // Hong Kong
  { lat: 1.3521, lon: 103.8198 }, // Singapore
  { lat: -33.8688, lon: 151.2093 }, // Sydney
  { lat: -23.5505, lon: -46.6333 }, // São Paulo
  { lat: 19.4326, lon: -99.1332 }, // Mexico City
  { lat: 55.7558, lon: 37.6173 }, // Moscow
  { lat: 37.7749, lon: -122.4194 }, // San Francisco
  { lat: -1.2921, lon: 36.8219 }, // Nairobi
];

export function latLonToXYZ(
  lat: number,
  lon: number,
  radius = 1
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}
