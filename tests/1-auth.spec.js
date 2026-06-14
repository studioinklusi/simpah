import { test, expect } from '@playwright/test';

test.describe('Modul 1: Autentikasi (Login)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigasi ke halaman login
    await page.goto('/#/login');
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('TC-AUTH-003: Login kredensial salah - Negatif', async ({ page }) => {
    await page.fill('input[type="text"], input[type="email"]', 'admin1');
    await page.fill('input[type="password"]', 'salahpassword');
    await page.click('button:has-text("Masuk Sekarang")');

    // Menunggu munculnya toast/banner error
    const errorBanner = page.locator('.error-banner, .toast-error, div:has-text("salah")').first();
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    
    // Pastikan user masih di halaman login
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('TC-AUTH-005: Form Login - Manual Fill', async ({ page }) => {
    // Isi field secara manual
    const usernameInput = page.locator('#loginUsername');
    const passwordInput = page.locator('#loginPassword');
    
    await usernameInput.fill('eksekutif1@simpah.dev');
    await passwordInput.fill('eksekutif123');
    
    await expect(usernameInput).toHaveValue('eksekutif1@simpah.dev');
    await expect(passwordInput).toHaveValue('eksekutif123');
  });

  test('TC-AUTH-001 & 006: Login Sukses (Eksekutif)', async ({ page }) => {
    // Menggunakan kredensial manual
    await page.locator('#loginUsername').fill('eksekutif1@simpah.dev');
    await page.locator('#loginPassword').fill('eksekutif123');
    await page.click('button:has-text("Masuk Sekarang")');
    
    // Tunggu redirect ke dashboard eksekutif
    await expect(page).toHaveURL(/.*#\/dashboard\/eksekutif/, { timeout: 10000 });
    
    // Cek ada tulisan Dashboard atau sejenisnya
    await expect(page.locator('text="Dashboard"').first()).toBeVisible();
  });

  test('TC-AUTH-008: Logout', async ({ page }) => {
    // Login dulu sebagai Admin
    await page.locator('#loginUsername').fill('admin1@simpah.dev');
    await page.locator('#loginPassword').fill('admin123');
    await page.click('button:has-text("Masuk Sekarang")');
    await expect(page).toHaveURL(/.*#\/dashboard\/gis/, { timeout: 10000 });

    // Cari tombol/menu logout
    await page.locator('#dashLogoutBtn').click();
    
    // Pastikan ada dialog konfirmasi jika ada, klik ya
    const confirmBtn = page.locator('#logoutConfirmBtn');
    await confirmBtn.click();

    // Pastikan ter-redirect ke login kembali
    await expect(page).toHaveURL(/.*#\/login/, { timeout: 5000 });
  });

});
