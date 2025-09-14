export type LatLng = { lat: number; lng: number };

const BASE = 'https://route-init.gallimap.com/api/v1';
const ACCESS_TOKEN = import.meta.env.VITE_GALLI_API_KEY as string | undefined;

function withToken(url: string): string {
  if (/([?&])accessToken=/.test(url)) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}accessToken=${encodeURIComponent(ACCESS_TOKEN || '')}`;
}

async function get<T>(url: string): Promise<T> {
  const finalUrl = withToken(url);
  const start = performance.now();
  console.debug('[GalliAPI][GET]', finalUrl);
  const res = await fetch(finalUrl);
  const dur = (performance.now() - start).toFixed(0);
  console.debug('[GalliAPI][RESP]', res.status, res.statusText, `${dur}ms`, finalUrl);
  if (!res.ok) {
    let details: any = null;
    try { details = await res.json(); } catch {}
    throw new Error(`Galli API error ${res.status}: ${details ? JSON.stringify(details) : res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface AutocompleteItem {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  [key: string]: any;
}
export interface AutocompleteResponse {
  data?: AutocompleteItem[];
  results?: AutocompleteItem[];
  [key: string]: any;
}
export async function autocomplete(word: string, opts?: { lat?: number; lng?: number }) {
  const params = new URLSearchParams({ word });
  if (typeof opts?.lat === 'number') params.set('lat', String(opts.lat));
  if (typeof opts?.lng === 'number') params.set('lng', String(opts.lng));
  const url = `${BASE}/search/autocomplete?${params.toString()}`;
  const resp = await get<AutocompleteResponse>(url);
  return (resp.data || resp.results || []) as AutocompleteItem[];
}

export interface SearchItem {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  [key: string]: any;
}
export interface SearchResponse {
  data?: SearchItem[];
  results?: SearchItem[];
  [key: string]: any;
}
export async function search(query: string, opts?: { lat?: number; lng?: number; radius?: number }) {
  const params = new URLSearchParams({ word: query });
  if (typeof opts?.lat === 'number') params.set('lat', String(opts.lat));
  if (typeof opts?.lng === 'number') params.set('lng', String(opts.lng));
  if (typeof opts?.radius === 'number') params.set('radius', String(opts.radius));
  const url = `${BASE}/search/generalSearch?${params.toString()}`;
  const resp = await get<SearchResponse>(url);
  return (resp.data || resp.results || []) as SearchItem[];
}

export interface ReverseItem {
  name?: string;
  address?: string;
  lat: number;
  lng: number;
  [key: string]: any;
}
export interface ReverseResponse {
  data?: ReverseItem[];
  results?: ReverseItem[];
  [key: string]: any;
}
export async function reverseGeocode(lat: number, lng: number) {
  const url = `${BASE}/reverse/generalReverse?lat=${lat}&lng=${lng}`;
  const resp = await get<ReverseResponse>(url);
  const arr = (resp.data || resp.results || []) as ReverseItem[];
  return arr[0] || null;
}

export type Mode = 'driving' | 'walking' | 'cycling';
export interface RouteResponse {
  coordinates?: [number, number][] | { lat: number; lng: number }[];
  geometry?: { coordinates: [number, number][]; type: string };
  routes?: Array<{ geometry: { coordinates: [number, number][]; type: string } }>;
  data?: { coordinates?: [number, number][] | { lat: number; lng: number }[]; geometry?: { coordinates: [number, number][]; type: string } };
  [key: string]: any;
}

export async function route(src: LatLng, dst: LatLng, mode: Mode = 'driving') {
  const url = `${BASE}/routing?mode=${encodeURIComponent(mode)}&srcLat=${src.lat}&srcLng=${src.lng}&dstLat=${dst.lat}&dstLng=${dst.lng}&accessToken=${encodeURIComponent(ACCESS_TOKEN || '')}`;
  const start = performance.now();
  console.debug('[GalliAPI][ROUTE]', { mode, src, dst, url });
  const res = await fetch(url);
  const dur = (performance.now() - start).toFixed(0);
  console.debug('[GalliAPI][ROUTE_RESP]', res.status, res.statusText, `${dur}ms`);
  if (!res.ok) {
    let details: any = null;
    try { details = await res.json(); } catch {}
    throw new Error(`Galli API error ${res.status}: ${details ? JSON.stringify(details) : res.statusText}`);
  }
  return res.json() as Promise<RouteResponse>;
}

export interface DistanceResponse {
  distance?: number;
  duration?: number;
  [key: string]: any;
}
export async function distance(src: LatLng, dst: LatLng, mode: Mode = 'driving') {
  const url = `${BASE}/routing/distance?mode="driving"&srcLat=${src.lat}&srcLng=${src.lng}&dstLat=${dst.lat}&dstLng=${dst.lng}`;
  console.debug('[GalliAPI][DIST]', { mode, src, dst, url });
  return get<DistanceResponse>(url);
}

export function routeToGeoJSON(resp: RouteResponse): GeoJSON.FeatureCollection {
  let coords: [number, number][] | undefined;

  const pickCoords = (obj: any): [number, number][] | undefined => {
    if (!obj) return undefined;
    if (Array.isArray(obj.coordinates)) return obj.coordinates as [number, number][];
    if (Array.isArray(obj)) {
      if (obj.length && Array.isArray(obj[0])) return obj as [number, number][];
      if (obj.length && typeof (obj[0] as any).lat === 'number') return (obj as any[]).map((c) => [c.lng, c.lat]);
    }
    return undefined;
  };

  coords = pickCoords(resp.coordinates)
    || pickCoords(resp.data?.coordinates)
    || pickCoords(resp.geometry)
    || pickCoords(resp.data?.geometry)
    || pickCoords(resp.routes?.[0]?.geometry);

  if (!coords) {
    try {
      const latlngs = (resp as any)?.data?.data?.[0]?.latlngs as [number, number][] | undefined;
      if (Array.isArray(latlngs) && latlngs.length) {
        coords = latlngs as [number, number][];
      }
    } catch {}
  }

  if (coords && coords.length) {
    const [a, b] = coords[0];
    const looksLikeLatLng = Math.abs(a) <= 90 && Math.abs(b) <= 180 && Math.abs(b) > 90;
    if (looksLikeLatLng) {
      coords = coords.map(([x, y]) => ([y, x] as [number, number]));
    }
  }

  let legsOrSegments: any[] | undefined;
  let stepsOnly: any[] | undefined;
  let distance: number | undefined;
  let duration: number | undefined;
  try {
    const core: any = (resp as any)?.data?.data?.[0] ?? (resp as any)?.data ?? (resp as any);
    if (core) {
      legsOrSegments = core.legs || core.segments;
      stepsOnly = Array.isArray(core.steps) ? core.steps : undefined;
      if (typeof core.distance === 'number') distance = core.distance;
      if (typeof core.duration === 'number') duration = core.duration;
    }
  } catch {}

  const feature: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords || [],
    },
    properties: {
      legs: Array.isArray(legsOrSegments) ? legsOrSegments : (stepsOnly ? [{ steps: stepsOnly }] : undefined),
      segments: Array.isArray(legsOrSegments) ? legsOrSegments : undefined,
      distance,
      duration,
    },
  };
  return { type: 'FeatureCollection', features: coords && coords.length ? [feature] : [] };
}
