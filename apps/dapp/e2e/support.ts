import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page } from '@playwright/test';

interface StackInfo {
  pool: string;
  mint: string;
  programId: string;
  wallet: string;
}

/** The pool `scripts/dev-stack.sh` seeded: sponsored by someone other than the test wallet. */
export function seededPool(): string {
  const file = join(__dirname, '../../../programs/target/dev-stack.json');
  try {
    const info: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (
      typeof info === 'object' &&
      info !== null &&
      'pool' in info &&
      typeof info.pool === 'string'
    ) {
      return info.pool;
    }
  } catch {
    // Falls through to the message below.
  }
  throw new Error(
    `Could not read ${file}. Start the stack with \`pnpm dev:stack\` (or let Playwright start it).`,
  );
}

export type { StackInfo };

/** Keeps the cookie banner out of the way, before any page script runs. */
export async function dismissCookieBanner(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('aquastock_cookie_consent', 'declined');
      document.cookie = 'aquastock_cookie_consent=declined; Path=/';
    } catch {
      // Storage can be blocked; the banner then simply stays.
    }
  });
}

/**
 * Connects the throwaway test wallet. Right after a page load the wallet may reconnect by itself
 * (it remembers the last choice), and a click before hydration does nothing without saying so,
 * so this waits for either state and retries the click with short timeouts.
 */
export async function connectTestWallet(page: Page): Promise<void> {
  const connected = page.getByRole('button', { name: 'Wallet menu' }).first();
  const connect = page.getByRole('button', { name: 'Connect wallet' }).first();
  await expect(connected.or(connect)).toBeVisible();
  await expect(async () => {
    if (await connected.isVisible()) return;
    await connect.click({ timeout: 2_000 });
    await page
      .getByRole('button', { name: 'E2E Test Wallet' })
      .click({ timeout: 2_000 });
    await expect(connected).toBeVisible({ timeout: 8_000 });
  }).toPass({ timeout: 60_000 });
}

/** Closes the transaction status message so the next one is unambiguous. */
export async function dismissStatus(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Dismiss' }).click();
}

/**
 * A run that dies halfway leaves the wallet with a live position in the seeded pool, and the next
 * run would then find "Your position" where it expects a deposit form. This walks any leftover
 * position to its end through the UI (withdraw, claim what is left, close), so the spec starts
 * from the same place every time.
 */
export async function clearLeftoverPosition(page: Page): Promise<void> {
  const panel = page.getByRole('complementary', {
    name: 'Your actions in this pool',
  });
  const deposit = panel.getByRole('heading', { name: 'Deposit dSPYx' });
  const position = panel.getByRole('heading', { name: 'Your position' });
  await expect(deposit.or(position)).toBeVisible();

  for (let step = 0; step < 6 && (await position.isVisible()); step += 1) {
    const withdraw = panel.getByRole('button', { name: 'Withdraw deposit' });
    const claim = panel.getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ });
    const close = panel.getByRole('button', { name: 'Close position' });
    if (await close.isVisible()) {
      await close.click();
    } else if (await withdraw.isVisible()) {
      await withdraw.click();
      await page
        .getByRole('dialog', { name: 'Withdraw your deposit?' })
        .getByRole('button', { name: /^Withdraw / })
        .click();
    } else if (await claim.isEnabled()) {
      await claim.click();
    } else {
      // Nothing to click yet: the match is still vesting. Give it a moment and look again.
      await page.waitForTimeout(2_000);
      continue;
    }
    await expect(panel.getByRole('button', { name: 'Dismiss' })).toBeVisible();
    await dismissStatus(page);
  }
  await expect(deposit).toBeVisible();
}
