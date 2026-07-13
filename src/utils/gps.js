// SIMPAH - GPS Utilities
export function getCurrentPosition(highAccuracy = true) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser ini'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let message = 'Gagal mendapatkan lokasi';
        switch (error.code) {
          case 1: message = 'Akses lokasi ditolak. Harap izinkan akses GPS.'; break;
          case 2: message = 'Posisi tidak tersedia'; break;
          case 3: message = 'Waktu permintaan lokasi habis'; break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  });
}

export function initGPSIndicator(elementId, onLocationFound = null) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const textEl = el.querySelector('span:last-child') || el;
  let currentLat = null;
  let currentLng = null;

  const handleManualLocation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    showMapModal(currentLat, currentLng, (pos) => {
      currentLat = pos.latitude;
      currentLng = pos.longitude;
      el.className = 'gps-indicator active';
      textEl.innerHTML = `GPS: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)} <a href="#" class="gps-manual-btn" style="color:inherit; text-decoration:underline; font-weight:bold; margin-left:8px;">Ubah</a>`;
      
      const changeBtn = el.querySelector('.gps-manual-btn');
      if (changeBtn) changeBtn.addEventListener('click', handleManualLocation);
      
      if (onLocationFound) onLocationFound(pos);
    });
  };

  const startDetection = () => {
    el.className = 'gps-indicator pending';
    textEl.innerHTML = `Mendeteksi lokasi GPS... <a href="#" class="gps-manual-btn" style="color:inherit; text-decoration:underline; font-weight:bold; margin-left:8px;">Pilih Manual</a>`;
    
    const manualBtn = el.querySelector('.gps-manual-btn');
    if (manualBtn) manualBtn.addEventListener('click', handleManualLocation);

    getCurrentPosition(false).then(pos => {
      currentLat = pos.latitude;
      currentLng = pos.longitude;
      el.className = 'gps-indicator active';
      textEl.innerHTML = `GPS: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)} <a href="#" class="gps-manual-btn" style="color:inherit; text-decoration:underline; font-weight:bold; margin-left:8px;">Ubah</a>`;
      
      const changeBtn = el.querySelector('.gps-manual-btn');
      if (changeBtn) changeBtn.addEventListener('click', handleManualLocation);
      
      if (onLocationFound) onLocationFound(pos);
    }).catch(err => {
      el.className = 'gps-indicator error';
      textEl.innerHTML = `Gagal: ${err.message}. 
        <a href="#" class="gps-retry-btn" style="color:inherit; text-decoration:underline; font-weight:bold; margin-left:8px;">Coba Lagi</a> atau 
        <a href="#" class="gps-manual-btn" style="color:inherit; text-decoration:underline; font-weight:bold; margin-left:4px;">Pilih Manual</a>`;
      
      const retryBtn = el.querySelector('.gps-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startDetection();
        });
      }
      
      const manualBtn = el.querySelector('.gps-manual-btn');
      if (manualBtn) manualBtn.addEventListener('click', handleManualLocation);
    });
  };

  startDetection();
}

