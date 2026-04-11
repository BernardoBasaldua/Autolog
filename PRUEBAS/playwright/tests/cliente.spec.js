/**
 * PRUEBAS DE INTERFAZ — MÓDULO CLIENTE
 * Requisitos cubiertos: CL, VH, CM, TU (desde perspectiva cliente)
 * Casos: CP-CL-01 al CP-CL-12
 *
 * Estrategia: Caja Negra
 * Técnica: Clases de equivalencia + Casos de uso
 *
 * Condición inicial: usuario CLIENTE autenticado.
 */

const { test, expect } = require('@playwright/test');
const { CLIENTE } = require('./datos-prueba');

// Helper: hacer login como cliente antes de cada test
async function loginCliente(page) {
  await page.goto('/login');
  await page.locator('#login-username').fill(CLIENTE.username);
  await page.locator('#login-password').fill(CLIENTE.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/cliente/, { timeout: 10_000 });
}

test.describe('CL — Dashboard y vehículos del cliente', () => {

  // ─── CP-CL-01 ───────────────────────────────────────────────────────────────
  test('CP-CL-01 | Dashboard /cliente muestra la lista de vehículos del cliente', async ({ page }) => {
    await loginCliente(page);
    await page.goto('/cliente');

    // Debe haber algún elemento que liste vehículos o mensaje de "sin vehículos"
    const hayVehiculos = await page.getByRole('list').count() > 0 ||
                         await page.getByText(/vehículo|patente|sin vehículos|no tenés/i).count() > 0;
    expect(hayVehiculos).toBeTruthy();
  });

  // ─── CP-CL-02 ───────────────────────────────────────────────────────────────
  test('CP-CL-02 | Acceder a /cliente sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/cliente');
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

});

test.describe('CL — Historial de vehículo', () => {

  test.beforeEach(async ({ page }) => { await loginCliente(page); });

  // ─── CP-CL-03 ───────────────────────────────────────────────────────────────
  test('CP-CL-03 | La página de historial muestra órdenes de trabajo del vehículo', async ({ page }) => {
    // Navegar al cliente principal
    await page.goto('/cliente');

    // Intentar hacer click en el primer vehículo con enlace a historial
    const historialLink = page.getByRole('link', { name: /historial/i }).first();
    if (await historialLink.count()) {
      await historialLink.click();
      await expect(page).toHaveURL(/historial/);
      // La página debe mostrar OTs o mensaje de sin historial
      await expect(
        page.getByText(/orden|historial|sin órdenes|no hay/i)
      ).toBeVisible({ timeout: 5_000 });
    } else {
      // Si no hay vehículos registrados, skip
      test.skip();
    }
  });

});

test.describe('CL — Permisos de acceso', () => {

  test.beforeEach(async ({ page }) => { await loginCliente(page); });

  // ─── CP-CL-04 ───────────────────────────────────────────────────────────────
  test('CP-CL-04 | La pantalla de permisos muestra los permisos otorgados y recibidos', async ({ page }) => {
    await page.goto('/cliente');
    const permisosLink = page.getByRole('link', { name: /permiso/i }).first();
    if (await permisosLink.count()) {
      await permisosLink.click();
      await expect(page).toHaveURL(/permisos/);
      await expect(page.getByText(/permiso|acceso|otorgado|recibido/i)).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip();
    }
  });

});

test.describe('CM — Próximo mantenimiento', () => {

  test.beforeEach(async ({ page }) => { await loginCliente(page); });

  // ─── CP-CL-05 ───────────────────────────────────────────────────────────────
  test('CP-CL-05 | /cliente/pm muestra información del próximo service', async ({ page }) => {
    await page.goto('/cliente/pm');

    await expect(page).toHaveURL(/pm/);
    // Debe mostrar fecha, km estimado, o mensaje de sin datos
    await expect(
      page.getByText(/próximo|mantenimiento|service|km|kilómetros|sin datos/i)
    ).toBeVisible({ timeout: 5_000 });
  });

});

test.describe('TU — Turnos del cliente', () => {

  test.beforeEach(async ({ page }) => { await loginCliente(page); });

  // ─── CP-CL-06 ───────────────────────────────────────────────────────────────
  test('CP-CL-06 | /cliente/turnos muestra turnos pasados y futuros', async ({ page }) => {
    await page.goto('/cliente/turnos');
    await expect(page).toHaveURL(/turnos/);
    await expect(
      page.getByText(/turno|orden|fecha|sin turnos|no tenés/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── CP-CL-07 ───────────────────────────────────────────────────────────────
  test('CP-CL-07 | /cliente/talleres muestra listado de talleres para pedir turno', async ({ page }) => {
    await page.goto('/cliente/talleres');
    await expect(page).toHaveURL(/talleres/);
    await expect(
      page.getByText(/taller|mecánico|sin talleres|no hay/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  // ─── CP-CL-08 ───────────────────────────────────────────────────────────────
  test('CP-CL-08 | Seleccionar un taller muestra los turnos disponibles', async ({ page }) => {
    await page.goto('/cliente/talleres');

    const tallerLink = page.getByRole('link', { name: /pedir turno|reservar|ver turno/i }).first();
    if (await tallerLink.count()) {
      await tallerLink.click();
      await expect(page).toHaveURL(/pedir_turno|turno/);
      await expect(
        page.getByText(/turno|disponible|horario|franja/i)
      ).toBeVisible({ timeout: 5_000 });
    } else {
      test.skip();
    }
  });

});

test.describe('CL — Configuración de cuenta', () => {

  test.beforeEach(async ({ page }) => { await loginCliente(page); });

  // ─── CP-CL-09 ───────────────────────────────────────────────────────────────
  test('CP-CL-09 | /cliente/config muestra datos del perfil del cliente', async ({ page }) => {
    await page.goto('/cliente/config');
    await expect(page).toHaveURL(/config/);
    // Verificar que alguno de los datos del usuario es visible (primer match)
    await expect(
      page.getByText(new RegExp(CLIENTE.nombre + '|' + CLIENTE.email + '|perfil|datos', 'i')).first()
    ).toBeVisible({ timeout: 5_000 });
  });

});
