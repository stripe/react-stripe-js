// smoke-tests/projects/react-19-vite/playwright.config.ts
import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4001',
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
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        ...(process.env.FIREFOX_EXECUTABLE_PATH
          ? {launchOptions: {executablePath: process.env.FIREFOX_EXECUTABLE_PATH}}
          : {}),
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        ...(process.env.WEBKIT_EXECUTABLE_PATH
          ? {launchOptions: {executablePath: process.env.WEBKIT_EXECUTABLE_PATH}}
          : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
