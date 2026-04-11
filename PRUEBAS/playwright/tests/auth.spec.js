/**
 * PRUEBAS DE INTERFAZ — AUTENTICACIÓN
 * Requisitos cubiertos: AU
 * Casos: CP-AU-01 al CP-AU-06
 *
 * Selectores basados en el HTML real de login.html:
 *   - Campo usuario : #login-username
 *   - Campo password: #login-password
 *   - Botón submit  : button[type="submit"] → texto "Iniciar Sesión"
 */

const { test, expect } = require('@playwright/test');
const { CLIENTE, TECNICO } = require('./datos-prueba');

// Helper reutilizable
async function llenarLogin(page, username, password) {
  await page.goto('/login');
  await page.locator('#login-username').fill(username);
  await page.locator('#login-password').fill(password);
  await page.locator('button[type="submit"]').click();
}

test.describe('AU — Autenticación', () => {

  // ─── CP-AU-01 ───────────────────────────────────────────────────────────────
  test('CP-AU-01 | Login válido como CLIENTE redirige a /cliente', async ({ page }) => {
    await llenarLogin(page, CLIENTE.username, CLIENTE.password);
    await expect(page).toHaveURL(/\/cliente/, { timeout: 10_000 });
  });

  // ─── CP-AU-02 ───────────────────────────────────────────────────────────────
  test('CP-AU-02 | Login válido como TÉCNICO redirige a /taller', async ({ page }) => {
    await llenarLogin(page, TECNICO.username, TECNICO.password);
    await expect(page).toHaveURL(/\/taller/, { timeout: 10_000 });
  });

  // ─── CP-AU-03 ───────────────────────────────────────────────────────────────
  test('CP-AU-03 | Login con contraseña incorrecta muestra error', async ({ page }) => {
    await llenarLogin(page, CLIENTE.username, 'contraseña_incorrecta_999');

    // Debe permanecer en /login
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
    // Mensaje de error visible (loginError en el template)
    await expect(
      page.locator('small.text-red-600').or(page.getByText(/credenciales|inválid|incorrecto|error/i))
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── CP-AU-04 ───────────────────────────────────────────────────────────────
  test('CP-AU-04 | Login con campos vacíos — botón deshabilitado', async ({ page }) => {
    await page.goto('/login');

    // El botón tiene [disabled] cuando el form es inválido (Angular reactive form)
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();
    await expect(page).toHaveURL(/login/);
  });

  // ─── CP-AU-05 ───────────────────────────────────────────────────────────────
  test('CP-AU-05 | Login con usuario inexistente muestra error', async ({ page }) => {
    await llenarLogin(page, 'usuario_que_no_existe_xyz', 'cualquiera123');

    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
    await expect(
      page.locator('small.text-red-600').or(page.getByText(/credenciales|inválid|no encontrado/i))
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── CP-AU-06 ───────────────────────────────────────────────────────────────
  test('CP-AU-06 | Cerrar sesión redirige a /login y bloquea rutas protegidas', async ({ page }) => {
    // Login
    await llenarLogin(page, CLIENTE.username, CLIENTE.password);
    await expect(page).toHaveURL(/\/cliente/, { timeout: 10_000 });

    // Logout — buscar botón o link con texto "Cerrar sesión" / "Salir"
    const logoutBtn = page.getByRole('button', { name: /cerrar sesión|logout|salir/i })
                          .or(page.getByRole('link', { name: /cerrar sesión|logout|salir/i }));
    await logoutBtn.click();
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });

    // Intentar acceder a ruta protegida → debe redirigir a login
    await page.goto('/cliente');
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

});
