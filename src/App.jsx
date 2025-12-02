import React, { useState, useRef, useEffect } from 'react';
import { Navigation, MapPin, Route, Info } from 'lucide-react';

const locations = {
  'Gerbang': { x: 100, y: 100, id: 'gb' },
  'Pos Satpam': { x: 200, y: 150, id: 'ps' },
  'Gedung Utama': { x: 300, y: 150, id: 'gu' },
  'Fakultas Pertanian': { x: 500, y: 100, id: 'fp' },
  'Fakultas Komunikasi': { x: 200, y: 300, id: 'fk' },
  'Fakultas Ekonomi': { x: 250, y: 350, id: 'fe' },
  'Masjid': { x: 400, y: 350, id: 'mj' },
  'Kantin': { x: 600, y: 300, id: 'kt' },
  'Parkir': { x: 100, y: 450, id: 'pk' },
  'Fakultas Pendidikan': { x: 350, y: 500, id: 'fpik' },
  'Rektorat': { x: 550, y: 480, id: 'rk' }
};

const graph = {
  'gb': { 'ps': 150, 'kt': 250, 'gu': 200 },
  'ps': { 'gb': 150, 'kt': 150, 'fk': 200 },
  'kt': { 'gb': 250, 'ps': 150, 'fp': 250, 'fk': 200, 'mj': 280 },
  'fp': { 'kt': 250, 'gu': 320, 'mj': 280 },
  'fk': { 'ps': 200, 'kt': 200, 'fe': 120, 'pk': 200 },
  'fe': { 'fk': 120, 'mj': 150, 'fpik': 180 },
  'mj': { 'kt': 280, 'fp': 280, 'fe': 150, 'gu': 220, 'fpik': 200 },
  'gu': { 'gb': 500, 'fp': 320, 'mj': 220, 'rk': 220 },
  'pk': { 'fk': 200, 'fpik': 280 },
  'fpik': { 'fe': 180, 'mj': 200, 'pk': 280, 'rk': 250 },
  'rk': { 'gu': 220, 'fpik': 250 }
};

function dijkstra(graph, start, end) {
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  for (let node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  }
  distances[start] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let minDist = Infinity;
    for (let node of unvisited) {
      if (distances[node] < minDist) {
        minDist = distances[node];
        current = node;
      }
    }

    if (current === null || current === end) break;
    unvisited.delete(current);

    for (let neighbor in graph[current]) {
      const distance = distances[current] + graph[current][neighbor];
      if (distance < distances[neighbor]) {
        distances[neighbor] = distance;
        previous[neighbor] = current;
      }
    }
  }

  const path = [];
  let current = end;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  return { path, distance: distances[end] };
}

