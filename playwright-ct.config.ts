import path from 'path'
import { defineConfig, devices } from '@playwright/experimental-ct-react'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ctTemplateDir: './playwright',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 900 },
    ctViteConfig: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          'next/link': path.resolve(__dirname, './tests/e2e/mocks/next-link.tsx'),
        },
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
