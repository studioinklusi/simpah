// SIMPAH - GIS Dashboard
import { icons } from '../../components/icons.js';
import { getCurrentUser } from '../../utils/helpers.js';
import { getAllLocations, getAllWasteRecords } from '../../db/store.js';
import { renderDashboardLayout } from './layout.js';
import { LOCATION_TYPES } from '../../utils/sipsn.js';

export async function renderGIS() {
  const user = getCurrentUser();
  if (!user) { window.location.hash = '#/login'; return; }

  const locations = await getAllLocations();
  const records = await getAllWasteRecords();

  renderDashboardLayout('Peta GIS', `
    <div class="page-enter">
      <div class="section-header">
        <div>
          <h2 class="section-title">Peta Monitoring</h2>
          <p class="section-subtitle">Visualisasi lokasi pengelolaan sampah Kabupaten Banjarnegara</p>
        </div>
      </div>
      <div class="gis-container">
        <div id="gisMap" class="gis-map"></div>
        <div class="gis-legend" id="gisLegend">
          <h4>Legenda</h4>
          ${LOCATION_TYPES.map(lt => `
            <div class="gis-legend-item">
              <span class="gis-legend-dot" style="background:${lt.color}"></span>
              <span>${lt.icon} ${lt.label}</span>
            </div>
          `).join('')}
          <div class="gis-legend-item" style="margin-top:var(--space-2);padding-top:var(--space-2);border-top:1px solid var(--border-color)">
            <span class="gis-legend-dot" style="background:linear-gradient(135deg,#fbbf24,#ef4444);"></span>
            <span>Heatmap Volume</span>
          </div>
        </div>
        <div class="gis-filter-panel" id="gisFilterPanel" style="display:none">
          <h4 style="font-weight:700;margin-bottom:var(--space-4)">Filter</h4>
          <div class="form-group">
            <label class="form-label">Jenis Lokasi</label>
            ${LOCATION_TYPES.map(lt => `
              <label style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);font-size:var(--font-sm);cursor:pointer">
                <input type="checkbox" checked data-loc-type="${lt.id}" class="loc-filter" /> ${lt.label}
              </label>
            `).join('')}
          </div>
          <div class="form-group">
            <label class="form-label">Tampilkan Heatmap</label>
            <label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--font-sm);cursor:pointer">
              <input type="checkbox" checked id="heatmapToggle" /> Aktifkan
            </label>
          </div>
        </div>
        <div class="gis-controls">
          <button class="btn btn-secondary btn-sm" id="filterToggleBtn" style="box-shadow:var(--shadow-lg)">
            ${icons.filter} Filter
          </button>
        </div>
      </div>
    </div>
  `, 'gis');

  // Init map after DOM is ready
  setTimeout(() => initMap(locations, records), 100);

  return () => {
    // cleanup map on page leave
    if (window._simpahMap) {
      window._simpahMap.remove();
      window._simpahMap = null;
    }
  };
}

async function initMap(locations, records) {
  const L = await import('leaflet');
  await import('leaflet.heat');

  // Remove old map if exists
  if (window._simpahMap) {
    window._simpahMap.remove();
    window._simpahMap = null;
  }

  const map = L.map('gisMap', {
    center: [-7.3953, 109.6944],
    zoom: 12,
    zoomControl: true
  });
  window._simpahMap = map;

  // Tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  // Custom marker icons
  const markerColors = {
    tps: '#f59e0b',
    tps3r: '#10b981',
    bank_sampah: '#3b82f6',
    pengepul: '#8b5cf6',
    tpa: '#ef4444'
  };

  const markerIcons = {};
  Object.entries(markerColors).forEach(([type, color]) => {
    markerIcons[type] = L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold">${LOCATION_TYPES.find(l=>l.id===type)?.label?.charAt(0)||'T'}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  });

  // Add location markers
  const markerLayers = {};
  locations.forEach(loc => {
    const icon = markerIcons[loc.type] || markerIcons.tps;
    const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

    // Calculate stats for this location
    const locRecords = records.filter(r => r.location_id === loc.id);
    const totalKg = locRecords.reduce((s, r) => s + (r.weight_kg || 0), 0);

    marker.bindPopup(`
      <div style="min-width:200px;font-family:Inter,sans-serif">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:4px">${loc.name}</h3>
        <p style="font-size:11px;color:#6b7280;margin-bottom:8px">${loc.address || loc.wilayah}</p>
        <div style="display:flex;gap:12px;font-size:12px">
          <div><strong>${locRecords.length}</strong><br><span style="color:#6b7280">Record</span></div>
          <div><strong>${(totalKg/1000).toFixed(1)} ton</strong><br><span style="color:#6b7280">Total</span></div>
        </div>
        <p style="font-size:11px;color:#6b7280;margin-top:6px">Tipe: ${loc.type.toUpperCase()}</p>
      </div>
    `);

    if (!markerLayers[loc.type]) markerLayers[loc.type] = [];
    markerLayers[loc.type].push(marker);
  });

  // Add heatmap
  const heatData = records
    .filter(r => r.lat && r.lng)
    .map(r => [r.lat, r.lng, (r.weight_kg || 50) / 100]);

  let heatLayer = null;
  if (heatData.length > 0) {
    heatLayer = L.heatLayer(heatData, {
      radius: 30,
      blur: 20,
      maxZoom: 15,
      gradient: { 0.2: '#fde68a', 0.5: '#fbbf24', 0.8: '#f59e0b', 1.0: '#ef4444' }
    }).addTo(map);
  }

  // Filter panel toggle
  const filterBtn = document.getElementById('filterToggleBtn');
  const filterPanel = document.getElementById('gisFilterPanel');
  filterBtn?.addEventListener('click', () => {
    filterPanel.style.display = filterPanel.style.display === 'none' ? 'block' : 'none';
  });

  // Location type filters
  document.querySelectorAll('.loc-filter').forEach(cb => {
    cb.addEventListener('change', () => {
      const type = cb.dataset.locType;
      const markers = markerLayers[type] || [];
      markers.forEach(m => {
        if (cb.checked) m.addTo(map);
        else map.removeLayer(m);
      });
    });
  });

  // Heatmap toggle
  document.getElementById('heatmapToggle')?.addEventListener('change', (e) => {
    if (heatLayer) {
      if (e.target.checked) heatLayer.addTo(map);
      else map.removeLayer(heatLayer);
    }
  });

  // Fit bounds
  if (locations.length > 0) {
    const coords = locations.map(l => [l.lat, l.lng]);
    map.fitBounds(L.latLngBounds(coords).pad(0.1));
  }
}
