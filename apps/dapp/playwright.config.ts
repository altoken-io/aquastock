import { defineConfig, devices } from '@playwright/test';

const PORT = 3003;

/**
 * The golden path runs against a real local stack: a validator with the program and the
 * mainnet Token-2022 build, a disposable Postgres, and this app, all started by
 * `scripts/dev-stack.sh`. It is not part of `pnpm check` (that needs no Docker or Solana
 * toolchain); run it with `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  // A run does real transactions on a validator, and the demo pool vests over minutes.
  timeout: 240_000,
  expect: { timeout: 20_000 },
  // One wallet and one chain: tests must run one after another.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      // Judges open the link on a phone: the same path must work at 390px.
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'bash scripts/dev-stack.sh',
    cwd: '../..',
    url: `http://localhost:${PORT}/en/pools`,
    // Validator, database, seeding and the first compile.
    timeout: 300_000,
    reuseExistingServer: true,
    stdout: 'pipe',
  },
});
