import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/app',
  timeout: 45_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL,
    viewport: { width: 1280, height: 900 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `node_modules\\.bin\\next.cmd dev -p ${port} --hostname 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
