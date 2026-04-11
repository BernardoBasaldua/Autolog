/**
 * PRUEBAS DE INTERFAZ — REGISTRO DE USUARIOS
 * Casos: CP-REG-01 al CP-REG-06
 *
 * Selectores basados en form-clientes.html y form-talleres.html:
 *   Cliente : #cliente-username, #cliente-nombre, #cliente-apellido,
 *             #cliente-dni, #cliente-telefono, #cliente-email,
 *             #cliente-password, #cliente-confirm-password
 *             botón: "Registrar cliente"
 *   Taller  : #taller-nombre, #taller-cuit, #taller-telefono,
 *             #taller-direccion, #taller-descripcion
 *             botón: "Registrarse como establecimiento"
 *
 * NOTA: cada ejecución genera username/email únicos para evitar duplicados.
 */

const { test, expect } = require('@playwright/test');
const { CLIENTE } = require('./datos-prueba');

const uid = () => Date.now().toString().slice(-6);

// Helper: llenar formulario de cliente (usado en cliente y taller)
async function llenarFormCliente(page, { username, nombre, apellido, dni, telefono, email, password }) {
  await page.locator('#cliente-username').fill(username);
  await page.locator('#cliente-nombre').fill(nombre);
  await page.locator('#cliente-apellido').fill(apellido);
  await page.locator('#cliente-dni').fill(dni);
  await page.locator('#cliente-telefono').fill(telefono);
  await page.locator('#cliente-email').fill(email);
  await page.locator('#cliente-password').fill(password);
  await page.locator('#cliente-confirm-password').fill(password);
}

test.describe('REG — Registro de usuarios', () => {

  // ─── CP-REG-01 ──────────────────────────────────────────────────────────────
  test('CP-REG-01 | /registrarse muestra botones "Registrar cliente" y "Registrar establecimiento"', async ({ page }) => {
    await page.goto('/registrarse');

    await expect(page.getByRole('button', { name: /registrar cliente/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /registrar establecimiento/i })).toBeVisible();
  });

  // ─── CP-REG-02 ──────────────────────────────────────────────────────────────
  test('CP-REG-02 | Seleccionar "Registrar cliente" muestra el formulario de cliente', async ({ page }) => {
    await page.goto('/registrarse');
    await page.locator('button.tipo-button', { hasText: 'Registrar cliente' }).click();

    // El formulario con id cliente-username debe aparecer
    await expect(page.locator('#cliente-username')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('#cliente-email')).toBeVisible();
    await expect(page.locator('#cliente-password')).toBeVisible();
    await expect(page.locator('#cliente-confirm-password')).toBeVisible();
  });

  // ─── CP-REG-03 ──────────────────────────────────────────────────────────────
  test('CP-REG-03 | Registro exitoso como CLIENTE navega a /cliente o muestra éxito', async ({ page }) => {
    const id = uid();
    await page.goto('/registrarse');
    await page.locator('button.tipo-button', { hasText: 'Registrar cliente' }).click();
    await page.locator('#cliente-username').waitFor({ state: 'visible' });

    await llenarFormCliente(page, {
      username : `cli_pw_${id}`,
      nombre   : 'María',
      apellido : 'Test',
      dni      : `4${id}`,
      telefono : `+543511${id}`,   // +54 + 3511 + 6 dígitos = 10 dígitos = formato válido AR
      email    : `cli_pw_${id}@test.com`,
      password : 'AutoLog2025!',
    });

    // El submit button es del tipo submit, no el tab button
    await page.locator('button[type="submit"]').click();

    // Puede redirigir a /cliente o /login, o mostrar mensaje de éxito
    await page.waitForTimeout(3_000);
    const url = page.url();
    const ok = url.includes('/cliente') || url.includes('/login');
    expect(ok).toBeTruthy();
  });

  // ─── CP-REG-04 ──────────────────────────────────────────────────────────────
  test('CP-REG-04 | Seleccionar "Registrar establecimiento" muestra el formulario de taller', async ({ page }) => {
    await page.goto('/registrarse');
    await page.getByRole('button', { name: /registrar establecimiento/i }).click();

    await expect(page.locator('#taller-nombre')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('#taller-cuit')).toBeVisible();
    await expect(page.locator('#taller-telefono')).toBeVisible();
    await expect(page.locator('#taller-direccion')).toBeVisible();
  });

  // ─── CP-REG-05 ──────────────────────────────────────────────────────────────
  test('CP-REG-05 | Registro con username ya existente muestra error de duplicado', async ({ page }) => {
    await page.goto('/registrarse');
    await page.locator('button.tipo-button', { hasText: 'Registrar cliente' }).click();
    await page.locator('#cliente-username').waitFor({ state: 'visible' });

    await llenarFormCliente(page, {
      username : CLIENTE.username,          // username que ya existe
      nombre   : 'Duplicado',
      apellido : 'Test',
      dni      : `9${uid()}`,
      telefono : `+543511${uid()}`,
      email    : `dup_${uid()}@test.com`,
      password : 'AutoLog2025!',
    });

    await page.locator('button[type="submit"]').click();

    // Debe aparecer un mensaje de error (en errorMessages o notice)
    await expect(
      page.getByText(/ya existe|en uso|duplicado|nombre de usuario/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // ─── CP-REG-06 ──────────────────────────────────────────────────────────────
  test('CP-REG-06 | Botón submit deshabilitado con formulario de cliente vacío', async ({ page }) => {
    await page.goto('/registrarse');
    // Click en el tab "Registrar cliente" (tipo-button, no submit)
    await page.locator('button.tipo-button', { hasText: 'Registrar cliente' }).click();
    await page.locator('#cliente-username').waitFor({ state: 'visible' });

    // El botón submit tiene [disabled] cuando el form angular es inválido
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  // ─── CP-REG-07 ──────────────────────────────────────────────────────────────
  test('CP-REG-07 | Contraseñas que no coinciden muestran error de validación', async ({ page }) => {
    const id = uid();
    await page.goto('/registrarse');
    await page.locator('button.tipo-button', { hasText: 'Registrar cliente' }).click();
    await page.locator('#cliente-username').waitFor({ state: 'visible' });

    await page.locator('#cliente-username').fill(`cli_mismatch_${id}`);
    await page.locator('#cliente-nombre').fill('Test');
    await page.locator('#cliente-apellido').fill('Mismatch');
    await page.locator('#cliente-dni').fill(`8${id}`);
    await page.locator('#cliente-telefono').fill(`+543511${id}`);
    await page.locator('#cliente-email').fill(`mismatch_${id}@test.com`);
    await page.locator('#cliente-password').fill('AutoLog2025!');
    await page.locator('#cliente-confirm-password').fill('OtraContraseña99!');
    // Tocar el campo para disparar la validación
    await page.locator('#cliente-confirm-password').blur();

    await expect(
      page.getByText(/no coinciden|contraseñas.*no/i)
    ).toBeVisible({ timeout: 3_000 });
  });

});
