import { test, expect } from '@playwright/test';

test.describe('Modul 2: Registrasi Akun Baru', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigasi ke halaman register
    await page.goto('/#/register');
    // Tunggu sampai halaman ter-load
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Daftar|Registrasi/i }).first()).toBeVisible();
  });

  test('TC-REG-006: Field kosong - Negatif', async ({ page }) => {
    // Langsung klik tombol daftar tanpa mengisi apapun
    await page.click('button:has-text("Daftar")');

    // Menunggu peringatan validasi form HTML5 atau custom error
    // Pada PWA biasanya menampilkan pesan error
    const errorMessage = page.locator('text=/isi|wajib/i').first();
    // Karena ini bisa berupa native HTML5 validation popup yang tidak bisa dicek DOM, 
    // kita cek URL masih di /register (tidak terjadi navigasi)
    await expect(page).toHaveURL(/.*#\/register/);
  });

  test('TC-REG-002: Password tidak cocok - Negatif', async ({ page }) => {
    // Isi field dengan password yang berbeda
    await page.locator('#regFullName').fill('Test User');
    await page.locator('#regUsername').fill('testuser_error');
    await page.locator('#regEmail').fill('testuser_error@simpah.dev');
    
    // Asumsi input password pertama dan kedua memiliki atribut id/placeholder/name yang bisa dibedakan
    // Akan dicari input type password
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('Password123');
    await passwordInputs.nth(1).fill('Berbeda123');
    
    await page.click('button:has-text("Daftar")');

    // Cek error message bahwa password tidak cocok
    const errorBanner = page.locator('text=/cocok|sama/i').first();
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
  });

  // TC-REG-001: Registrasi akun baru berhasil (Di-skip/Dikomeng agar tidak spam Supabase)
  test.skip('TC-REG-001: Registrasi akun baru - Positif', async ({ page }) => {
    // Membuat username dan email random
    const randStr = Math.random().toString(36).substring(7);
    const username = `testuser_${randStr}`;
    const email = `${username}@simpah.dev`;

    await page.locator('#regFullName').fill(`Test User ${randStr}`);
    await page.locator('#regUsername').fill(username);
    await page.locator('#regEmail').fill(email);
    
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('ValidPass123!');
    await passwordInputs.nth(1).fill('ValidPass123!');
    
    await page.click('button:has-text("Daftar")');

    // Cek keberhasilan registrasi
    await expect(page.locator('text=/berhasil/i').first()).toBeVisible({ timeout: 10000 });
    // Biasanya akan memunculkan tombol login atau redirect
  });

  test('TC-REG-007: Validasi input field Kode Undangan', async ({ page }) => {
    // Pastikan field kode undangan ada di form
    const invitationInput = page.locator('#regInvitationCode');
    await expect(invitationInput).toBeVisible();
    await expect(invitationInput).toHaveAttribute('placeholder', /masukkan kode/i);
  });

  test('TC-REG-008: Kode undangan tidak valid - Negatif', async ({ page }) => {
    const invitationInput = page.locator('#regInvitationCode');
    const feedback = page.locator('#invitationFeedback');

    // Isi dengan kode acak yang tidak valid
    await invitationInput.fill('KODE-INVALID-TEST-999');
    // Trigger event 'change' dengan memindahkan fokus
    await page.locator('#regFullName').focus();

    // Tunggu validasi selesai dan verifikasi muncul tulisan error
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText(/tidak ditemukan|tidak valid/i);
    await expect(feedback).toHaveCSS('color', 'rgb(185, 28, 28)'); // rgb untuk #b91c1c

    // Isi field lain dengan benar
    await page.locator('#regFullName').fill('Test User');
    await page.locator('#regUsername').fill('testuser_code_error');
    await page.locator('#regEmail').fill('testuser_code_error@simpah.dev');
    
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('ValidPass123!');
    await passwordInputs.nth(1).fill('ValidPass123!');

    // Klik tombol daftar
    await page.click('button:has-text("Daftar")');

    // Pastikan pendaftaran ditolak karena kode invalid
    const errorBanner = page.locator('#registerErrorBanner');
    await expect(errorBanner).toBeVisible();
    await expect(page.locator('#registerErrorText')).toHaveText(/kode undangan.*tidak valid/i);
    await expect(page).toHaveURL(/.*#\/register/);
  });

  test.skip('TC-REG-009: Registrasi dengan kode undangan valid - Positif', async ({ page }) => {
    // Test ini di-skip secara default agar tidak mengubah state database Supabase
    // Kecuali jika dijalankan di lingkungan pengujian terkontrol dengan data seeder
    const invitationInput = page.locator('#regInvitationCode');
    const feedback = page.locator('#invitationFeedback');

    // Gunakan kode undangan petugas yang diasumsikan valid dari seeder
    await invitationInput.fill('PETUGAS-TEST');
    await page.locator('#regFullName').focus();

    // Verifikasi live feedback sukses
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText(/kode valid.*terdaftar sebagai/i);
    await expect(feedback).toHaveCSS('color', 'rgb(5, 150, 105)'); // rgb untuk #059669

    // Isi field registrasi
    const randStr = Math.random().toString(36).substring(7);
    await page.locator('#regFullName').fill(`Petugas Baru ${randStr}`);
    await page.locator('#regUsername').fill(`petugas_${randStr}`);
    await page.locator('#regEmail').fill(`petugas_${randStr}@simpah.dev`);
    
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('ValidPass123!');
    await passwordInputs.nth(1).fill('ValidPass123!');

    await page.click('button:has-text("Daftar")');

    // Cek sukses pendaftaran sebagai petugas
    await expect(page.locator('text=/berhasil terdaftar sebagai petugas/i').first()).toBeVisible({ timeout: 10000 });
  });

});
