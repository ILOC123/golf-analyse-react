import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/mobile',
  snapshotDir: './tests/screenshots',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'de-CH',
  },
  projects: [
    {
      name: 'iPhone 16',
      use: {
        ...devices['iPhone 16'],
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 10000,
  },
})
