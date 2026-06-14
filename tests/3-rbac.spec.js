import { test, expect } from '@playwright/test';

test.describe('Modul 3: RBAC & Route Guard', () => {

  test('TC-RBAC-005: Akses halaman tanpa login - Route Guard', async ({ page }) => {
    // Navigasi langsung ke halaman internal PWA
    await page.goto('/#/pwa/home');
    
    // Aplikasi seharusnya mendeteksi tidak ada sesi dan me-redirect ke login
    await expect(page).toHaveURL(/.*#\/login/, { timeout: 5000 });
  });

  test('TC-RBAC-001: Warga TIDAK bisa akses dashboard eksekutif', async ({ page }) => {
    // 1. Login sebagai Warga (bisa pakai tombol demo atau manual)
    await page.goto('/#/login');
    
    // Klik dropdown / tombol Warga, atau isi manual
    await page.fill('#loginUsername', 'warga1@simpah.dev');
    await page.fill('#loginPassword', 'warga123');
    await page.click('button:has-text("Masuk Sekarang")');

    // Tunggu sampai masuk ke home PWA
    await expect(page).toHaveURL(/.*#\/pwa\/home/, { timeout: 10000 });

    // 2. Coba navigasi manual ke halaman eksekutif
    await page.goto('/#/dashboard/eksekutif');

    // 3. Sistem harusnya menolak dan me-redirect kembali ke halaman default (home)
    await expect(page).toHaveURL(/.*#\/pwa\/home/, { timeout: 5000 });
    
    // Pastikan halaman dashboard eksekutif tidak ditampilkan
    await expect(page.locator('text="Dashboard Eksekutif"').first()).toBeHidden();
  });

});
