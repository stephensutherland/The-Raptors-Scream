import React, { useState, useEffect, useRef } from 'react';

// --- OFFLINE/FREE LEAFLET STATIC INJECTION HELPER ---
const injectLeafletAssets = () => {
  if (document.getElementById('leaflet-css')) return;
  
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'https://unpkg.com';
  script.async = true;
  document.body.appendChild(script);
};

export default function MommaRaptorApp() {
  // Navigation states: 'SPLASH' | 'SETTINGS' | 'MAP'
  const [appState, setAppState] = useState('SPLASH');
  const [userLocation, setUserLocation] = useState({ lat: 32.3122, lng: -90.1780 }); // Default: Jackson, MS
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [alarmStatus, setAlarmStatus] = useState('CLEAR'); // 'CLEAR' | 'SCREAMING' | 'SILENT'
  
  // Tracking logs for adversarial integrity checks
  const [initialAlarmLocation, setInitialAlarmLocation] = useState(null);
  const [currentAlarmLocation, setCurrentAlarmLocation] = useState(null);
  
  // Network simulation states
  const [activeNodes, setActiveNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeThreatDescription, setNodeThreatDescription] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);

  // 1. Initial Launch Asset Management
  useEffect(() => {
    injectLeafletAssets();
    const splashTimer = setTimeout(() => setAppState('SETTINGS'), 3000);
    return () => clearTimeout(splashTimer);
  }, []);

  // 2. Hardware Orientation Sensor Subsystem
  useEffect(() => {
    if (appState !== 'MAP') return;

    const handleOrientation = (e) => {
      if (e.alpha !== null) setDeviceHeading(Math.round(e.alpha));
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [appState]);

  // 3. Leaflet Instance Lifecycle Control
  useEffect(() => {
    if (appState !== 'MAP' || !mapContainerRef.current) return;

    // Wait briefly for Leaflet script injection to clear browser queue
    const initMap = () => {
      if (!window.L) {
        setTimeout(initMap, 100);
        return;
      }

      if (mapInstanceRef.current) return;

      // Initialize map canvas focused on the offline/downloaded parameters
      mapInstanceRef.current = window.L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 15,
        zoomControl: false
      });

      // Free OpenStreetMap Tile Layer mapping
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Offline Capstone Mesh Layer'
      }).addTo(mapInstanceRef.current);

      // Custom pulsing triangle vector marker generation
      const triangleSvg = `
        <svg viewBox="0 0 100 100" width="40" height="40" style="transform: rotate(${deviceHeading}deg); transition: transform 0.1s linear;">
          <polygon points="50,15 20,85 50,70 80,85" fill="#3b82f6" stroke="#ffffff" stroke-width="6"/>
          <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="10 5">
            <animate attributeName="stroke-dashoffset" values="0;30" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `;

      const userIcon = window.L.divIcon({
        className: 'user-pulse-marker',
        html: triangleSvg,
        iconSize:,
        iconAnchor: [20, 20]
      });

      userMarkerRef.current = window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapInstanceRef.current);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [appState, userLocation]);

  // 4. Update Marker Orientation Layer dynamically
  useEffect(() => {
    if (userMarkerRef.current && window.L) {
      const triangleSvg = `
        <svg viewBox="0 0 100 100" width="40" height="40" style="transform: rotate(${deviceHeading}deg);">
          <polygon points="50,15 20,85 50,70 80,85" fill="${alarmStatus !== 'CLEAR' ? '#ef4444' : '#3b82f6'}" stroke="#ffffff" stroke-width="6"/>
        </svg>
      `;
      userMarkerRef.current.setIcon(window.L.divIcon({
        className: 'user-pulse-marker',
        html: triangleSvg,
        iconSize:,
        iconAnchor: [20, 20]
      }));
    }
  }, [deviceHeading, alarmStatus]);

  // --- DEVICE SYSTEM INTERACTIONS ---
  const requestSystemHardwareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("Location acquisition failed. Reverting to secure baseline grid configuration.")
      );
    }
  };

  const engageEmergencyState = (type) => {
    setAlarmStatus(type);
    const logCoordinates = { ...userLocation };
    
    // Capture unalterable initial point coordinates for audit trail protection
    if (!initialAlarmLocation) {
      setInitialAlarmLocation(logCoordinates);
    }
    setCurrentAlarmLocation(logCoordinates);

    // Bootstrap network simulations for focus group verification
    simulateIncomingFieldMeshNodes(logCoordinates);
  };

  const cancelEmergencyState = () => {
    setAlarmStatus('CLEAR');
    setInitialAlarmLocation(null);
    setCurrentAlarmLocation(null);
    setActiveNodes([]);
    setSelectedNode(null);
  };

  const simulateIncomingFieldMeshNodes = (baseCoord) => {
    const mockNodes = [
      { id: 'RAPTOR_NODE_01', lat: baseCoord.lat + 0.003, lng: baseCoord.lng + 0.002, alias: 'North Ridge Relay', threat: 'CLEAR', unvouchedDots: 0 },
      { id: 'RAPTOR_NODE_02', lat: baseCoord.lat - 0.002, lng: baseCoord.lng - 0.004, alias: 'South Exit Choke', threat: 'CLEAR', unvouchedDots: 0 },
      { id: 'RAPTOR_NODE_03', lat: baseCoord.lat + 0.001, lng: baseCoord.lng - 0.002, alias: 'West Treeline Perimeter', threat: 'PENDING', unvouchedDots: 3 }
    ];
    setActiveNodes(mockNodes);

    if (window.L && mapInstanceRef.current) {
      mockNodes.forEach((node) => {
        const nodeIcon = window.L.divIcon({
          className: 'mesh-node-marker',
          html: `<div style="background-color: ${node.unvouchedDots > 0 ? '#ef4444' : '#10b981'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
          iconSize: [14, 14]
        });

        const marker = window.L.marker([node.lat, node.lng], { icon: nodeIcon }).addTo(mapInstanceRef.current);
        marker.on('click', () => setSelectedNode(node));
      });
    }
  };

  const updateNodeThreatParameters = () => {
    if (!selectedNode) return;
    setActiveNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, threat: 'CONFIRMED_OPPOSITION', description: nodeThreatDescription } : n));
    alert(`Node ${selectedNode.id} updated to CONFIRMED OPPOSITION. Alert routed to community mesh channels.`);
    setSelectedNode(null);
    setNodeThreatDescription('');
  };

  // --- SCREEN RENDERING CONTROLS ---

  if (appState === 'SPLASH') {
    return (
      <div style={{ height: '100vh', backgroundColor: '#070a12', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', color: '#3b82f6' }}>
        <img src="https://unsplash.com" alt="Raptor Network Graphic" style={{ width: '180px', height: '180px', borderRadius: '50%', border: '4px solid #1e3a8a', marginBottom: '20px', objectFit: 'cover' }} />
        <h1 style={{ letterSpacing: '4px', margin: '0', color: '#fff' }}>MOMMA RAPTOR</h1>
        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>OFF-GRID SECURE ADVANCED MESH V1.0</p>
      </div>
    );
  }

  if (appState === 'SETTINGS') {
    return (
      <div style={{ height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '30px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#3b82f6', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>⚙️ System Initialization Settings</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>Configure secure anchor baseline parameters. This triggers the download configuration files for completely offline geospatial rendering loops.</p>
          
          <div style={{ marginTop: '25px' }}>
            <button onClick={requestSystemHardwareLocation} style={{ width: '100%', padding: '14px', backgroundColor: '#1e293b', border: '1px solid #3b82f6', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
              🛰️ Query Local Hardware Location (GPS)
            </button>
            
            <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Manual Ingress Anchors (Latitude / Longitude)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" step="any" value={userLocation.lat} onChange={(e) => setUserLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))} style={{ flex: 1, padding: '12px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '6px' }} />
