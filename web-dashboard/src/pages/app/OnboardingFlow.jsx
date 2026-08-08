import { useState, useEffect, useRef } from 'react';
import { Navigation, Settings, MapPin, Compass, Radio, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';

const TILE = 256;
const ZOOM = 15;
const RADIUS = 1; // 3x3 tile grid
const GRID = (RADIUS * 2 + 1) * TILE;

function project(lat, lon, zoom) {
  const scale = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

function cardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try { return (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch (e) { return false; }
  }
  return true;
}
async function requestMotionPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try { return (await DeviceMotionEvent.requestPermission()) === 'granted'; } catch (e) { return false; }
  }
  return true;
}

function MapTiles({ lat, lon, onFail }) {
  const [failed, setFailed] = useState(false);
  const { x, y } = project(lat, lon, ZOOM);
  const centerTileX = Math.floor(x);
  const centerTileY = Math.floor(y);
  const worldX = x * TILE;
  const worldY = y * TILE;
  const tiles = [];
  for (let dx = -RADIUS; dx <= RADIUS; dx++) {
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      const tx = centerTileX + dx;
      const ty = centerTileY + dy;
      const left = tx * TILE - worldX + GRID / 2;
      const top = ty * TILE - worldY + GRID / 2;
      tiles.push({ tx, ty, left, top });
    }
  }
  if (failed) {
    return (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: GRID, height: GRID }}>
        <div className="h-full w-full bg-slate-900" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>
    );
  }
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden" style={{ width: GRID, height: GRID }}>
      {tiles.map((t) => (
        <img
          key={`${t.tx}-${t.ty}`}
          src={`https://tile.openstreetmap.org/${ZOOM}/${t.tx}/${t.ty}.png`}
          alt=""
          className="absolute opacity-80"
          style={{ left: t.left, top: t.top, width: TILE, height: TILE }}
          onError={() => { setFailed(true); onFail && onFail(); }}
        />
      ))}
      <div className="absolute inset-0 bg-slate-950/40" />
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <ShieldCheck className="mb-4 h-10 w-10 text-teal-500" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-teal-500" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

function LocationSetup({ onLocated }) {
  const [manual, setManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function saveAndContinue(loc) {
    try {
  localStorage.setItem('user-location', JSON.stringify(loc)); } catch (e) { /* ignore storage quota errors */ }
    onLocated(loc);
  }

  function usePrecise() {
    setError(''); setLoading(true);
    if (!navigator.geolocation) { setError('Location services are not available in this browser.'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await saveAndContinue({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' }); setLoading(false); },
      () => { setError('Location permission was denied or unavailable — try entering a ZIP code or city below.'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function useManual() {
    if (!manual.trim()) return;
    setError(''); setLoading(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(manual)}`);
      const data = await resp.json();
      if (data && data[0]) {
        await saveAndContinue({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), source: 'manual', label: manual });
      } else {
        setError("Couldn't find that location — try a full city name or ZIP code.");
      }
    } catch (e) {
      setError("Couldn't reach the location lookup service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <MapPin className="mb-4 h-8 w-8 text-teal-500" />
        <h1 className="text-xl font-semibold text-slate-100">Share your location</h1>
        <p className="mt-2 text-sm text-slate-400">Used once to load a map of your area. You can change this anytime in settings.</p>

        <button onClick={usePrecise} disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} Use precise location
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
          <div className="h-px flex-1 bg-slate-800" /> or <div className="h-px flex-1 bg-slate-800" />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-300">ZIP code or city</span>
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 30303 or Atlanta, GA"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500" />
            <button onClick={useManual} disabled={loading} className="shrink-0 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-60">Go</button>
          </div>
        </label>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}

function HomeField({ location, onOpenSettings }) {
  const [heading, setHeading] = useState(0);
  const [activity, setActivity] = useState(0.15);
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [meshConnected, setMeshConnected] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const lastMag = useRef(null);

  useEffect(() => {
    if (!sensorsEnabled) return;
    function handleOrientation(e) {
      if (typeof e.webkitCompassHeading === 'number') setHeading(e.webkitCompassHeading);
      else if (e.alpha != null) setHeading(360 - e.alpha);
    }
    function handleMotion(e) {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const delta = lastMag.current == null ? 0 : Math.abs(mag - lastMag.current);
      lastMag.current = mag;
      setActivity((prev) => prev * 0.85 + Math.min(delta / 6, 1) * 0.15);
    }
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [sensorsEnabled]);

  async function enableSensors() {
    const oriOk = await requestOrientationPermission();
    const motOk = await requestMotionPermission();
    setSensorsEnabled(oriOk || motOk);
  }

  const pulseDuration = 2.4 - activity * 1.4;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <style>{`
        @keyframes beacon-ring { 0% { transform: scale(0.6); opacity: 0.55; } 100% { transform: scale(2.4); opacity: 0; } }
      `}</style>

      <MapTiles lat={location.lat} lon={location.lon} onFail={() => setMapFailed(true)} />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500"
          style={{ animation: `beacon-ring ${pulseDuration}s ease-out infinite` }} />
        <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500"
          style={{ animation: `beacon-ring ${pulseDuration}s ease-out infinite`, animationDelay: `${pulseDuration / 2}s` }} />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-teal-500 shadow-lg shadow-teal-500/50">
          <Navigation className="h-6 w-6 text-slate-950" style={{ transform: `rotate(${heading}deg)`, transition: 'transform 0.2s linear' }} />
        </div>
      </div>

      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 backdrop-blur">
          <ShieldCheck className="h-4 w-4 text-teal-500" />
          <span className="text-xs font-medium text-slate-200">Live</span>
        </div>
        <button onClick={onOpenSettings} className="rounded-full bg-slate-900/80 p-2 text-slate-300 backdrop-blur hover:text-white">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {mapFailed && (
        <div className="absolute left-4 right-4 top-16 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Map tiles unavailable — showing approximate position only.
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-slate-800 bg-slate-900/90 px-4 pb-6 pt-4 backdrop-blur">
        {!sensorsEnabled && (
          <button onClick={enableSensors} className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-sm font-medium text-teal-400 hover:bg-teal-500/20">
            <Compass className="h-4 w-4" /> Enable compass & motion
          </button>
        )}

        <div className="mb-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Compass className="h-4 w-4 text-slate-500" />
            <span className="font-mono">{cardinal(heading)} · {Math.round(((heading % 360) + 360) % 360)}°</span>
          </div>
          <span className="font-mono text-xs text-slate-500">{location.lat.toFixed(4)}, {location.lon.toFixed(4)}</span>
        </div>

        <button onClick={() => setMeshConnected((v) => !v)}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${meshConnected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
          <span className="flex items-center gap-2"><Radio className="h-4 w-4" /> {meshConnected ? 'Meshtastic device connected' : 'No Meshtastic device connected — phone location only'}</span>
          <span className="text-xs">{meshConnected ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('splash');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((res) => setTimeout(res, 1100));
    (async () => {
      let loc = null;
      try {
        const storedData = localStorage.getItem('user-location');
        if (storedData) loc = JSON.parse(storedData);
        
      } catch (e) { /* no stored location yet */ }
      await minDelay;
      if (cancelled) return;
      if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
        setLocation(loc);
        setView('home');
      } else {
        setView('setup');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (view === 'splash') return <Splash />;
  if (view === 'setup') return <LocationSetup onLocated={(loc) => { setLocation(loc); setView('home'); }} />;
  return <HomeField location={location} onOpenSettings={() => setView('setup')} />;
}
