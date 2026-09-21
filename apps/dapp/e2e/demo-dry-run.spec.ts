import { expect, test } from '@playwright/test';

import {
  clearLeftoverPosition,
  connectTestWallet,
  dismissCookieBanner,
  dismissStatus,
  seededPool,
} from './support';

/**
 * A timed dry run of docs/DEMO_SCRIPT.md, beat by beat. It measures what the app costs a
 * presenter (page loads, transactions, confirmations), not the narration: each beat has the
 * window the script gives it, and the run must fit the 90 seconds in total.
 *
 * It uses one wallet where the live demo uses three (sponsor, saver A, saver B), so the same
 * wallet plays sponsor for beat 2 and saver for the rest, exactly as the golden path does.
 */
const WINDOWS_SECONDS = {
  '1 open the pools': 10,
  '2 sponsor creates a pool': 15,
  '3 saver deposits': 20,
  '4 my match and claim': 20,
  '5 withdraw with preview': 15,
  '6 issuer disclosure and close': 10,
} as const;

test('the 90-second demo fits its beats', async ({ page }, testInfo) => {
  await dismissCookieBanner(page);
  const timings: [string, number][] = [];
  const beat = async (
    name: keyof typeof WINDOWS_SECONDS,
    run: () => Promise<void>,
  ) => {
    const started = Date.now();
    await run();
    timings.push([name, (Date.now() - started) / 1000]);
  };
  const panel = page.getByRole('complementary', {
    name: 'Your actions in this pool',
  });
  const transactionLink = () =>
    page.getByRole('link', { name: 'View transaction' }).first();

  // Setup the presenter does before going on stage: a connected wallet and a clean position.
  await page.goto(`/en/pools/${seededPool()}`);
  await connectTestWallet(page);
  await clearLeftoverPosition(page);

  await beat('1 open the pools', async () => {
    await page.goto('/en/pools');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Sponsor / }).first(),
    ).toBeVisible();
  });

  await beat('2 sponsor creates a pool', async () => {
    await page.goto('/en/pools/new');
    await connectTestWallet(page);
    await page.locator('#pool-name').fill(`Demo run ${Date.now()}`);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#pool-cap').fill('20');
    await page.getByRole('button', { name: '3 minutes (demo)' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#pool-budget').fill('100');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
      .getByRole('button', { name: /^Create pool and lock 100/ })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Your pool is live' }),
    ).toBeVisible();
    await expect(page.getByText('Name published')).toBeVisible();
  });

  await beat('3 saver deposits', async () => {
    await page.goto(`/en/pools/${seededPool()}`);
    await connectTestWallet(page);
    await panel.locator('input[inputmode="decimal"]').fill('40');
    await panel.getByRole('button', { name: 'Deposit 40 dSPYx' }).click();
    await expect(
      panel.getByRole('heading', { name: 'Your position' }),
    ).toBeVisible();
    // The script says to have every transaction's link ready.
    await expect(transactionLink()).toHaveAttribute(
      'href',
      /explorer\.solana\.com\/tx\//,
    );
  });
  await dismissStatus(page);

  await beat('4 my match and claim', async () => {
    await page.goto('/en/my-match');
    await connectTestWallet(page);
    const claim = page
      .getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ })
      .first();
    await expect(claim).toBeEnabled();
    await claim.click();
    await expect(
      page.getByText('Claimed. The tokens are in your wallet.'),
    ).toBeVisible();
    await expect(transactionLink()).toBeVisible();
  });

  await beat('5 withdraw with preview', async () => {
    await page.goto(`/en/pools/${seededPool()}`);
    await connectTestWallet(page);
    await panel.getByRole('button', { name: 'Withdraw deposit' }).click();
    const dialog = page.getByRole('dialog', { name: 'Withdraw your deposit?' });
    await expect(
      dialog.getByText('Match you give up', { exact: true }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Withdraw 40 dSPYx' }).click();
    await expect(
      panel.getByText('Withdrawn. Your deposit is back in your wallet.'),
    ).toBeVisible();
    await expect(transactionLink()).toBeVisible();
  });
  await dismissStatus(page);

  await beat('6 issuer disclosure and close', async () => {
    await expect(
      page.getByRole('heading', { name: 'What you actually own' }),
    ).toBeVisible();
    await expect(page.getByText('Pause transfers')).toBeVisible();
    await expect(
      page.getByText('Move tokens out of any account'),
    ).toBeVisible();
    await panel.getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ }).click();
    await expect(
      panel.getByRole('button', { name: 'Close position' }),
    ).toBeVisible();
    await dismissStatus(page);
    await panel.getByRole('button', { name: 'Close position' }).click();
    await expect(panel.getByText('Position closed.')).toBeVisible();
  });

  const total = timings.reduce((sum, [, seconds]) => sum + seconds, 0);
  const report = timings
    .map(([name, seconds]) => {
      const window = WINDOWS_SECONDS[name as keyof typeof WINDOWS_SECONDS];
      return `${seconds.toFixed(1).padStart(5)}s of ${String(window).padStart(2)}s  ${name}`;
    })
    .join('\n');
  console.log(
    `\n[${testInfo.project.name}] demo dry run\n${report}\n${total.toFixed(1).padStart(5)}s total (budget 90s)\n`,
  );
  testInfo.annotations.push({ type: 'timings', description: report });

  for (const [name, seconds] of timings) {
    expect(seconds, name).toBeLessThan(
      WINDOWS_SECONDS[name as keyof typeof WINDOWS_SECONDS],
    );
  }
  expect(total).toBeLessThan(90);
});
