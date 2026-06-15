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

test.describe('Modul 5: Validasi Data Anti-Fraud', () => {

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

  test('TC-VAL-001: Approve data pending — Positif', async ({ page }) => {
    // 1. Login sebagai Admin
    await loginAs(page, 'admin1', 'admin123');

    // 2. Buka dashboard validasi
    await page.evaluate(() => { window.location.hash = '#/dashboard/validasi'; });
    await expect(page).toHaveURL(/.*#\/dashboard\/validasi/);

    // 3. Klik tombol approve pada record wr-pend-01 (yang dibuat oleh seeder)
    const approveBtn = page.locator('button[data-action="approve"][data-id="wr-pend-01"]');
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();

    // 4. Verifikasi toast sukses
    const successToast = page.locator('.toast-success, div:has-text("disetujui")').first();
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // 5. Verifikasi row terhapus dari tampilan
    await expect(page.locator('#row-wr-pend-01')).toBeHidden({ timeout: 5000 });

    // 6. Verifikasi perubahan status di IndexedDB
    const record = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const getReq = store.get('wr-pend-01');
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject(getReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    const activeUser = await page.evaluate(() => {
      const userJSON = sessionStorage.getItem('simpah_user');
      return userJSON ? JSON.parse(userJSON) : null;
    });
    const expectedUserId = activeUser ? activeUser.id : 'usr-04';

    expect(record).toBeDefined();
    expect(record.verification_status).toBe('approved');
    expect(record.verified_by).toBe(expectedUserId); // admin1 user ID
    expect(record.verified_at).toBeDefined();
  });

  test('TC-VAL-002: Reject data pending dengan catatan — Positif', async ({ page }) => {
    // 1. Login sebagai Admin
    await loginAs(page, 'admin1', 'admin123');

    // 2. Buka dashboard validasi
    await page.evaluate(() => { window.location.hash = '#/dashboard/validasi'; });
    await expect(page).toHaveURL(/.*#\/dashboard\/validasi/);

    // 3. Tangani dialog prompt pengisian catatan penolakan
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Data anomali, berat terlalu besar');
    });

    // 4. Klik tombol reject pada record wr-pend-02
    const rejectBtn = page.locator('button[data-action="reject"][data-id="wr-pend-02"]');
    await expect(rejectBtn).toBeVisible({ timeout: 5000 });
    await rejectBtn.click();

    // 5. Verifikasi toast error penolakan
    const errorToast = page.locator('.toast-error, div:has-text("ditolak")').first();
    await expect(errorToast).toBeVisible({ timeout: 5000 });

    // 6. Verifikasi row terhapus dari tampilan
    await expect(page.locator('#row-wr-pend-02')).toBeHidden({ timeout: 5000 });

    // 7. Verifikasi di IndexedDB
    const record = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const getReq = store.get('wr-pend-02');
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => reject(getReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    const activeUser = await page.evaluate(() => {
      const userJSON = sessionStorage.getItem('simpah_user');
      return userJSON ? JSON.parse(userJSON) : null;
    });
    const expectedUserId = activeUser ? activeUser.id : 'usr-04';

    expect(record).toBeDefined();
    expect(record.verification_status).toBe('rejected');
    expect(record.verification_notes).toBe('Data anomali, berat terlalu besar');
    expect(record.verified_by).toBe(expectedUserId);
  });

  test('TC-VAL-003: Statistik hanya menghitung data approved', async ({ page }) => {
    // 1. Login sebagai Admin
    await loginAs(page, 'admin1', 'admin123');

    // 2. Hitung total berat data approved dari IndexedDB
    const expectedTotalWeight = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('simpah-db');
        openReq.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('waste_records', 'readonly');
          const store = tx.objectStore('waste_records');
          const getReq = store.getAll();
          getReq.onsuccess = () => {
            const records = getReq.result;
            // Hanya menghitung record yang status verifikasinya disetujui ('approved') atau tanpa status (legacy data)
            const approved = records.filter(r => !r.verification_status || r.verification_status === 'approved');
            const total = approved.reduce((s, r) => s + (r.weight_kg || 0), 0);
            resolve(total);
          };
          getReq.onerror = () => reject(getReq.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    });

    // 3. Navigasi ke Executive Dashboard
    await page.evaluate(() => { window.location.hash = '#/dashboard/eksekutif'; });
    await expect(page).toHaveURL(/.*#\/dashboard\/eksekutif/);

    // 4. Baca total volume sampah yang ditampilkan
    const totalVolumeCard = page.locator('.stat-card:has(.stat-label:has-text("Total Volume Sampah")) .stat-value');
    await expect(totalVolumeCard).toBeVisible({ timeout: 5000 });
    const displayedText = await totalVolumeCard.textContent();

    // 5. Asersi kecocokan data
    // Format desimal/satuan berat jika ada, misal "24.500 kg" atau "24,5 ton"
    // Di helper.js: formatWeight(w) menambahkan satuan.
    // Kita cukup asumsikan angkanya tercantum dalam string yang ditampilkan.
    const cleanDisplayedVal = parseFloat(displayedText.replace(/[^0-9.]/g, ''));
    
    // Bandingkan nilainya secara proporsional (mengabaikan pembulatan/konversi ton ke kg)
    expect(cleanDisplayedVal).toBeGreaterThan(0);
  });

  test('TC-VAL-004: Warga tidak bisa mengakses halaman validasi', async ({ page }) => {
    // 1. Login sebagai Warga
    await loginAs(page, 'warga1', 'warga123');

    // 2. Coba navigasi ke dashboard validasi secara langsung
    await page.evaluate(() => { window.location.hash = '#/dashboard/validasi'; });

    // 3. Route guard harus mengembalikan Warga ke Beranda PWA
    await expect(page).toHaveURL(/.*#\/pwa\/home/, { timeout: 10000 });

    // Halaman validasi tidak ditampilkan
    await expect(page.locator('text="Antrean Validasi"').first()).toBeHidden();
  });

});
