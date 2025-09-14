import { useState, useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode, MouseEventHandler } from 'react';
import { ArrowLeft, MapPin, Package, Clock, DollarSign, AlertCircle, Navigation, Weight, ArrowUp, ArrowUpRight, ArrowUpLeft, RotateCcw, RotateCw, CornerUpLeft, CornerUpRight, X } from 'lucide-react';
import GalliMap from './maps/GalliMap';
import { claimDelivery } from '../api/transporterApi';
import { route as galliRoute, routeToGeoJSON, type Mode } from '../api/galli';

type RouteStats = { distance?: number; duration?: number };
type RouteResult = { geojson: GeoJSON.FeatureCollection; stats?: RouteStats };

const buildRoute = async (
  waypoints: Array<{ lat: number; lng: number }>,
  optimize = false,
  mode: Mode = 'driving'
) : Promise<RouteResult> => {
  if (!waypoints || waypoints.length < 2) {
    return { geojson: { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection };
  }

  let ordered = waypoints.slice();
  if (optimize && waypoints.length > 2) {
    const used = new Set<number>();
    const result: typeof waypoints = [];
    let currentIdx = 0;
    result.push(ordered[currentIdx]);
    used.add(currentIdx);
    while (result.length < ordered.length) {
      const last = result[result.length - 1];
      let bestIdx = -1;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < ordered.length; i++) {
        if (used.has(i)) continue;
        const d = Math.hypot(ordered[i].lat - last.lat, ordered[i].lng - last.lng);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        used.add(bestIdx);
        result.push(ordered[bestIdx]);
      } else {
        break;
      }
    }
    ordered = result;
  }

  const features: GeoJSON.Feature[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    const seg = await galliRoute(ordered[i], ordered[i + 1], mode);
    const gj = routeToGeoJSON(seg);
    features.push(...gj.features);
    try {
      const meta = (seg as any)?.data?.data?.[0];
      if (meta?.distance) totalDistance += Number(meta.distance) || 0;
      if (meta?.duration) totalDuration += Number(meta.duration) || 0;
    } catch {}
  }
  return { geojson: { type: 'FeatureCollection', features } as GeoJSON.FeatureCollection, stats: { distance: totalDistance, duration: totalDuration } };
};

const makeRouteCacheKey = (
  waypoints: Array<{ lat: number; lng: number }>,
  optimize: boolean,
  mode: Mode
) => {
  const rounded = waypoints.map(w => ({
    lat: Math.round(w.lat * 1e5) / 1e5,
    lng: Math.round(w.lng * 1e5) / 1e5,
  }));
  return JSON.stringify({ w: rounded, o: optimize, m: mode });
};

const getNearbyDeliveries = async (radius = 10) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/deliveries/nearby/?radius=${radius}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw errorData || `HTTP error! status: ${response.status}`;
    }
    
    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error('Error fetching nearby deliveries:', error);
    throw error;
  }
};

const getCurrentLocation = (): Promise<LatLng> => {
  return new Promise<LatLng>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
};

type ButtonVariant = 'default' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'default', size = 'md', className = '', onClick, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants: Record<ButtonVariant, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50'
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-11 px-6'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

type LatLng = { lat: number; lng: number };
type NearbyDeliveryItem = any;

