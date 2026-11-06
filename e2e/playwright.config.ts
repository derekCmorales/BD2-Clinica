import { defineConfig, devices } from '@playwright/test';

const PERSISTENCIA = process.env.PERSISTENCIA ?? 'memoria';
const BASE = 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './pruebas',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reporte', open: 'never' }],
    ['json', { outputFile: 'reporte/resultados.json' }],
  ],
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-GT',
    timezoneId: 'America/Guatemala',
    // Evita que axe mida colores a mitad de la animación de entrada.
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'movil',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @historiales/api start',
      cwd: '..',
      url: 'http://127.0.0.1:3000/salud',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { ...process.env, PERSISTENCIA },
    },
    {
      command: 'pnpm --filter @historiales/web exec vite --host 127.0.0.1',
      cwd: '..',
      url: BASE,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
