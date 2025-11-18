import React, { useState, useEffect } from 'react';
import './App.css';

// Data lokasi kampus dengan koordinat
const initialLocations = [
  { name: "Gerbang Utama", x: 50, y: 300 },
  { name: "Fakultas Teknik", x: 250, y: 250 },
  { name: "Perpustakaan", x: 150, y: 400 },
  { name: "Laboratorium", x: 350, y: 200 },
  { name: "Kantin", x: 300, y: 100 },
  { name: "Rektorat", x: 200, y: 500 },
  { name: "Gedung Olahraga", x: 450, y: 50 },
  { name: "Masjid", x: 400, y: 450 },
  { name: "Gerbang Belakang", x: 500, y: 400 }
];

// Data rute antar lokasi
const initialRoutes = [
  { from: "Gerbang Utama", to: "Fakultas Teknik", distance: 200 },
  { from: "Gerbang Utama", to: "Perpustakaan", distance: 150 },
  { from: "Fakultas Teknik", to: "Laboratorium", distance: 100 },
  { from: "Fakultas Teknik", to: "Kantin", distance: 180 },
  { from: "Perpustakaan", to: "Rektorat", distance: 120 },
  { from: "Perpustakaan", to: "Kantin", distance: 200 },
  { from: "Laboratorium", to: "Kantin", distance: 90 },
  { from: "Laboratorium", to: "Gedung Olahraga", distance: 250 },
  { from: "Kantin", to: "Rektorat", distance: 160 },
  { from: "Kantin", to: "Gedung Olahraga", distance: 200 },
  { from: "Rektorat", to: "Masjid", distance: 80 },
  { from: "Gedung Olahraga", to: "Masjid", distance: 150 },
  { from: "Masjid", to: "Gerbang Belakang", distance: 100 },
  { from: "Gedung Olahraga", to: "Gerbang Belakang", distance: 180 }
];