const NearbyDeliveries = () => {
  const [deliveries, setDeliveries] = useState<NearbyDeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(10);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [routeSegments, setRouteSegments] = useState<Array<{ geojson: GeoJSON.FeatureCollection; color?: string; name?: string }> | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(false);
  const [selectedForRoute, setSelectedForRoute] = useState<any | null>(null);
  const [geoWatchId, setGeoWatchId] = useState<number | null>(null);
  const [acceptedDeliveryIds, setAcceptedDeliveryIds] = useState<Set<string | number>>(new Set());
  const [acceptingId, setAcceptingId] = useState<string | number | null>(null);

  const getDeliveryKey = (d: any): string | number => d?.delivery_id || d?.id;

  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string | number>>(new Set());
  type RouteStep = {
    instruction: string;
    distance?: number;
    name?: string;
    maneuver?: string;
  };
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [travelMode, setTravelMode] = useState<Mode>('driving');
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [remainingToNext, setRemainingToNext] = useState<number | null>(null);
  const [pickupDropOnly, setPickupDropOnly] = useState<boolean>(false);
  type NavPhase = 'idle' | 'toPickup' | 'toDrop' | 'done';
  const [navPhase, setNavPhase] = useState<NavPhase>('idle');
  const [navigationTarget, setNavigationTarget] = useState<LatLng | null>(null);
  const lastPosRef = useRef<LatLng | null>(null);
  const [navFullScreen, setNavFullScreen] = useState<boolean>(false);
  type CachedRoute = { data: RouteResult; ts: number };
  const routeCacheRef = useRef<Map<string, CachedRoute>>(new Map());
  const ROUTE_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  const loadNearby = async () => {
    try {
      setIsLoading(true);
      setError(null);
      try {
        const loc = await getCurrentLocation();
        setUserLocation(loc);
        setLocationError(null);
      } catch (e) {
        setLocationError('Unable to get your location. Using default/available data.');
      }

      const data = await getNearbyDeliveries(radius);
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('[ND] loadNearby failed:', e);
      setError(e?.detail || e?.message || 'Failed to load nearby deliveries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNearby();
  }, [radius]);

  const getOrFetchRoute = async (
    waypoints: Array<{ lat: number; lng: number }>,
    optimize = false,
    mode: Mode = travelMode
  ) => {
    const key = makeRouteCacheKey(waypoints, optimize, mode);
    console.debug('[ND][ROUTE] request', { waypoints, optimize, mode });
    const now = Date.now();
    const cached = routeCacheRef.current.get(key);
    if (cached && now - cached.ts < ROUTE_CACHE_TTL_MS) {
      console.debug('[ND][ROUTE] cache hit');
      return cached.data;
    }
    console.debug('[ND][ROUTE] cache miss; building route…');
    const data = await buildRoute(waypoints, optimize, mode);
    routeCacheRef.current.set(key, { data, ts: now });
    if (routeCacheRef.current.size > 50) {
      const firstKey = routeCacheRef.current.keys().next().value as string | undefined;
      if (firstKey) routeCacheRef.current.delete(firstKey);
    }
    console.debug('[ND][ROUTE] built feature count', (data as any)?.geojson?.features?.length || 0, 'stats', (data as any)?.stats);
    return data;
  };

  const toggleSelectForPlan = (delivery: any) => {
    const key = getDeliveryKey(delivery);
    setSelectedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const planOptimizedRoute = async () => {
    try {
      const planDeliveriesRaw = deliveries.filter(d => selectedPlanIds.has(getDeliveryKey(d)));
      const planDeliveries = pickupDropOnly
        ? planDeliveriesRaw.filter(d => d.pickup_latitude && d.pickup_longitude && d.delivery_latitude && d.delivery_longitude)
        : planDeliveriesRaw;
      const wp: Array<{ lat: number; lng: number }> = [];
      if (!pickupDropOnly && userLocation) wp.push({ lat: userLocation.lat, lng: userLocation.lng });
      planDeliveries.forEach(d => {
        if (d.pickup_latitude && d.pickup_longitude) {
          wp.push({ lat: parseFloat(String(d.pickup_latitude)), lng: parseFloat(String(d.pickup_longitude)) });
        }
        if (d.delivery_latitude && d.delivery_longitude) {
          wp.push({ lat: parseFloat(String(d.delivery_latitude)), lng: parseFloat(String(d.delivery_longitude)) });
        }
      });
      if (wp.length < 2) {
        setError('Select at least one complete pickup→drop pair or disable “Pickup → Drop only”.');
        return;
      }
      console.debug('[ND][PLAN] waypoints', wp, 'mode', travelMode, 'pickupDropOnly', pickupDropOnly);

      let ordered = wp.slice();
      if (wp.length > 2) {
        const used = new Set<number>();
        const res: typeof wp = [];
        let currentIdx = 0;
        res.push(ordered[currentIdx]);
        used.add(currentIdx);
        while (res.length < ordered.length) {
          const last = res[res.length - 1];
          let bestIdx = -1;
          let bestDist = Number.POSITIVE_INFINITY;
          for (let i = 0; i < ordered.length; i++) {
            if (used.has(i)) continue;
            const d = Math.hypot(ordered[i].lat - last.lat, ordered[i].lng - last.lng);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
          }
          if (bestIdx >= 0) { used.add(bestIdx); res.push(ordered[bestIdx]); } else { break; }
        }
        ordered = res;
      }

      const palette = ['#22c55e', '#ff6b00', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];
      const segs: Array<{ geojson: GeoJSON.FeatureCollection; color?: string; name?: string }> = [];
      let totalDist = 0; let totalDur = 0;
      for (let i = 0; i < ordered.length - 1; i++) {
        const resp = await galliRoute(ordered[i], ordered[i + 1], travelMode);
        const gj = routeToGeoJSON(resp);
        if (gj?.features?.length) {
          let ld = 0, lt = 0;
          try { const meta = (resp as any)?.data?.data?.[0] || {}; ld = Number(meta.distance)||0; lt = Number(meta.duration)||0; } catch {}
          const name = `Leg ${i + 1} (${formatDistance(ld)}, ${formatDuration(lt)})`;
          segs.push({ geojson: gj, color: palette[i % palette.length], name });
        }
        try {
          const meta = (resp as any)?.data?.data?.[0];
          if (meta?.distance) totalDist += Number(meta.distance) || 0;
          if (meta?.duration) totalDur += Number(meta.duration) || 0;
        } catch {}
      }
      setRouteGeoJson(null);
      setRouteSegments(segs);
      setRouteStats({ distance: totalDist, duration: totalDur });
      setSteps([]);
      setActiveStepIndex(0);
      setRemainingToNext(null);
    } catch (e: any) {
      console.error('Plan route failed:', e);
      setError(e.message || 'Failed to plan route');
    }
  };

  const computeRouteForDelivery = async (delivery: any) => {
    try {
      let startLoc = userLocation;
      if (!startLoc) {
        try {
          startLoc = await getCurrentLocation();
          setUserLocation(startLoc);
        } catch (e) {
          setError('Unable to get your current location. Click "Use my location" and allow permission.');
          return;
        }
      }

      const wp: Array<{ lat: number; lng: number }> = [];
      if (!pickupDropOnly && startLoc) wp.push({ lat: startLoc.lat, lng: startLoc.lng });
      if (delivery?.pickup_latitude && delivery?.pickup_longitude) {
        wp.push({ lat: parseFloat(String(delivery.pickup_latitude)), lng: parseFloat(String(delivery.pickup_longitude)) });
      }
      if (delivery?.delivery_latitude && delivery?.delivery_longitude) {
        wp.push({ lat: parseFloat(String(delivery.delivery_latitude)), lng: parseFloat(String(delivery.delivery_longitude)) });
      }

      if (wp.length < 2) {
        setError('Selected delivery is missing pickup/drop coordinates.');
        return;
      }

      const data = await getOrFetchRoute(wp, false, travelMode);
      const fc = (data as any)?.geojson as GeoJSON.FeatureCollection | undefined;
      if (!fc || !Array.isArray(fc.features) || fc.features.length === 0) {
        setError('No route found between the selected points.');
        return;
      }
      setRouteGeoJson(fc);
      setRouteSegments(null);
      setRouteStats((data as any).stats || null);
      setSelectedForRoute(delivery);

      const newSteps: RouteStep[] = [];
      try {
        const props = (data as any)?.geojson?.features?.[0]?.properties;
        const legs = props?.legs || props?.segments || [];
        legs.forEach((leg: any) => {
          const legSteps = leg?.steps || [];
          legSteps.forEach((s: any) => {
            if (s?.instruction) {
              const instr = typeof s.instruction === 'string' ? s.instruction : (s.instruction?.text ?? '');
              newSteps.push({
                instruction: instr,
                distance: typeof s.distance === 'number' ? s.distance : undefined,
                duration: typeof s.duration === 'number' ? s.duration : undefined,
                name: s.name,
                maneuver: s.maneuver,
              });
            }
          });
        });
      } catch {}
      const filledSteps = newSteps.length > 0
        ? newSteps
        : [{ instruction: 'Proceed to destination', distance: (data as any)?.stats?.distance } as RouteStep];
      setSteps(filledSteps);
      setActiveStepIndex(0);
      setRemainingToNext(filledSteps[0]?.distance ?? null);
    } catch (e: any) {
      console.error('computeRouteForDelivery failed:', e);
      setError(e?.message || 'Failed to compute route');
    }
  };

  const startNavigation = async () => {
    try {
      let active = selectedForRoute;
      if (!active) {
        active = deliveries.find((d: any) => d?.pickup_latitude && d?.pickup_longitude && d?.delivery_latitude && d?.delivery_longitude);
        if (active) {
          await computeRouteForDelivery(active);
        } else {
          setError('Select a delivery with valid pickup/drop coordinates and press "Show Route" first.');
          return;
        }
      }
      if (!userLocation) {
        setError('User location unavailable. Click "Use my location" and allow permission.');
        return;
      }
      const hasPickup = active?.pickup_latitude && active?.pickup_longitude;
      const hasDrop = active?.delivery_latitude && active?.delivery_longitude;
      const pickup = hasPickup ? { lat: parseFloat(String(active.pickup_latitude)), lng: parseFloat(String(active.pickup_longitude)) } : null;
      const drop = hasDrop ? { lat: parseFloat(String(active.delivery_latitude)), lng: parseFloat(String(active.delivery_longitude)) } : null;
      if (!pickup && !drop) {
        setError('Selected delivery has no pickup/drop coordinates.');
        return;
      }
      let phase: NavPhase = 'toDrop';
      let target: LatLng | null = drop || pickup!;
      if (pickup && drop) {
        const distToPickup = haversineMeters(userLocation, pickup);
        phase = distToPickup > 30 ? 'toPickup' : 'toDrop';
        target = phase === 'toPickup' ? pickup : drop;
      }
      setNavPhase(phase);
      setNavigationTarget(target);
      setTrackingEnabled(true);
      setNavFullScreen(true);

      const wp = [userLocation, target].filter(Boolean) as LatLng[];
      console.debug('[ND][NAV] start', { phase, target, wp });
      buildCombinedRouteForNav(wp);
    } catch (e: any) {
      setError(e?.message || 'Failed to start navigation');
    }
  };

  const buildCombinedRouteForNav = async (wp: LatLng[]) => {
    try {
      const data = await getOrFetchRoute(wp, false, travelMode);
      setRouteGeoJson((data as any).geojson);
      setRouteSegments(null);
      setRouteStats((data as any).stats || null);
      const newSteps: RouteStep[] = [];
      try {
        const props = (data as any)?.geojson?.features?.[0]?.properties;
        const legs = props?.legs || props?.segments || [];
        legs.forEach((leg: any) => {
          const legSteps = leg?.steps || [];
          legSteps.forEach((s: any) => {
            if (s?.instruction) {
              const instr = typeof s.instruction === 'string' ? s.instruction : (s.instruction?.text ?? '');
              newSteps.push({
                instruction: instr,
                distance: typeof s.distance === 'number' ? s.distance : undefined,
                duration: typeof s.duration === 'number' ? s.duration : undefined,
                name: s.name,
                maneuver: s.maneuver,
              });
            }
          });
        });
      } catch {}
      const fallbackSteps = newSteps.length > 0
        ? newSteps
        : [{ instruction: 'Head towards destination', distance: (data as any)?.stats?.distance, duration: (data as any)?.stats?.duration } as RouteStep];
      setSteps(fallbackSteps);
      setActiveStepIndex(0);
      setRemainingToNext(fallbackSteps[0]?.distance ?? null);
    } catch (e) {
      console.error('[ND][NAV] buildCombinedRouteForNav failed', e);
    }
  };

  useEffect(() => {
    if (!trackingEnabled || !selectedForRoute) {
      if (geoWatchId !== null) {
        navigator.geolocation.clearWatch(geoWatchId);
        setGeoWatchId(null);
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported for live tracking');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const current: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(current);
        if (lastPosRef.current && remainingToNext != null && steps.length > 0) {
          const moved = haversineMeters(lastPosRef.current, current);
          if (!isNaN(moved) && moved > 0) {
            const nextRemaining = Math.max(0, remainingToNext - moved);
            setRemainingToNext(nextRemaining);
            if (nextRemaining <= 20) {
              setActiveStepIndex((idx) => {
                const nextIdx = Math.min(idx + 1, steps.length - 1);
                if (nextIdx !== idx) {
                  const d = steps[nextIdx]?.distance ?? null;
                  setRemainingToNext(d);
                }
                return nextIdx;
              });
            }
          }
        }
        lastPosRef.current = current;
        try {
          const wp: Array<{ lat: number; lng: number }> = [current];
          if (selectedForRoute?.pickup_latitude && selectedForRoute?.pickup_longitude) {
            wp.push({ lat: parseFloat(String(selectedForRoute.pickup_latitude)), lng: parseFloat(String(selectedForRoute.pickup_longitude)) });
          }
          if (selectedForRoute?.delivery_latitude && selectedForRoute?.delivery_longitude) {
            wp.push({ lat: parseFloat(String(selectedForRoute.delivery_latitude)), lng: parseFloat(String(selectedForRoute.delivery_longitude)) });
          }
          if (wp.length >= 2) {
            let offRoute = false;
            try {
              if (routeGeoJson) {
                const dist = distanceToRouteMeters(current, routeGeoJson);
                if (dist > 75) offRoute = true;
              }
            } catch {}
            if (!routeGeoJson || offRoute) {
              const route = await getOrFetchRoute(wp, false, travelMode);
              setRouteGeoJson((route as any).geojson);
              setRouteSegments(null);
              setRouteStats((route as any).stats || null);
              if (!route || !(route as any).geojson?.features?.length) {
                setError('Route update failed: no route found.');
              }
              const newSteps: RouteStep[] = [];
              try {
                const props = (route as any)?.geojson?.features?.[0]?.properties;
                const legs = props?.legs || props?.segments || [];
                legs.forEach((leg: any) => {
                  const legSteps = leg?.steps || [];
                  legSteps.forEach((s: any) => {
                    if (s?.instruction) {
                      const instr = typeof s.instruction === 'string' ? s.instruction : (s.instruction?.text ?? '');
                      newSteps.push({
                        instruction: instr,
                        distance: typeof s.distance === 'number' ? s.distance : undefined,
                        duration: typeof s.duration === 'number' ? s.duration : undefined,
                        name: s.name,
                        maneuver: s.maneuver,
                      });
                    }
                  });
                });
              } catch {}
              const fallbackSteps2 = newSteps.length > 0
                ? newSteps
                : [{ instruction: 'Continue towards destination', distance: (route as any)?.stats?.distance, duration: (route as any)?.stats?.duration } as RouteStep];
              setSteps(fallbackSteps2);
              setActiveStepIndex(0);
              setRemainingToNext(fallbackSteps2[0]?.distance ?? null);
            }
          }
        } catch (err) {
          console.error('Live tracking route update failed:', err);
        }

        try {
          if (navigationTarget && navPhase !== 'idle' && navPhase !== 'done') {
            const distToTarget = haversineMeters(current, navigationTarget);
            if (distToTarget < 20) {
              if (navPhase === 'toPickup') {
                const hasDrop = selectedForRoute?.delivery_latitude && selectedForRoute?.delivery_longitude;
                if (hasDrop) {
                  const drop = { lat: parseFloat(String(selectedForRoute.delivery_latitude)), lng: parseFloat(String(selectedForRoute.delivery_longitude)) };
                  setNavPhase('toDrop');
                  setNavigationTarget(drop);
                  buildCombinedRouteForNav([current, drop]);
                } else {
                  setNavPhase('done');
                  setNavigationTarget(null);
                  setTrackingEnabled(false);
                }
              } else if (navPhase === 'toDrop') {
                setNavPhase('done');
                setNavigationTarget(null);
                setTrackingEnabled(false);
              }
            }
          }
        } catch {}
      },
      (err) => {
        console.error('watchPosition error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    setGeoWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
      setGeoWatchId(null);
    };
  }, [trackingEnabled, selectedForRoute, travelMode]);

  const refreshLocation = () => {
    console.debug('[ND] Refreshing current location…');
    getCurrentLocation()
      .then(loc => {
        console.debug('[ND] Current location refreshed', loc);
        setUserLocation(loc);
        setLocationError(null);
      })
      .catch(err => {
        console.error('[ND] Refresh location failed', err);
        setLocationError('Unable to get your location. Using last known/default.');
      });
  };

  useEffect(() => {
    if (!voiceEnabled) return;
    const s = steps[activeStepIndex];
    const text = s?.instruction != null ? String((s as any).instruction?.text ?? s.instruction) : '';
    if (!text) return;
    try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        speechSynthesis.speak(u);
      }
    } catch {}
  }, [activeStepIndex, voiceEnabled]);

  const normalizeInstruction = (ins: any): string => {
    if (typeof ins === 'string') return ins;
    if (ins && typeof ins === 'object' && typeof ins.text === 'string') return ins.text;
    return String(ins ?? '');
  };
  const metersText = (m?: number | null) => {
    if (m == null || isNaN(m)) return '';
    return m < 1000 ? `${m.toFixed(0)} m` : `${(m / 1000).toFixed(1)} km`;
  };


  function haversineMeters(a: LatLng, b: LatLng): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000; // m
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function distanceToRouteMeters(p: LatLng, geojson: GeoJSON.FeatureCollection): number {
    const coords: Array<[number, number]> = [];
    for (const f of geojson.features as any[]) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === 'LineString') {
        coords.push(...(g.coordinates as [number, number][]));
      } else if (g.type === 'MultiLineString') {
        (g.coordinates as [number, number][][]).forEach(seg => coords.push(...seg));
      }
    }
    if (coords.length < 2) return Infinity;
    let min = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const a = { lat: coords[i][1], lng: coords[i][0] };
      const b = { lat: coords[i + 1][1], lng: coords[i + 1][0] };
      const d = pointToSegmentMeters(p, a, b);
      if (d < min) min = d;
    }
    return min;
  }

  function pointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const x = toRad(b.lng - a.lng) * Math.cos(toRad((a.lat + b.lat) / 2));
    const y = toRad(b.lat - a.lat);
    const len2 = x * x + y * y;
    if (len2 === 0) return haversineMeters(p, a);
    const xP = toRad(p.lng - a.lng) * Math.cos(toRad((a.lat + b.lat) / 2));
    const yP = toRad(p.lat - a.lat);
    let t = (xP * x + yP * y) / len2;
    t = Math.max(0, Math.min(1, t));
    const projLng = a.lng + (b.lng - a.lng) * t;
    const projLat = a.lat + (b.lat - a.lat) * t;
    return haversineMeters(p, { lat: projLat, lng: projLng });
  }

  const ArrowRightSmall = ({ className = 'inline-block mr-2 align-text-bottom text-gray-700', size = 14 }: { className?: string; size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );

  const maneuverIcon = (m?: any) => {
    const cls = 'inline-block mr-2 align-text-bottom text-gray-700';
    const mm = String(m ?? '').toLowerCase();
    if (mm.includes('uturn') || mm.includes('u-turn')) return <RotateCcw className={cls} size={14} />;
    if (mm.includes('roundabout')) return <RotateCw className={cls} size={14} />;
    if (mm.includes('slight') && mm.includes('right')) return <ArrowUpRight className={cls} size={14} />;
    if (mm.includes('slight') && mm.includes('left')) return <ArrowUpLeft className={cls} size={14} />;
    if (mm.includes('keep') && mm.includes('right')) return <CornerUpRight className={cls} size={14} />;
    if (mm.includes('keep') && mm.includes('left')) return <CornerUpLeft className={cls} size={14} />;
    if (mm.includes('right')) return <ArrowRightSmall />;
    if (mm.includes('left')) return <ArrowLeft className={cls} size={14} />;
    return <ArrowUp className={cls} size={14} />; // straight/default
  };

  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return 'Unknown';
    const distanceKm = distance / 1000;   
    return distanceKm < 1 
      ? `${distance.toFixed(0)} m` 
      : `${distanceKm.toFixed(1)} km`;
  };

  const formatDuration = (seconds?: number) => {
    if (seconds == null || isNaN(seconds)) return 'Unknown';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const getPriorityBadge = (priority: string) => {
    if (!priority) return null;
    
    const priorityClasses: Record<'high' | 'medium' | 'normal' | 'low', string> = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    const key = priority.toLowerCase() as 'high' | 'medium' | 'normal' | 'low';
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${priorityClasses[key] || 'bg-gray-100 border-gray-200'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = parseFloat(String(amount));
    return `NPR ${numAmount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Nearby Deliveries</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Nearby Deliveries</h1>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-2 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setError(null);
                    loadNearby();
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
          {routeStats && (
            <div className="text-sm text-gray-700 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <MapPin className="h-4 w-4 text-blue-600" /> {formatDistance(routeStats.distance)}
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Clock className="h-4 w-4 text-blue-600" /> {formatDuration(routeStats.duration)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const mapCenter = userLocation || 
    (deliveries.length > 0 && deliveries[0].pickup_latitude && deliveries[0].pickup_longitude
      ? { 
          lat: parseFloat(deliveries[0].pickup_latitude), 
          lng: parseFloat(deliveries[0].pickup_longitude) 
        }
      : { lat: 27.7172, lng: 85.3240 }); 

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Nearby Deliveries</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
          <div className="flex items-center gap-2">
            <label htmlFor="radius" className="text-sm font-medium">
              Radius:
            </label>
            <select
              id="radius"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="h-8 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <span className="hidden sm:inline-block h-5 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <label htmlFor="mode" className="text-sm font-medium">
              Mode:
            </label>
            <select
              id="mode"
              value={travelMode}
              onChange={(e) => setTravelMode(e.target.value as any)}
              className="h-8 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="driving">Driving</option>
              <option value="walking">Walking</option>
              <option value="cycling">Cycling</option>
            </select>

            <label className="flex items-center gap-2 ml-2">
              <input
                type="checkbox"
                checked={pickupDropOnly}
                onChange={(e) => setPickupDropOnly(e.target.checked)}
              />
              Pickup → Drop only
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={refreshLocation}
              className="whitespace-nowrap"
            >
              Use my location
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRouteGeoJson(null); setRouteSegments(null); setRouteStats(null); }}
              className="whitespace-nowrap"
            >
              Clear Route
            </Button>

            <span className="hidden sm:inline-block h-5 w-px bg-gray-200" />

            <Button
              variant="default"
              size="sm"
              onClick={planOptimizedRoute}
              className="whitespace-nowrap"
            >
              Plan Optimized Route
            </Button>

            <Button
              variant={trackingEnabled ? 'outline' : 'default'}
              size="sm"
              onClick={startNavigation}
              className="whitespace-nowrap"
            >
              Start Navigation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrackingEnabled(false)}
              className="whitespace-nowrap"
            >
              Stop Navigation
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceEnabled(v => !v)}
              className="whitespace-nowrap"
            >
              {voiceEnabled ? 'Mute Voice' : 'Unmute Voice'}
            </Button>
          </div>
        </div>
      </div>

      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{locationError}</p>
            </div>
          </div>
        </div>
      )}
      {!locationError && userLocation && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg mb-4 text-sm text-blue-800">
          Your location: lat {userLocation.lat.toFixed(5)}, lng {userLocation.lng.toFixed(5)}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Delivery Locations Map
        </h2>
        <div className="h-96 bg-gray-50 rounded-lg border overflow-hidden">
          <GalliMap
            apiKey={''}
            center={mapCenter}
            deliveries={deliveries}
            userLocation={userLocation}
            routeGeoJson={routeGeoJson}
            routeSegments={routeSegments || undefined}
            followUser={trackingEnabled}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          Available Deliveries in Your Area
        </h2>

        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-600 mb-4">
              There are no available deliveries within {radius} km of your location.
            </p>
            <Button onClick={() => setRadius(radius + 10)} variant="outline">
              Expand search to {radius + 10} km
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {deliveries.map((delivery: any) => (
                <div
                  key={delivery.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Details column */}
                    <div className="md:col-span-8">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedPlanIds.has(getDeliveryKey(delivery))}
                          onChange={() => toggleSelectForPlan(delivery)}
                        />
                        <h3 className="font-semibold text-lg text-gray-900">#{delivery.tracking_number}</h3>
                        {delivery.priority && getPriorityBadge(delivery.priority)}
                        {delivery.fragile && (
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-full">
                            Fragile
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-blue-500" />
                          <span>{delivery.distance_km} away</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-gray-500" />
                          <span>
                            {delivery.package_weight
                              ? `${parseFloat(delivery.package_weight).toFixed(1)} kg`
                              : 'Not specified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(delivery.delivery_fee)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(delivery.requested_pickup_date)}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Pickup:</span>
                            <span className="ml-1 text-gray-600">
                              {delivery.pickup_address || 'Address not provided'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Delivery:</span>
                            <span className="ml-1 text-gray-600">
                              {delivery.delivery_address || 'Address not provided'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {delivery.marketplace_sale && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <div>Order: {delivery.marketplace_sale.order_number}</div>
                          <div>Customer: {delivery.marketplace_sale.buyer_name}</div>
                          <div>Product: {delivery.marketplace_sale.product_name}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions column */}
                    <div className="md:col-span-4 flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          await computeRouteForDelivery(delivery);
                          setSelectedForRoute(delivery);
                          await startNavigation();
                        }}
                      >
                        Navigate
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          alert(`Viewing details for delivery ${delivery.tracking_number}`);
                        }}
                      >
                        View Details
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          try {
                            setAcceptingId(getDeliveryKey(delivery));
                            const idForApi = String(delivery.delivery_id || delivery.id);
                            await claimDelivery(idForApi);
                            setAcceptedDeliveryIds((prev) => new Set(prev).add(getDeliveryKey(delivery)));
                          } catch (e) {
                            console.error('Accept job failed:', e);
                            setError('Failed to accept job. Please try again.');
                          } finally {
                            setAcceptingId(null);
                          }
                        }}
                      >
                        {acceptingId === getDeliveryKey(delivery) ? 'Accepting...' : 'Accept Job'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => computeRouteForDelivery(delivery)}
                      >
                        Show Route
                      </Button>

                      {selectedForRoute && getDeliveryKey(selectedForRoute) === getDeliveryKey(delivery) && acceptedDeliveryIds.has(getDeliveryKey(delivery)) && (
                        <Button
                          variant={trackingEnabled ? 'default' : 'outline'}
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (trackingEnabled) {
                              setTrackingEnabled(false);
                            } else {
                              // ensure this card's delivery is the active route
                              setSelectedForRoute(delivery);
                              startNavigation();
                            }
                          }}
                        >
                          {trackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs text-gray-500">
                    <div>Tracking: {delivery.tracking_number}</div>
                    <div>Priority: {delivery.priority_display || delivery.priority || 'Not specified'}</div>
                  </div>
                </div>
              ))}
              </div>
              <div className="lg:col-span-1 border rounded-lg p-4 h-fit max-h-[480px] overflow-auto lg:sticky lg:top-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Turn-by-turn</h3>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                    />
                    Voice
                  </label>
                </div>
                {steps.length === 0 ? (
                  <p className="text-sm text-gray-500">No route planned yet.</p>
                ) : (
                  <div>
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded text-sm">
                      <div className="font-medium text-blue-800">Next</div>
                      <div className="text-blue-700">{normalizeInstruction(steps[activeStepIndex]?.instruction) || '—'}</div>
                      {remainingToNext != null && (
                        <div className="text-xs text-blue-600 mt-1">in {metersText(remainingToNext)}</div>
                      )}
                    </div>
                    <div className="mb-3">
                      <Button variant="default" size="sm" onClick={() => setNavFullScreen(true)}>Full Screen Nav</Button>
                    </div>
                    <ol className="ml-2 space-y-1 text-sm">
                      {steps.map((s, idx) => (
                        <li key={idx} className={`flex items-start ${idx === activeStepIndex ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          <span className="mt-[2px]">{maneuverIcon(s.maneuver || s.instruction)}</span>
                          <span>
                            {normalizeInstruction(s.instruction)}
                            {typeof s.distance === 'number' && (
                              <span className="ml-1 text-xs text-gray-500">({metersText(s.distance)})</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              {navFullScreen && (
                <div className="fixed inset-0 z-50 bg-white">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="text-lg font-semibold">Navigation</div>
                    <button className="p-2 rounded hover:bg-gray-100" onClick={() => setNavFullScreen(false)} aria-label="Close navigation">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="rounded-xl border bg-blue-50 p-5">
                      <div className="text-sm text-blue-700">Next</div>
                      <div className="mt-1 text-2xl font-bold text-blue-900">
                        {steps.length > 0 ? (normalizeInstruction(steps[activeStepIndex]?.instruction) || '—') : 'Preparing route…'}
                      </div>
                      {remainingToNext != null && (
                        <div className="mt-1 text-blue-700">in {metersText(remainingToNext)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant={trackingEnabled ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setTrackingEnabled(v => !v)}
                      >
                        {trackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
                      </Button>
                      <Button
                        variant={voiceEnabled ? 'default' : 'outline'}
                        size="lg"
                        onClick={() => setVoiceEnabled(v => !v)}
                      >
                        {voiceEnabled ? 'Voice On' : 'Voice Off'}
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => setNavFullScreen(false)}>Close</Button>
                    </div>
                    <div className="max-h-[50vh] overflow-auto border rounded-lg p-4">
                      {steps.length === 0 ? (
                        <div className="text-sm text-gray-600">No detailed steps available. Press "Start Tracking" to begin live guidance.</div>
                      ) : (
                        <ol className="space-y-2">
                          {steps.map((s, idx) => (
                            <li key={idx} className={`flex items-start ${idx === activeStepIndex ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              <span className="mt-[3px]">{maneuverIcon(s.maneuver || s.instruction)}</span>
                              <span>
                                {normalizeInstruction(s.instruction)}
                                {typeof s.distance === 'number' && (
                                  <span className="ml-1 text-xs text-gray-500">({metersText(s.distance)})</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="fixed bottom-3 left-3 right-3 z-30 lg:hidden">
                {steps.length > 0 && (
                  <div className="bg-white border shadow-lg rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Next</div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {steps[activeStepIndex]?.instruction || '—'}
                      </div>
                      {remainingToNext != null && (
                        <div className="text-xs text-gray-600">in {metersText(remainingToNext)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={trackingEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTrackingEnabled(v => !v)}
                        className="whitespace-nowrap"
                      >
                        {trackingEnabled ? 'Stop' : 'Track'}
                      </Button>
                      <Button
                        variant={voiceEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setVoiceEnabled(v => !v)}
                        className="whitespace-nowrap"
                      >
                        Voice
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default NearbyDeliveries;
