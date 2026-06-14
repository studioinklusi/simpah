import { test, expect } from '@playwright/test';

// Helper function to login
async function loginAs(page, emailOrUsername, password) {
  await page.goto('/#/login');
  await page.fill('#loginUsername', emailOrUsername);
  await page.fill('#loginPassword', password);
  await page.click('button:has-text("Masuk Sekarang")');
  await expect(page).toHaveURL(/.*#\/pwa\/home/, { timeout: 10000 });
}

test.describe('Modul 4: PWA Input Sampah (Lapangan)', () => {

  test.beforeEach(async ({ page }) => {
    // Print browser console logs and uncaught exceptions to terminal
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    // Override navigator.onLine to return false so that database queries fallback to local IndexedDB (which is seeded)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'onLine', {
        get: () => false,
        configurable: true
      });
    });
  });

  test('TC-INPUT-001: Input sampah masuk — Alur normal', async ({ page }) => {
    // 1. Login sebagai Kader
    await loginAs(page, 'kader1', 'kader123');

    // 2. Buka halaman input-sampah
    await page.goto('/#/pwa/input-sampah');
    await expect(page).toHaveURL(/.*#\/pwa\/input-sampah/);

    // 3. Isi formulir
    await page.selectOption('#locationSelect', 'loc-01'); // TPS3R Banjarnegara
    await page.fill('#weightInput', '5.5');
    
    // Matikan mode akumulasi agar hanya tercatat sebagai satu record tunggal
    // Gunakan $eval karena checkbox memiliki style display: none (custom CSS switch)
    await page.$eval('#accumToggle', el => {
      el.checked = false;
      el.dispatchEvent(new Event('change'));
    });
    
    await page.fill('#notesInput', 'Tes input normal campur');

    // 4. Submit formulir secara robust menggunakan form.requestSubmit()
    await page.$eval('#wasteForm', form => form.requestSubmit());

    // 5. Verifikasi sukses redirect
    await expect(page).toHaveURL(/.*#\/pwa\/sampah-masuk/, { timeout: 10000 });

    // 6. Verifikasi penyimpanan di IndexedDB
    const latestRecord = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            const records = getReq.result;
            // Cari data spesifik yang baru saja kita masukkan
            const record = records.find(r => r.type === 'campur' && r.weight_kg === 5.5 && r.notes === 'Tes input normal campur');
            resolve(record);
          };
          getReq.onerror = () => reject(getReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(latestRecord).toBeDefined();
    expect(latestRecord.type).toBe('campur');
    expect(latestRecord.weight_kg).toBe(5.5);
    expect(latestRecord.location_id).toBe('loc-01');
    expect(latestRecord.verification_status).toBe('pending');
  });

  test('TC-INPUT-002: Input sampah dengan tanggal override (akumulasi/batch)', async ({ page }) => {
    await loginAs(page, 'kader1', 'kader123');

    await page.goto('/#/pwa/input-sampah');
    await expect(page).toHaveURL(/.*#\/pwa\/input-sampah/);

    await page.selectOption('#locationSelect', 'loc-01');
    await page.fill('#weightInput', '35');
    
    // Pastikan checkbox akumulasi aktif
    await page.$eval('#accumToggle', el => {
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });

    // Pilih tombol preset 7 hari
    await page.click('button.accum-day-btn[data-days="7"]');

    // Submit via form.requestSubmit()
    await page.$eval('#wasteForm', form => form.requestSubmit());
    await expect(page).toHaveURL(/.*#\/pwa\/sampah-masuk/, { timeout: 10000 });

    // Verifikasi bahwa 7 record terpisah dibuat di IndexedDB
    const recentAccumRecords = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            const records = getReq.result;
            // Ambil record yang bertipe akumulasi dengan total berat 35
            const recent = records.filter(r => r.is_accumulation && r.accumulation_total_kg === 35);
            resolve(recent);
          };
          getReq.onerror = () => reject(getReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(recentAccumRecords.length).toBe(7);
    recentAccumRecords.forEach(r => {
      expect(r.weight_kg).toBe(5); // 35 kg / 7 hari = 5 kg/hari
      expect(r.type).toBe('campur');
      expect(r.accumulation_days).toBe(7);
      expect(r.accumulation_total_kg).toBe(35);
    });
  });

  test('TC-INPUT-003: Input sampah terpilah dengan detail material', async ({ page }) => {
    // Aktor: Operator
    await loginAs(page, 'operator1', 'operator123');

    await page.goto('/#/pwa/input-pilah');
    await expect(page).toHaveURL(/.*#\/pwa\/input-pilah/);

    await page.selectOption('#locationSelect', 'loc-01'); // TPS3R Banjarnegara
    
    // Isi Plastik (PL) = 3kg
    await page.fill('#input-PL', '3');
    // Isi Kertas (KK) = 2kg
    await page.fill('#input-KK', '2');
    // Isi Logam (LG) = 1kg
    await page.fill('#input-LG', '1');
    // Isi Residu = 1.5kg
    await page.fill('#input-residu', '1.5');

    // Matikan mode akumulasi
    await page.$eval('#accumToggle', el => {
      el.checked = false;
      el.dispatchEvent(new Event('change'));
    });

    // Submit via form.requestSubmit()
    await page.$eval('#pilahForm', form => form.requestSubmit());

    await expect(page).toHaveURL(/.*#\/pwa\/sampah-masuk/, { timeout: 10000 });

    // Verifikasi records di IndexedDB
    const result = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (event) => {
          const db = event.target.result;
          const tx = db.transaction(['waste_records', 'sorted_waste'], 'readonly');
          
          const wrStore = tx.objectStore('waste_records');
          const wrReq = wrStore.getAll();
          
          wrReq.onsuccess = () => {
            const records = wrReq.result;
            const latestPilah = records.find(r => r.type === 'pilah' && r.weight_kg === 6);
            const latestResidu = records.find(r => r.type === 'residu' && r.weight_kg === 1.5);
            
            if (!latestPilah) {
              resolve({ error: 'No pilah record found' });
              return;
            }
            
            const swStore = tx.objectStore('sorted_waste');
            const swReq = swStore.getAll();
            
            swReq.onsuccess = () => {
              const sorted = swReq.result.filter(s => s.waste_record_id === latestPilah.id);
              resolve({
                pilah: latestPilah,
                residu: latestResidu,
                sorted
              });
            };
            swReq.onerror = () => reject(swReq.error);
          };
          wrReq.onerror = () => reject(wrReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(result.error).toBeUndefined();
    expect(result.pilah).toBeDefined();
    expect(result.pilah.weight_kg).toBe(6); // Total terpilah = 3 + 2 + 1 = 6 kg
    expect(result.residu).toBeDefined();
    expect(result.residu.weight_kg).toBe(1.5);
    expect(result.sorted.length).toBe(3);

    const categories = result.sorted.map(s => s.category_sipsn);
    expect(categories).toContain('PL');
    expect(categories).toContain('KK');
    expect(categories).toContain('LG');

    const plastikItem = result.sorted.find(s => s.category_sipsn === 'PL');
    expect(plastikItem.weight_kg).toBe(3);
  });

  test('TC-INPUT-004: Input olah sampah (pengolahan mandiri)', async ({ page }) => {
    await loginAs(page, 'kader1', 'kader123');

    await page.goto('/#/pwa/input-olah');
    await expect(page).toHaveURL(/.*#\/pwa\/input-olah/);

    // Pilih metode pengomposan
    await page.click('[data-method="pengomposan"]');

    // Pilih jenis bahan sampah Sisa Makanan (SM)
    await page.click('[data-cat="SM"]');

    // Input berat olahan
    await page.fill('#weightInput', '10');

    // Matikan mode akumulasi
    await page.$eval('#accumToggle', el => {
      el.checked = false;
      el.dispatchEvent(new Event('change'));
    });

    // Submit via form.requestSubmit()
    await page.$eval('#olahForm', form => form.requestSubmit());
    await expect(page).toHaveURL(/.*#\/pwa\/sampah-masuk/, { timeout: 10000 });

    // Verifikasi IndexedDB
    const latestOlah = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const req = store.getAll();
          req.onsuccess = () => {
            const records = req.result;
            const record = records.find(r => r.type === 'olah' && r.weight_kg === 10 && r.treatment_method === 'pengomposan');
            resolve(record);
          };
          req.onerror = () => reject(req.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(latestOlah).toBeDefined();
    expect(latestOlah.weight_kg).toBe(10);
    expect(latestOlah.treatment_method).toBe('pengomposan');
    expect(latestOlah.category_sipsn).toBe('SM');
  });

  test('TC-INPUT-005: Input residu ke TPA', async ({ page }) => {
    // Aktor: Petugas Pengangkut
    await loginAs(page, 'petugas1', 'petugas123');

    await page.goto('/#/pwa/input-residu');
    await expect(page).toHaveURL(/.*#\/pwa\/input-residu/);

    await page.fill('#weightInput', '500');
    await page.selectOption('#locationSelect', 'loc-01');
    await page.selectOption('#destinationSelect', 'tpa');

    // Submit via form.requestSubmit()
    await page.$eval('#residuForm', form => form.requestSubmit());
    await expect(page).toHaveURL(/.*#\/pwa\/home/, { timeout: 10000 }); // Redirection goes to home for residu form

    // Verifikasi IndexedDB
    const latestResidu = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const req = store.getAll();
          req.onsuccess = () => {
            const records = req.result;
            const record = records.find(r => r.type === 'residu' && r.weight_kg === 500);
            resolve(record);
          };
          req.onerror = () => reject(req.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(latestResidu).toBeDefined();
    expect(latestResidu.weight_kg).toBe(500);
    expect(latestResidu.location_id).toBe('loc-01');
    expect(latestResidu.destination).toBe('tpa');
  });

  test('TC-INPUT-006: Input insidental (event khusus)', async ({ page }) => {
    await loginAs(page, 'kader1', 'kader123');

    await page.goto('/#/pwa/insidental');
    await expect(page).toHaveURL(/.*#\/pwa\/insidental/);

    // Pilih jenis kegiatan Kerja Bakti
    await page.click('[data-type="kerja_bakti"]');

    await page.fill('#eventTitle', 'Kerja Bakti RT 05');
    await page.fill('#eventLocation', 'Semampir');
    await page.fill('#eventParticipants', '45');
    await page.fill('#eventDesc', 'Pembersihan saluran air');

    // Submit via form.requestSubmit()
    await page.$eval('#eventForm', form => form.requestSubmit());

    // Verifikasi toast sukses
    const successToast = page.locator('.toast-success, div:has-text("berhasil")').first();
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Verifikasi IndexedDB
    const latestEvent = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('incidental_events', 'readonly');
          const store = tx.objectStore('incidental_events');
          const req = store.getAll();
          req.onsuccess = () => {
            const records = req.result;
            const record = records.find(r => r.type === 'kerja_bakti' && r.title === 'Kerja Bakti RT 05');
            resolve(record);
          };
          req.onerror = () => reject(req.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(latestEvent).toBeDefined();
    expect(latestEvent.type).toBe('kerja_bakti');
    expect(latestEvent.title).toBe('Kerja Bakti RT 05');
    expect(latestEvent.participants).toBe(45);
    expect(latestEvent.location_name).toBe('Semampir');
    expect(latestEvent.description).toBe('Pembersihan saluran air');
  });

  test('TC-INPUT-007: Berat negatif atau nol — Validasi boundary', async ({ page }) => {
    await loginAs(page, 'kader1', 'kader123');

    await page.goto('/#/pwa/input-sampah');
    await expect(page).toHaveURL(/.*#\/pwa\/input-sampah/);

    await page.selectOption('#locationSelect', 'loc-01');

    // Tes nilai negatif
    await page.fill('#weightInput', '-5');
    // Gunakan requestSubmit()
    await page.$eval('#wasteForm', form => form.requestSubmit());

    // Harap tampil toast warning
    const warningToast = page.locator('.toast-warning, div:has-text("valid"), div:has-text("berat")').first();
    await expect(warningToast).toBeVisible({ timeout: 5000 });

    // Tes nilai nol
    await page.fill('#weightInput', '0');
    await page.$eval('#wasteForm', form => form.requestSubmit());
    await expect(warningToast).toBeVisible({ timeout: 5000 });

    // Pastikan tidak ada data tersimpan di IndexedDB dengan berat <= 0
    const invalidRecords = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const req = store.getAll();
          req.onsuccess = () => {
            const records = req.result;
            resolve(records.filter(r => r.weight_kg <= 0));
          };
          req.onerror = () => reject(req.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    expect(invalidRecords.length).toBe(0);
  });

});
