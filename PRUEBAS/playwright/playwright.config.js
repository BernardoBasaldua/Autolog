// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  workers: 1, // Secuencial para que el headed sea visible

  use: {
    baseURL: 'http://localhost:4200',
    headless: false,           // --headed: ventana del navegador visible
    screenshot: 'on',          // Captura siempre (éxito y fallo)
    video: 'retain-on-failure',// Video solo en fallo
    trace: 'retain-on-failure',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  },

  reporter: [
    // Consola legible
    ['list'],
    // Reporte HTML navegable (abrir con: npm run report)
    ['html', { outputFolder: path.join(LOGS_DIR, 'reporte-html'), open: 'never' }],
    // JSON raw para procesar programáticamente
    ['json', { outputFile: path.join(LOGS_DIR, 'resultados.json') }],
    // Logger custom que separa éxitos de errores
    [path.join(__dirname, 'logger-reporter.js')],
  ],

  outputDir: path.join(LOGS_DIR, 'artifacts'),

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