export default function CampusNavigator() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [result, setResult] = useState(null);
  const canvasRef = useRef(null);

  const getLocationName = (id) => {
    return Object.entries(locations).find(([_, loc]) => loc.id === id)?.[0] || id;
  };

  const findRoute = () => {
    if (!start || !end) {
      alert('Pilih lokasi awal dan tujuan!');
      return;
    }
    if (start === end) {
      alert('Lokasi awal dan tujuan tidak boleh sama!');
      return;
    }

    const { path, distance } = dijkstra(graph, start, end);
    setResult({ path, distance });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const scale = canvas.width / 700;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2 * scale;
    for (let from in graph) {
      const fromLoc = Object.values(locations).find(l => l.id === from);
      for (let to in graph[from]) {
        const toLoc = Object.values(locations).find(l => l.id === to);
        ctx.beginPath();
        ctx.moveTo(fromLoc.x * scale, fromLoc.y * scale);
        ctx.lineTo(toLoc.x * scale, toLoc.y * scale);
        ctx.stroke();
      }
    }

    // Draw route DENGAN LABEL JARAK
    if (result && result.path.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4 * scale;
      ctx.setLineDash([10 * scale, 5 * scale]);
      
      for (let i = 0; i < result.path.length - 1; i++) {
        const fromId = result.path[i];
        const toId = result.path[i + 1];
        const fromLoc = Object.values(locations).find(l => l.id === fromId);
        const toLoc = Object.values(locations).find(l => l.id === toId);
        
        // Gambar garis rute
        ctx.beginPath();
        ctx.moveTo(fromLoc.x * scale, fromLoc.y * scale);
        ctx.lineTo(toLoc.x * scale, toLoc.y * scale);
        ctx.stroke();
        
        // ===== BAGIAN INI YANG DITAMBAHKAN: Label Jarak =====
        const midX = (fromLoc.x + toLoc.x) / 2 * scale;
        const midY = (fromLoc.y + toLoc.y) / 2 * scale;
        const distance = graph[fromId][toId];
        
        // Reset line dash untuk kotak
        ctx.setLineDash([]);
        
        // Background putih untuk label
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 20 * scale, midY - 12 * scale, 40 * scale, 24 * scale);
        
        // Border biru untuk label
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(midX - 20 * scale, midY - 12 * scale, 40 * scale, 24 * scale);
        
        // Teks jarak
        ctx.fillStyle = '#1e40af';
        ctx.font = `bold ${12 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${distance}m`, midX, midY);
        
        // Reset untuk garis berikutnya
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4 * scale;
        ctx.setLineDash([10 * scale, 5 * scale]);
        // ===== AKHIR BAGIAN YANG DITAMBAHKAN =====
      }
      ctx.setLineDash([]);
    }

    // Draw nodes
    Object.entries(locations).forEach(([name, loc]) => {
      const isStart = loc.id === start;
      const isEnd = loc.id === end;
      const isInPath = result?.path.includes(loc.id);
      
      ctx.beginPath();
      ctx.arc(loc.x * scale, loc.y * scale, 8 * scale, 0, Math.PI * 2);
      
      if (isStart) {
        ctx.fillStyle = '#10b981';
      } else if (isEnd) {
        ctx.fillStyle = '#ef4444';
      } else if (isInPath) {
        ctx.fillStyle = '#3b82f6';
      } else {
        ctx.fillStyle = '#6366f1';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(name, loc.x * scale, (loc.y - 15) * scale);
    });

  }, [start, end, result]);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.iconBox}>
              <Navigation style={styles.icon} />
            </div>
            <div>
              <h1 style={styles.title}>Smart Campus Navigator</h1>
              <p style={styles.subtitle}>Pencarian Rute Terpendek dengan Algoritma Dijkstra</p>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          {/* Control Panel */}
          <div style={styles.sidebar}>
            {/* Form */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <Route style={styles.smallIcon} />
                Pencarian Rute
              </h2>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Lokasi Awal</label>
                <select
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Pilih lokasi awal...</option>
                  {Object.entries(locations).map(([name, loc]) => (
                    <option key={loc.id} value={loc.id}>{name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Lokasi Tujuan</label>
                <select
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Pilih lokasi tujuan...</option>
                  {Object.entries(locations).map(([name, loc]) => (
                    <option key={loc.id} value={loc.id}>{name}</option>
                  ))}
                </select>
              </div>

              <button onClick={findRoute} style={styles.button}>
                <Navigation style={styles.smallIcon} />
                Cari Rute Terpendek
              </button>
            </div>

            {/* Result */}
            {result && result.distance !== Infinity && (
              <div style={styles.resultCard}>
                <h3 style={styles.resultTitle}>
                  <Info style={styles.smallIcon} />
                  Hasil Pencarian
                </h3>
                <div style={styles.distanceBox}>
                  <p style={styles.distanceLabel}>Jarak Total</p>
                  <p style={styles.distance}>{result.distance}m</p>
                </div>
                <div style={styles.pathBox}>
                  <p style={styles.pathLabel}>Jalur yang Dilalui</p>
                  <div style={styles.pathList}>
                    {result.path.map((nodeId, idx) => (
                      <div key={idx} style={styles.pathItem}>
                        <MapPin style={styles.pathIcon} />
                        <span style={styles.pathText}>{getLocationName(nodeId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && result.distance === Infinity && (
              <div style={styles.errorCard}>
                <p style={styles.errorText}>
                  ❌ Tidak ada jalur yang menghubungkan kedua lokasi!
                </p>
              </div>
            )}

            {/* Legend */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Legenda</h3>
              <div style={styles.legendList}>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: '#10b981'}}></div>
                  <span style={styles.legendText}>Lokasi Awal</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: '#ef4444'}}></div>
                  <span style={styles.legendText}>Lokasi Tujuan</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: '#3b82f6'}}></div>
                  <span style={styles.legendText}>Jalur Dilalui</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendDot, backgroundColor: '#6366f1'}}></div>
                  <span style={styles.legendText}>Lokasi Lain</span>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div style={styles.mapSection}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <MapPin style={styles.smallIcon} />
                Peta Kampus
              </h2>
              <div style={styles.canvasWrapper}>
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={600}
                  style={styles.canvas}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 50%, #f3e8ff 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  wrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    padding: '24px',
    marginBottom: '24px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBox: {
    background: '#4f46e5',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '32px',
    height: '32px',
    color: 'white',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '24px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    padding: '24px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  smallIcon: {
    width: '20px',
    height: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
  },
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    fontWeight: '600',
    padding: '14px 24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  resultCard: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    padding: '24px',
    color: 'white',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  distanceBox: {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  distanceLabel: {
    fontSize: '13px',
    opacity: 0.9,
    margin: '0 0 4px 0',
  },
  distance: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
  },
  pathBox: {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '16px',
  },
  pathLabel: {
    fontSize: '13px',
    opacity: 0.9,
    marginBottom: '12px',
  },
  pathList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  pathItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pathIcon: {
    width: '16px',
    height: '16px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '50%',
    padding: '4px',
  },
  pathText: {
    fontWeight: '600',
  },
  errorCard: {
    background: '#fee2e2',
    border: '2px solid #fecaca',
    borderRadius: '20px',
    padding: '20px',
  },
  errorText: {
    color: '#991b1b',
    fontWeight: '600',
    margin: 0,
    textAlign: 'center',
  },
  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  legendDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
  },
  legendText: {
    fontSize: '14px',
    color: '#374151',
  },
  mapSection: {
    minHeight: '600px',
  },
  canvasWrapper: {
    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
    borderRadius: '12px',
    padding: '16px',
    border: '2px solid #e5e7eb',
  },
  canvas: {
    width: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
};
