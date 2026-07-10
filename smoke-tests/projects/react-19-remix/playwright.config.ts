import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : {channel: 'chrome'}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
