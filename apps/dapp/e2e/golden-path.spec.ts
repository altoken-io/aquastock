import { expect, test } from '@playwright/test';

import {
  clearLeftoverPosition,
  connectTestWallet,
  dismissCookieBanner,
  dismissStatus,
  seededPool,
} from './support';

/**
 * The whole product, the way a judge sees it: a sponsor creates and funds a pool, then a saver
 * deposits into a pool, watches the match vest, claims, leaves early, claims what had vested,
 * and closes the position. Every step is a real transaction on the local validator.
 *
 * The test wallet is a single throwaway key, so it cannot be both sponsor and saver of one pool
 * (the UI rightly shows the sponsor controls instead of a deposit form). It creates its own pool
 * as sponsor, then acts as the saver in the pool the stack seeded for someone else.
 */
test('sponsor creates a pool; saver deposits, claims, withdraws and closes', async ({
  page,
}) => {
  const poolName = `E2E teachers match ${Date.now()}`;
  await dismissCookieBanner(page);

  // ---- The sponsor creates and funds a pool ------------------------------------------------
  await page.goto('/en/pools/new');
  await connectTestWallet(page);

  await page.locator('#pool-name').fill(poolName);
  await page.getByRole('button', { name: 'Continue' }).click();

  // An empty required field blocks the step and says why.
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#pool-cap-error')).toHaveText(
    'This field is required.',
  );

  // Small amounts: one throwaway wallet funds every run, so a run must not use it up.
  await page.locator('#pool-cap').fill('20');
  await page.getByRole('button', { name: '3 minutes (demo)' }).click();
  await page.getByRole('button', { name: '60 minutes (demo)' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.locator('#pool-budget').fill('100');
  // 100 over a 20 cap at a 100% match is exactly five savers, whatever the display multiplier.
  await expect(page.getByText('5 savers matched in full')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(
    page.getByRole('heading', { name: 'Review and create' }),
  ).toBeVisible();
  // The disclosure list carries the demo disclaimer (the footer repeats it, so scope to main).
  await expect(
    page
      .getByRole('main')
      .getByText('Demo — this does not constitute an offer of securities.'),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Create pool and lock 100/ }).click();

  await expect(
    page.getByRole('heading', { name: 'Your pool is live' }),
  ).toBeVisible();
  await expect(page.getByText('Name published')).toBeVisible();
  await page.getByRole('link', { name: 'Open your pool' }).click();

  // The sponsor's own pool: sponsor controls, not a deposit form.
  await expect(
    page.getByRole('heading', { level: 1, name: poolName }),
  ).toBeVisible();
  const sponsorPanel = page.getByRole('complementary', {
    name: 'Your actions in this pool',
  });
  await expect(sponsorPanel.getByText("You're the sponsor")).toBeVisible();
  await sponsorPanel.locator('input[inputmode="decimal"]').fill('5');
  await sponsorPanel.getByRole('button', { name: /^Add 5 / }).click();
  await expect(sponsorPanel.getByText('Match budget added.')).toBeVisible();
  await expect(sponsorPanel).toContainText('105 dSPYx');

  // ---- The saver deposits into the seeded pool ---------------------------------------------
  await page.goto(`/en/pools/${seededPool()}`);
  await connectTestWallet(page);
  const panel = page.getByRole('complementary', {
    name: 'Your actions in this pool',
  });
  // An earlier aborted run may have left a position behind: settle it first.
  await clearLeftoverPosition(page);

  const balanceBefore = await panel.getByText(/^Your balance:/).innerText();
  await panel.locator('input[inputmode="decimal"]').fill('40');
  // The preview says what the deposit reserves before anything is signed.
  await expect(panel.getByText('Sponsor match')).toBeVisible();
  await panel.getByRole('button', { name: 'Deposit 40 dSPYx' }).click();

  await expect(
    panel.getByRole('heading', { name: 'Your position' }),
  ).toBeVisible();
  await expect(
    panel.getByText('Deposited. Your match is reserved and already vesting.'),
  ).toBeVisible();
  await expect(panel.getByText('Vesting', { exact: true })).toBeVisible();
  await dismissStatus(page);

  // ---- The match vests, and the saver claims what has ---------------------------------------
  const claim = panel.getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ });
  await expect(claim).toBeEnabled();
  await claim.click();
  await expect(
    panel.getByText('Claimed. The tokens are in your wallet.'),
  ).toBeVisible();
  await dismissStatus(page);

  // ---- Leaving early shows its cost first, then gives the deposit back ----------------------
  await panel.getByRole('button', { name: 'Withdraw deposit' }).click();
  const dialog = page.getByRole('dialog', { name: 'Withdraw your deposit?' });
  await expect(dialog.getByText('You get back', { exact: true })).toBeVisible();
  await expect(
    dialog.getByText('Match you give up', { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Withdraw 40 dSPYx' }).click();

  await expect(
    panel.getByText('Withdrawn. Your deposit is back in your wallet.'),
  ).toBeVisible();
  await expect(panel.getByText('Deposit withdrawn')).toBeVisible();
  await dismissStatus(page);

  // What had vested stays claimable after the withdrawal.
  const claimRest = panel.getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ });
  await expect(claimRest).toBeEnabled();
  await claimRest.click();
  await expect(
    panel.getByText('Claimed. The tokens are in your wallet.'),
  ).toBeVisible();
  await dismissStatus(page);

  // ---- Everything is paid out, so the position can be closed --------------------------------
  await panel.getByRole('button', { name: 'Close position' }).click();
  await expect(panel.getByText('Position closed.')).toBeVisible();
  await expect(
    panel.getByRole('heading', { name: 'Deposit dSPYx' }),
  ).toBeVisible();

  // The deposit came back whole and the vested match was paid on top: the balance only grew.
  const parse = (text: string): number =>
    Number(text.replace(/[^\d.]/g, '').replace(/,/g, ''));
  const balanceAfter = await panel.getByText(/^Your balance:/).innerText();
  expect(parse(balanceAfter)).toBeGreaterThan(parse(balanceBefore));

  // ---- My match lists the pool this wallet sponsors -----------------------------------------
  await page.goto('/en/my-match');
  await expect(
    page.getByRole('heading', { name: 'Pools you sponsor' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: new RegExp(poolName) }),
  ).toBeVisible();
});

test('a pool that does not exist says so, in the visitor language', async ({
  page,
}) => {
  await dismissCookieBanner(page);
  await page.goto('/es/pools/not-an-address');
  await expect(
    page.getByRole('heading', { name: 'Ese fondo no existe' }),
  ).toBeVisible();
  await page.goto('/en/no-such-page');
  await expect(
    page.getByRole('heading', { name: "We can't find that page" }),
  ).toBeVisible();
});

test('old water-funding links land on the new pages', async ({ request }) => {
  const redirect = async (path: string) =>
    (await request.get(path, { maxRedirects: 0 })).headers()['location'];
  expect(await redirect('/en/projects')).toMatch(/\/en\/pools$/);
  expect(await redirect('/en/impact')).toMatch(/\/en\/my-match$/);
});