function App() {
  const [locations, setLocations] = useState(initialLocations);
  const [routes] = useState(initialRoutes);
  const [graph, setGraph] = useState({});
  const [startLoc, setStartLoc] = useState("");
  const [endLoc, setEndLoc] = useState("");
  const [shortestPath, setShortestPath] = useState(null);
  const [pathDistance, setPathDistance] = useState(0);
  const [customLocation, setCustomLocation] = useState(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("Posisi Saya");
  const [customX, setCustomX] = useState(250);
  const [customY, setCustomY] = useState(250);
  const [activeTab, setActiveTab] = useState('search');

  // Build graph dari routes
  useEffect(() => {
    const g = {};
    locations.forEach(loc => {
      g[loc.name] = {};
    });
    routes.forEach(route => {
      g[route.from][route.to] = route.distance;
      g[route.to][route.from] = route.distance;
    });
    setGraph(g);
  }, [locations, routes]);

  // Algoritma Dijkstra
  const dijkstra = (start, end) => {
    const distances = {};
    const previous = {};
    const pq = [];
    const visited = new Set();

    locations.forEach(loc => {
      distances[loc.name] = Infinity;
      previous[loc.name] = null;
    });
    distances[start] = 0;
    pq.push({ location: start, distance: 0 });

    while (pq.length > 0) {
      pq.sort((a, b) => a.distance - b.distance);
      const { location: current } = pq.shift();

      if (visited.has(current)) continue;
      visited.add(current);

      if (current === end) break;

      const neighbors = graph[current] || {};
      for (const [neighbor, weight] of Object.entries(neighbors)) {
        const distance = distances[current] + weight;
        if (distance < distances[neighbor]) {
          distances[neighbor] = distance;
          previous[neighbor] = current;
          pq.push({ location: neighbor, distance });
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = end;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    if (path[0] !== start) return { path: null, distance: Infinity };
    return { path, distance: distances[end] };
  };

  const handleSearch = () => {
    if (!startLoc || !endLoc) {
      alert("Pilih lokasi awal dan tujuan!");
      return;
    }
    if (startLoc === endLoc) {
      alert("Lokasi awal dan tujuan tidak boleh sama!");
      return;
    }

    const result = dijkstra(startLoc, endLoc);
    if (result.path === null) {
      alert("Tidak ada jalur yang menghubungkan kedua lokasi!");
      setShortestPath(null);
    } else {
      setShortestPath(result.path);
      setPathDistance(result.distance);
    }
  };

  const addCustomLocation = () => {
    if (!customName.trim()) {
      alert("Nama lokasi tidak boleh kosong!");
      return;
    }

    if (locations.find(loc => loc.name === customName)) {
      alert("Nama lokasi sudah ada!");
      return;
    }

    const newLoc = { name: customName, x: customX, y: customY };
    
    const distances = locations.map(loc => ({
      name: loc.name,
      dist: Math.sqrt((loc.x - customX) ** 2 + (loc.y - customY) ** 2)
    }));
    distances.sort((a, b) => a.dist - b.dist);
    
    setLocations([...locations, newLoc]);
    
    const newGraph = { ...graph };
    newGraph[customName] = {};
    distances.slice(0, 3).forEach(({ name, dist }) => {
      newGraph[customName][name] = Math.round(dist);
      newGraph[name][customName] = Math.round(dist);
    });
    setGraph(newGraph);
    
    setCustomLocation(customName);
    setShowCustomForm(false);
    alert(`Lokasi '${customName}' berhasil ditambahkan!`);
  };

  const removeCustomLocation = () => {
    if (!customLocation) return;
    
    const newLocs = locations.filter(loc => loc.name !== customLocation);
    setLocations(newLocs);
    
    const newGraph = { ...graph };
    delete newGraph[customLocation];
    Object.keys(newGraph).forEach(key => {
      delete newGraph[key][customLocation];
    });
    setGraph(newGraph);
    
    if (startLoc === customLocation) setStartLoc("");
    if (endLoc === customLocation) setEndLoc("");
    if (shortestPath && shortestPath.includes(customLocation)) {
      setShortestPath(null);
    }
    
    setCustomLocation(null);
    alert(`Lokasi '${customLocation}' berhasil dihapus!`);
  };

  const getCoords = (name) => {
    const loc = locations.find(l => l.name === name);
    return loc ? { x: loc.x, y: loc.y } : { x: 0, y: 0 };
  };

  const isPathEdge = (loc1, loc2) => {
    if (!shortestPath) return false;
    for (let i = 0; i < shortestPath.length - 1; i++) {
      if ((shortestPath[i] === loc1 && shortestPath[i + 1] === loc2) ||
          (shortestPath[i] === loc2 && shortestPath[i + 1] === loc1)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="app-container">
      <div className="main-wrapper">
        {/* Header */}
        <div className="header-card">
          <div className="header-content">
            <span className="icon-nav">🧭</span>
            <h1 className="header-title">Smart Campus Navigator</h1>
          </div>
          <p className="header-subtitle">Pencarian Rute Terpendek dengan Algoritma Dijkstra</p>
        </div>

        <div className="content-grid">
          {/* Control Panel */}
          <div className="control-panel">
            {/* Tab Navigation */}
            <div className="tab-container">
              <button
                onClick={() => setActiveTab('search')}
                className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
              >
                🔍 Cari Rute
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
              >
                ➕ Custom
              </button>
            </div>

            {/* Search Panel */}
            {activeTab === 'search' && (
              <div className="panel-card">
                <h2 className="panel-title">
                  <span>🛣️</span> Pencarian Rute
                </h2>
                
                <div className="form-group">
                  <label className="form-label">🚩 Lokasi Awal</label>
                  <select
                    value={startLoc}
                    onChange={(e) => setStartLoc(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Pilih lokasi awal...</option>
                    {locations.map(loc => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} {loc.name === customLocation ? '🔸' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">🏁 Lokasi Tujuan</label>
                  <select
                    value={endLoc}
                    onChange={(e) => setEndLoc(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Pilih lokasi tujuan...</option>
                    {locations.map(loc => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} {loc.name === customLocation ? '🔸' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button onClick={handleSearch} className="btn-primary">
                  🔍 Cari Rute Terpendek
                </button>

                {/* Results */}
                {shortestPath && (
                  <div className="result-card">
                    <h3 className="result-title">📊 Hasil Pencarian</h3>
                    <div className="result-row">
                      <span>Jarak:</span>
                      <strong>{pathDistance}m ({(pathDistance/1000).toFixed(2)}km)</strong>
                    </div>
                    <div className="result-row">
                      <span>Jumlah Lokasi:</span>
                      <strong>{shortestPath.length}</strong>
                    </div>
                    <div className="result-row">
                      <span>Waktu Estimasi:</span>
                      <strong>{(pathDistance/83.33).toFixed(1)} menit</strong>
                    </div>
                    <div className="path-detail">
                      <p className="path-label">🛣️ Jalur:</p>
                      {shortestPath.map((loc, idx) => (
                        <div key={idx} className="path-item">
                          <span className="path-number">{idx + 1}.</span>
                          <span className="path-name">{loc}</span>
                          {idx < shortestPath.length - 1 && (
                            <span className="path-distance">
                              ({graph[loc][shortestPath[idx + 1]]}m)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Location Panel */}
            {activeTab === 'custom' && (
              <div className="panel-card">
                <h2 className="panel-title">
                  <span>📍</span> Posisi Custom
                </h2>

                {customLocation && (
                  <div className="custom-info">
                    <div>
                      <p className="custom-name">📍 {customLocation}</p>
                      <p className="custom-label">Lokasi custom aktif</p>
                    </div>
                    <button onClick={removeCustomLocation} className="btn-delete">
                      🗑️
                    </button>
                  </div>
                )}

                {!showCustomForm && !customLocation && (
                  <button onClick={() => setShowCustomForm(true)} className="btn-primary">
                    ➕ Tambah Posisi Custom
                  </button>
                )}

                {showCustomForm && (
                  <div className="form-custom">
                    <div className="form-group">
                      <label className="form-label">Nama Lokasi</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="form-input"
                        placeholder="Posisi Saya"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Koordinat X (0-550)</label>
                      <input
                        type="number"
                        value={customX}
                        onChange={(e) => setCustomX(Number(e.target.value))}
                        className="form-input"
                        min="0"
                        max="550"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Koordinat Y (0-550)</label>
                      <input
                        type="number"
                        value={customY}
                        onChange={(e) => setCustomY(Number(e.target.value))}
                        className="form-input"
                        min="0"
                        max="550"
                      />
                    </div>
                    <div className="btn-group">
                      <button onClick={addCustomLocation} className="btn-success">
                        Tambah
                      </button>
                      <button onClick={() => setShowCustomForm(false)} className="btn-cancel">
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                <div className="info-box">
                  <p>💡 <strong>Tips:</strong> Lokasi custom akan otomatis terhubung ke 3 lokasi terdekat</p>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="legend-card">
              <h3 className="legend-title">🗺️ Legenda</h3>
              <div className="legend-item">
                <div className="legend-dot green"></div>
                <span>Lokasi Awal</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot red"></div>
                <span>Lokasi Tujuan</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot yellow"></div>
                <span>Jalur Dilalui</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot orange"></div>
                <span>Posisi Custom</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot blue"></div>
                <span>Lokasi Lain</span>
              </div>
              <div className="legend-item">
                <div className="legend-line gray"></div>
                <span>Rute Biasa</span>
              </div>
              <div className="legend-item">
                <div className="legend-line red-line"></div>
                <span>Rute Terpendek</span>
              </div>
            </div>
          </div>

          {/* Map Visualization */}
          <div className="map-container">
            <div className="map-card">
              <h2 className="map-title">🗺️ Peta Kampus</h2>
              <div className="svg-wrapper">
                <svg viewBox="0 0 550 550" className="map-svg">
                  {/* Draw all routes */}
                  {routes.map((route, idx) => {
                    const from = getCoords(route.from);
                    const to = getCoords(route.to);
                    const isPath = isPathEdge(route.from, route.to);
                    return (
                      <g key={idx}>
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={isPath ? "#ef4444" : "#d1d5db"}
                          strokeWidth={isPath ? "4" : "2"}
                          opacity={isPath ? "1" : "0.5"}
                        />
                        {!isPath && (
                          <text
                            x={(from.x + to.x) / 2}
                            y={(from.y + to.y) / 2}
                            fill="#6b7280"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {route.distance}m
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Draw custom location connections */}
                  {customLocation && Object.entries(graph[customLocation] || {}).map(([neighbor, dist], idx) => {
                    const from = getCoords(customLocation);
                    const to = getCoords(neighbor);
                    const isPath = isPathEdge(customLocation, neighbor);
                    return (
                      <g key={`custom-${idx}`}>
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={isPath ? "#ef4444" : "#fb923c"}
                          strokeWidth={isPath ? "4" : "2"}
                          strokeDasharray={isPath ? "0" : "5,5"}
                          opacity="0.7"
                        />
                      </g>
                    );
                  })}

                  {/* Draw locations */}
                  {locations.map((loc, idx) => {
                    let color = "#93c5fd";
                    let strokeColor = "#2563eb";
                    
                    if (loc.name === customLocation) {
                      color = "#fb923c";
                      strokeColor = "#ea580c";
                    } else if (shortestPath && loc.name === shortestPath[0]) {
                      color = "#86efac";
                      strokeColor = "#16a34a";
                    } else if (shortestPath && loc.name === shortestPath[shortestPath.length - 1]) {
                      color = "#fca5a5";
                      strokeColor = "#dc2626";
                    } else if (shortestPath && shortestPath.includes(loc.name)) {
                      color = "#fde047";
                      strokeColor = "#ca8a04";
                    }

                    return (
                      <g key={idx}>
                        <circle
                          cx={loc.x}
                          cy={loc.y}
                          r="15"
                          fill={color}
                          stroke={strokeColor}
                          strokeWidth="3"
                        />
                        <text
                          x={loc.x}
                          y={loc.y - 25}
                          fill="#1f2937"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {loc.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw path distances */}
                  {shortestPath && shortestPath.length > 1 && (
                    <>
                      {shortestPath.map((loc, idx) => {
                        if (idx < shortestPath.length - 1) {
                          const from = getCoords(loc);
                          const to = getCoords(shortestPath[idx + 1]);
                          const dist = graph[loc][shortestPath[idx + 1]];
                          return (
                            <text
                              key={`dist-${idx}`}
                              x={(from.x + to.x) / 2}
                              y={(from.y + to.y) / 2}
                              fill="#dc2626"
                              fontSize="12"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {dist}m
                            </text>
                          );
                        }
                        return null;
                      })}
                    </>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-card">
          <p>🎓 <strong>Algoritma:</strong> Dijkstra (Greedy + Dynamic Programming) | <strong>Kompleksitas:</strong> O((V+E) log V)</p>
        </div>
      </div>
    </div>
  );
}

export default App;