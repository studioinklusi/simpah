import { test, expect } from '@playwright/test';

// Helper function to login
async function loginAs(page, emailOrUsername, password) {
  await page.goto('/#/login');
  await page.fill('#loginUsername', emailOrUsername);
  await page.fill('#loginPassword', password);
  await page.click('button:has-text("Masuk Sekarang")');
  await expect(page).not.toHaveURL(/.*#\/login/, { timeout: 10000 });
  await page.waitForTimeout(600);
}

test.describe('Modul 6: Dashboard Eksekutif & Analitik', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
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

  test('TC-DASH-001: Dashboard menampilkan KPI utama', async ({ page }) => {
    // 1. Login sebagai Eksekutif
    await loginAs(page, 'eksekutif1', 'eksekutif123');

    // 2. Navigasi ke Executive Dashboard
    await page.evaluate(() => { window.location.hash = '#/dashboard/eksekutif'; });
    await expect(page).toHaveURL(/.*#\/dashboard\/eksekutif/);

    // 3. Verifikasi 4 Kartu KPI Utama
    const totalVolumeCard = page.locator('.stat-card:has(.stat-label:has-text("Total Volume Sampah"))');
    await expect(totalVolumeCard).toBeVisible({ timeout: 5000 });
    await expect(totalVolumeCard.locator('.stat-value')).not.toBeEmpty();

    const reductionCard = page.locator('.stat-card:has(.stat-label:has-text("Pengurangan Sampah"))');
    await expect(reductionCard).toBeVisible({ timeout: 5000 });
    await expect(reductionCard.locator('.stat-value')).not.toBeEmpty();

    const residuCard = page.locator('.stat-card:has(.stat-label:has-text("Total Residu"))');
    await expect(residuCard).toBeVisible({ timeout: 5000 });
    await expect(residuCard.locator('.stat-value')).not.toBeEmpty();

    const mouCard = page.locator('.stat-card:has(.stat-label:has-text("MoU Aktif"))');
    await expect(mouCard).toBeVisible({ timeout: 5000 });
    await expect(mouCard.locator('.stat-value')).not.toBeEmpty();

    // 4. Verifikasi Grafik Canvas
    await expect(page.locator('#trendChart')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#compositionChart')).toBeVisible({ timeout: 5000 });
    
    // 5. Verifikasi Kontributor Teratas & Kader Teraktif
    const topLocations = page.locator('#topLocationsBody tr');
    await expect(topLocations.first()).toBeVisible({ timeout: 5000 });

    const topKader = page.locator('#topKaderBody tr');
    await expect(topKader.first()).toBeVisible({ timeout: 5000 });
  });

  test('TC-DASH-002: Recycling rate kalkulasi benar', async ({ page }) => {
    // 1. Login sebagai Eksekutif
    await loginAs(page, 'eksekutif1', 'eksekutif123');

    // 2. Hitung statistik daur ulang secara manual dari IndexedDB
    const expectedRecycleRate = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            const records = getReq.result;
            // Filter record disetujui / legacy
            const valid = records.filter(r => !r.verification_status || r.verification_status === 'approved');
            
            const masuk = valid.filter(r => r.type === 'masuk').reduce((s, r) => s + (r.weight_kg || 0), 0);
            const campur = valid.filter(r => r.type === 'campur').reduce((s, r) => s + (r.weight_kg || 0), 0);
            const pilah = valid.filter(r => r.type === 'pilah').reduce((s, r) => s + (r.weight_kg || 0), 0);
            const olah = valid.filter(r => r.type === 'olah').reduce((s, r) => s + (r.weight_kg || 0), 0);
            
            const totalIncoming = masuk + campur;
            const reductionTotal = pilah + olah;
            const rate = totalIncoming > 0 ? (reductionTotal / totalIncoming * 100) : 0;
            resolve(rate);
          };
          getReq.onerror = () => reject(getReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    // 3. Navigasi ke Executive Dashboard
    await page.evaluate(() => { window.location.hash = '#/dashboard/eksekutif'; });
    await expect(page).toHaveURL(/.*#\/dashboard\/eksekutif/);

    // 4. Baca nilai yang tampil di kartu pengurangan sampah
    const reductionValText = await page.locator('.stat-card:has(.stat-label:has-text("Pengurangan Sampah")) .stat-value').textContent();
    const cleanVal = parseFloat(reductionValText.replace(/[^0-9.]/g, ''));

    // 5. Asersi kecocokan (mengizinkan toleransi pembulatan kecil)
    expect(Math.abs(cleanVal - expectedRecycleRate)).toBeLessThan(1.0);
  });

  test('TC-DASH-003: Dashboard tanpa data — Empty state', async ({ page }) => {
    // 1. Login sebagai Eksekutif
    await loginAs(page, 'eksekutif1', 'eksekutif123');

    // 2. Kosongkan store waste_records di IndexedDB
    await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readwrite');
          const store = tx.objectStore('waste_records');
          const clearReq = store.clear();
          clearReq.onsuccess = () => resolve();
          clearReq.onerror = () => reject(clearReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    // 3. Reload halaman agar mengambil data baru dari IndexedDB yang kosong
    await page.reload();
    await expect(page).toHaveURL(/.*#\/dashboard\/eksekutif/);

    // 4. Verifikasi nilai KPI menunjukkan angka 0 tanpa crash
    const totalVolumeVal = await page.locator('.stat-card:has(.stat-label:has-text("Total Volume Sampah")) .stat-value').textContent();
    const cleanVolume = parseFloat(totalVolumeVal.replace(/[^0-9.]/g, ''));
    expect(cleanVolume).toBe(0);

    const reductionVal = await page.locator('.stat-card:has(.stat-label:has-text("Pengurangan Sampah")) .stat-value').textContent();
    const cleanReduction = parseFloat(reductionVal.replace(/[^0-9.]/g, ''));
    expect(cleanReduction).toBe(0);

    const residuVal = await page.locator('.stat-card:has(.stat-label:has-text("Total Residu")) .stat-value').textContent();
    const cleanResidu = parseFloat(residuVal.replace(/[^0-9.]/g, ''));
    expect(cleanResidu).toBe(0);
  });

  test('TC-DASH-004: Eksekutif tidak bisa mengakses Master Data', async ({ page }) => {
    // 1. Login sebagai Eksekutif
    await loginAs(page, 'eksekutif1', 'eksekutif123');

    // 2. Coba navigasi ke master data secara langsung
    await page.evaluate(() => { window.location.hash = '#/dashboard/masterdata'; });

    // 3. Route guard harus mengalihkan kembali ke landing page eksekutif
    await expect(page).toHaveURL(/.*#\/dashboard\/eksekutif/, { timeout: 10000 });

    // 4. Verifikasi bahwa halaman master data tidak terbuka
    await expect(page.locator('text="Manajemen Data Wilayah & Lokasi"').first()).toBeHidden();
  });

});
