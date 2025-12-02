import React, { useState, useRef, useEffect } from 'react';
import { Navigation, MapPin, Route, Info } from 'lucide-react';

const locations = {
  'Gerbang': { x: 80, y: 80, id: 'gb' },
  'Pos Satpam': { x: 200, y: 120, id: 'ps' },
  'Gedung Utama': { x: 350, y: 80, id: 'gu' },
  'Fakultas Pertanian': { x: 550, y: 120, id: 'fp' },
  'Fakultas Komunikasi': { x: 120, y: 280, id: 'fk' },
  'Fakultas Ekonomi': { x: 280, y: 320, id: 'fe' },
  'Masjid': { x: 450, y: 280, id: 'mj' },
  'Kantin': { x: 600, y: 220, id: 'kt' },
  'Parkir': { x: 80, y: 450, id: 'pk' },
  'Fakultas Pendidikan': { x: 300, y: 480, id: 'fpik' },
  'Rektorat': { x: 520, y: 450, id: 'rk' }
};

const graph = {
  'gb': { 'ps': 150, 'gu': 200 },
  'ps': { 'gb': 150, 'fk': 180, 'gu': 160 },
  'gu': { 'gb': 200, 'ps': 160, 'fp': 220, 'mj': 200 },
  'fp': { 'gu': 220, 'kt': 120, 'mj': 180 },
  'fk': { 'ps': 180, 'fe': 170, 'pk': 180 },
  'fe': { 'fk': 170, 'mj': 180, 'fpik': 170 },
  'mj': { 'gu': 200, 'fp': 180, 'fe': 180, 'kt': 160, 'rk': 190, 'fpik': 210 },
  'kt': { 'fp': 120, 'mj': 160, 'rk': 250 },
  'pk': { 'fk': 180, 'fpik': 240 },
  'fpik': { 'fe': 170, 'mj': 210, 'pk': 240, 'rk': 230 },
  'rk': { 'mj': 190, 'kt': 250, 'fpik': 230 }
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
    if (!start || !end) { alert('Pilih lokasi awal dan tujuan!'); return; }
    if (start === end) { alert('Lokasi awal dan tujuan tidak boleh sama!'); return; }
    const { path, distance } = dijkstra(graph, start, end);
    setResult({ path, distance });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / 700;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw semua edges dengan label jarak
    const drawnEdges = new Set();
    for (let from in graph) {
      const fromLoc = Object.values(locations).find(l => l.id === from);
      for (let to in graph[from]) {
        const edgeKey = [from, to].sort().join('-');
        if (drawnEdges.has(edgeKey)) continue;
        drawnEdges.add(edgeKey);
        const toLoc = Object.values(locations).find(l => l.id === to);
        
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(fromLoc.x * scale, fromLoc.y * scale);
        ctx.lineTo(toLoc.x * scale, toLoc.y * scale);
        ctx.stroke();
        
        const midX = (fromLoc.x + toLoc.x) / 2 * scale;
        const midY = (fromLoc.y + toLoc.y) / 2 * scale;
        const dist = graph[from][to];
        
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(midX - 18 * scale, midY - 9 * scale, 36 * scale, 18 * scale);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(midX - 18 * scale, midY - 9 * scale, 36 * scale, 18 * scale);
        ctx.fillStyle = '#64748b';
        ctx.font = `${9 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${dist}m`, midX, midY);
      }
    }

    // Draw rute terpilih
    if (result && result.path.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4 * scale;
      ctx.setLineDash([10 * scale, 5 * scale]);
      for (let i = 0; i < result.path.length - 1; i++) {
        const fromId = result.path[i];
        const toId = result.path[i + 1];
        const fromLoc = Object.values(locations).find(l => l.id === fromId);
        const toLoc = Object.values(locations).find(l => l.id === toId);
        
        ctx.beginPath();
        ctx.moveTo(fromLoc.x * scale, fromLoc.y * scale);
        ctx.lineTo(toLoc.x * scale, toLoc.y * scale);
        ctx.stroke();
        
        const midX = (fromLoc.x + toLoc.x) / 2 * scale;
        const midY = (fromLoc.y + toLoc.y) / 2 * scale;
        const dist = graph[fromId][toId];
        
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 22 * scale, midY - 11 * scale, 44 * scale, 22 * scale);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(midX - 22 * scale, midY - 11 * scale, 44 * scale, 22 * scale);
        ctx.fillStyle = '#1e40af';
        ctx.font = `bold ${11 * scale}px sans-serif`;
        ctx.fillText(`${dist}m`, midX, midY);
        ctx.setLineDash([10 * scale, 5 * scale]);
      }
      ctx.setLineDash([]);
    }

    // Draw nodes
    Object.entries(locations).forEach(([name, loc]) => {
      const isStart = loc.id === start;
      const isEnd = loc.id === end;
      const isInPath = result?.path.includes(loc.id);
      
      ctx.beginPath();
      ctx.arc(loc.x * scale, loc.y * scale, 10 * scale, 0, Math.PI * 2);
      if (isStart) ctx.fillStyle = '#10b981';
      else if (isEnd) ctx.fillStyle = '#ef4444';
      else if (isInPath) ctx.fillStyle = '#3b82f6';
      else ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * scale;
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${11 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(name, loc.x * scale, (loc.y - 18) * scale);
    });
  }, [start, end, result]);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.iconBox}><Navigation style={styles.icon} /></div>
            <div>
              <h1 style={styles.title}>Smart Campus Navigator</h1>
              <p style={styles.subtitle}>Pencarian Rute Terpendek dengan Algoritma Dijkstra</p>
            </div>
          </div>
        </div>
        <div style={styles.grid}>
          <div style={styles.sidebar}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><Route style={styles.smallIcon} />Pencarian Rute</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>Lokasi Awal</label>
                <select value={start} onChange={(e) => setStart(e.target.value)} style={styles.select}>
                  <option value="">Pilih lokasi awal...</option>
                  {Object.entries(locations).map(([name, loc]) => (
                    <option key={loc.id} value={loc.id}>{name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Lokasi Tujuan</label>
                <select value={end} onChange={(e) => setEnd(e.target.value)} style={styles.select}>
                  <option value="">Pilih lokasi tujuan...</option>
                  {Object.entries(locations).map(([name, loc]) => (
                    <option key={loc.id} value={loc.id}>{name}</option>
                  ))}
                </select>
              </div>
              <button onClick={findRoute} style={styles.button}>
                <Navigation style={styles.smallIcon} />Cari Rute Terpendek
              </button>
            </div>
            {result && result.distance !== Infinity && (
              <div style={styles.resultCard}>
                <h3 style={styles.resultTitle}><Info style={styles.smallIcon} />Hasil Pencarian</h3>
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
                        <div style={styles.card}>
              <h3 style={styles.cardTitle}>Keterangan</h3>
              <div style={styles.legendList}>
                <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#10b981'}}></div><span>Lokasi Awal</span></div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#ef4444'}}></div><span>Lokasi Tujuan</span></div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#3b82f6'}}></div><span>Jalur Dilalui</span></div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, backgroundColor: '#6366f1'}}></div><span>Lokasi Lain</span></div>
              </div>
            </div>
          </div>
          <div style={styles.mapSection}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><MapPin style={styles.smallIcon} />Peta Kampus</h2>
              <div style={styles.canvasWrapper}>
                <canvas ref={canvasRef} width={700} height={600} style={styles.canvas} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 50%, #f3e8ff 100%)', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  wrapper: { maxWidth: '1400px', margin: '0 auto' },
  header: { background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' },
  headerContent: { display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { background: '#4f46e5', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  icon: { width: '32px', height: '32px', color: 'white' },
  title: { fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0' },
  subtitle: { fontSize: '16px', color: '#6b7280', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '24px' },
  cardTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  smallIcon: { width: '20px', height: '20px' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  select: { width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', cursor: 'pointer' },
  button: { width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', fontWeight: '600', padding: '14px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' },
  resultCard: { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '24px', color: 'white' },
  resultTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  distanceBox: { background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' },
  distanceLabel: { fontSize: '13px', opacity: 0.9, margin: '0 0 4px 0' },
  distance: { fontSize: '36px', fontWeight: 'bold', margin: 0 },
  pathBox: { background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px' },
  pathLabel: { fontSize: '13px', opacity: 0.9, marginBottom: '12px' },
  pathList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pathItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  pathIcon: { width: '16px', height: '16px' },
  pathText: { fontWeight: '600' },
  legendList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  legendDot: { width: '16px', height: '16px', borderRadius: '50%' },
  mapSection: { minHeight: '600px' },
  canvasWrapper: { background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)', borderRadius: '12px', padding: '16px', border: '2px solid #e5e7eb' },
  canvas: { width: '100%', height: 'auto', borderRadius: '8px' }
};