export function showMapModal(initialLat, initialLng, onSave) {
  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'map-modal-overlay';
  modal.innerHTML = `
    <div class="map-modal-content">
      <div class="map-modal-header">
        <h3>Pilih Lokasi</h3>
        <button class="map-modal-close">&times;</button>
      </div>
      <div class="map-modal-tabs" style="display:flex; border-bottom: 1px solid var(--border-color);">
        <button class="map-modal-tab-btn active" data-tab="map" style="flex:1; padding:12px; border:none; background:transparent; font-weight:600; cursor:pointer; color:var(--primary-600); border-bottom:2px solid var(--primary-600);">Peta (Map Pin)</button>
        <button class="map-modal-tab-btn" data-tab="manual" style="flex:1; padding:12px; border:none; background:transparent; font-weight:600; cursor:pointer; color:var(--text-secondary);">Koordinat Manual</button>
      </div>
      <div class="map-modal-body">
        <div class="map-tab-content" id="map-tab-content">
          <div id="map-modal-container" style="height: 280px; width: 100%; border-radius: 8px; background:var(--bg-secondary);"></div>
          <p class="map-modal-hint" style="margin-top:8px;">Geser penanda (marker) ke lokasi yang tepat</p>
        </div>
        <div class="map-tab-content" id="manual-tab-content" style="display:none; padding: 20px 10px;">
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label" style="display:block; margin-bottom:6px; font-weight:600;">Latitude</label>
            <input type="number" step="any" id="manual-lat" class="form-input" placeholder="Contoh: -7.399707" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-secondary); color:var(--text-primary);" />
          </div>
          <div class="form-group">
            <label class="form-label" style="display:block; margin-bottom:6px; font-weight:600;">Longitude</label>
            <input type="number" step="any" id="manual-lng" class="form-input" placeholder="Contoh: 109.684756" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-secondary); color:var(--text-primary);" />
          </div>
        </div>
      </div>
      <div class="map-modal-footer">
        <button class="btn btn-secondary map-modal-cancel-btn">Batal</button>
        <button class="btn btn-primary map-modal-save-btn">Simpan Lokasi</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.remove();
  };
  modal.querySelector('.map-modal-close').onclick = close;
  modal.querySelector('.map-modal-cancel-btn').onclick = close;

  const tabBtns = modal.querySelectorAll('.map-modal-tab-btn');
  const tabContents = {
    map: modal.querySelector('#map-tab-content'),
    manual: modal.querySelector('#manual-tab-content')
  };
  
  let activeTab = 'map';
  
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.style.color = 'var(--text-secondary)';
        b.style.borderBottom = 'none';
      });
      btn.classList.add('active');
      btn.style.color = 'var(--primary-600)';
      btn.style.borderBottom = '2px solid var(--primary-600)';
      
      activeTab = btn.dataset.tab;
      if (activeTab === 'map') {
        tabContents.map.style.display = 'block';
        tabContents.manual.style.display = 'none';
      } else {
        tabContents.map.style.display = 'none';
        tabContents.manual.style.display = 'block';
      }
    };
  });

  const lat = initialLat || -7.399707;
  const lng = initialLng || 109.684756;
  modal.querySelector('#manual-lat').value = initialLat ? lat.toFixed(6) : '';
  modal.querySelector('#manual-lng').value = initialLng ? lng.toFixed(6) : '';

  import('leaflet').then(LModule => {
    const L = LModule.default || LModule;
    const map = L.map('map-modal-container').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      modal.querySelector('#manual-lat').value = pos.lat.toFixed(6);
      modal.querySelector('#manual-lng').value = pos.lng.toFixed(6);
    });
    
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    modal.querySelector('.map-modal-save-btn').onclick = () => {
      if (activeTab === 'map') {
        const pos = marker.getLatLng();
        onSave({
          latitude: pos.lat,
          longitude: pos.lng,
          accuracy: null,
          timestamp: Date.now()
        });
      } else {
        const latInput = parseFloat(modal.querySelector('#manual-lat').value);
        const lngInput = parseFloat(modal.querySelector('#manual-lng').value);
        if (isNaN(latInput) || isNaN(lngInput)) {
          alert('Harap masukkan koordinat latitude dan longitude yang valid.');
          return;
        }
        onSave({
          latitude: latInput,
          longitude: lngInput,
          accuracy: null,
          timestamp: Date.now()
        });
      }
      close();
    };
  }).catch(err => {
    console.error('Failed to load Leaflet:', err);
    alert('Gagal memuat modul peta. Pastikan Anda terhubung ke internet.');
    close();
  });
}



export function watchPosition(callback) {
  if (!navigator.geolocation) return null;
  return navigator.geolocation.watchPosition(
    (pos) => callback({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    }),
    () => {},
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

export function clearWatch(watchId) {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

export function formatCoordinates(lat, lng) {
  if (!lat || !lng) return '-';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }
