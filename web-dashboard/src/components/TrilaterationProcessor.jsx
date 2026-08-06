import React, { useState, useEffect } from 'react';

/**
 * Calculates the emergency position coordinate using 2D Trilateration math.
 * @param {Object} n1 - Node 1 coordinates {x, y} and signal radius {r}
 * @param {Object} n2 - Node 2 coordinates {x, y} and signal radius {r}
 * @param {Object} n3 - Node 3 coordinates {x, y} and signal radius {r}
 */
const calculateTrilateration = (n1, n2, n3) => {
  // Math constants for circle intersections
  const A = 2 * n2.x - 2 * n1.x;
  const B = 2 * n2.y - 2 * n1.y;
  const C = Math.pow(n1.r, 2) - Math.pow(n2.r, 2) - Math.pow(n1.x, 2) + Math.pow(n2.x, 2) - Math.pow(n1.y, 2) + Math.pow(n2.y, 2);
  const D = 2 * n3.x - 2 * n2.x;
  const E = 2 * n3.y - 2 * n2.y;
  const F = Math.pow(n2.r, 2) - Math.pow(n3.r, 2) - Math.pow(n2.x, 2) + Math.pow(n3.x, 2) - Math.pow(n2.y, 2) + Math.pow(n3.y, 2);

  // Compute intersected coordinate points
  const targetX = (C * E - F * B) / (A * E - D * B);
  const targetY = (A * F - Math.sign(D) * C) / (A * E - D * B);

  return { x: parseFloat(targetX.toFixed(5)), y: parseFloat(targetY.toFixed(5)) };
};

export const EmergencyDashboard = () => {
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Mock tracking function handling incoming raw JSON data strings from listening nodes
  const handleIncomingNetworkPacket = (packetData) => {
    // Expected format: { node_id: "MS_NODE_049A", node1_metrics: {x: 0, y:0, r: 15}, ... }
    if (packetData.status === "EMERGENCY") {
      const location = calculateTrilateration(
        packetData.node1_metrics,
        packetData.node2_metrics,
        packetData.node3_metrics
      );
      
      setActiveAlerts((prev) => [...prev, { id: packetData.node_id, coordinates: location, timestamp: new Date() }]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#111', color: '#fff' }}>
      <h2>🚨 Community Mesh Security Center</h2>
      <div style={{ border: '1px solid #ff4444', padding: '15px', borderRadius: '5px' }}>
        <h3>Active System Threats</h3>
        {activeAlerts.length === 0 ? (
          <p style={{ color: '#888' }}>Monitoring airwaves... Network status clear.</p>
        ) : (
          <ul>
            {activeAlerts.map((alert, index) => (
              <li key={index} style={{ marginBottom: '10px', color: '#ff6666' }}>
                <strong>TARGET IMPLICATED: {alert.id}</strong> <br />
                Calculated Trilateration Target Grid Intersect: [X: {alert.coordinates.x}, Y: {alert.coordinates.y}] <br />
                System Time Stamp: {alert.timestamp.toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
