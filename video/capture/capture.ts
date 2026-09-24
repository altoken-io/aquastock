// Records the live devnet app for the demo video: a sponsor creates and funds a pool, two savers
// get demo tokens from the app's faucet and deposit, one leaves early, the other watches the
// match vest and claims. Every step is a real devnet transaction signed by a throwaway wallet
// (see wallet.ts); the video only animates what this run saw.
//
//   pnpm capture            run (or resume) the capture
//   pnpm capture --fresh    forget the saved run and start over (spends new faucet requests)
//   pnpm capture --retake-wizard   re-shoot the sponsor wizard up to its review step, no submit
//
// Output: public/capture/*.jpg and public/capture/manifest.json. Run state, including the
// throwaway keys, stays in capture/.state (gitignored), so a failed step resumes without asking
// the faucet again: it allows 10 requests per IP per day, and a full run uses 3.
import { randomBytes, verify, type JsonWebKey } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
} from 'playwright';

import type {
  Box,
  CaptureManifest,
  Shot,
  TransactionName,
} from '../src/lib/capture-manifest.ts';
import {
  WALLET_NAME,
  installWallet,
  newWallet,
  signTransaction,
  walletFromJwk,
  type ScriptedWallet,
} from './wallet.ts';

const APP = process.env.CAPTURE_APP_URL ?? 'https://aquastock-dapp.vercel.app';
const VIEWPORT = { width: 1280, height: 800 };
const DEVICE_SCALE_FACTOR = 2;
const POOL_NAME = 'Video demo: 1:1 match, 3-minute vesting';
const VESTING_SECONDS = 180;
const DEPOSIT = '40';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, '../public/capture');
const STATE_DIR = join(here, '.state');
const STATE_FILE = join(STATE_DIR, 'run.json');

type Role = 'sponsor' | 'saverA' | 'saverB';
type Phase = 'sponsor' | 'depositA' | 'depositB' | 'timeline' | 'wrapup';

interface RunState {
  keys: Partial<Record<Role, JsonWebKey>>;
  pool?: CaptureManifest['pool'];
  transactions: Partial<Record<TransactionName, string>>;
  depositedAt: Partial<Record<'saverA' | 'saverB', number>>;
  shots: Shot[];
  done: Phase[];
}

// Only this script writes the state file; the check keeps a stale or hand-edited one from
// being trusted half-way.
function isRunState(value: unknown): value is RunState {
  if (typeof value !== 'object' || value === null) return false;
  const [keys, transactions, depositedAt, shots, done]: unknown[] = [
    'keys',
    'transactions',
    'depositedAt',
    'shots',
    'done',
  ].map((key) => Reflect.get(value, key));
  return (
    typeof keys === 'object' &&
    keys !== null &&
    typeof transactions === 'object' &&
    transactions !== null &&
    typeof depositedAt === 'object' &&
    depositedAt !== null &&
    Array.isArray(shots) &&
    Array.isArray(done)
  );
}

function loadState(): RunState {
  if (process.argv.includes('--fresh')) {
    rmSync(STATE_DIR, { recursive: true, force: true });
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    if (isRunState(parsed)) return parsed;
    console.warn(`Ignoring ${STATE_FILE}: not a run this script wrote.`);
  } catch {
    // No saved run: start one.
  }
  return { keys: {}, transactions: {}, depositedAt: {}, shots: [], done: [] };
}

const state = loadState();

function save(): void {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  if (!state.pool) return;
  const wallets = {
    sponsor: wallet('sponsor').address,
    saverA: wallet('saverA').address,
    saverB: wallet('saverB').address,
  };
  const manifest: CaptureManifest = {
    capturedAt: new Date().toISOString(),
    app: APP,
    network: 'devnet',
    viewport: { ...VIEWPORT, deviceScaleFactor: DEVICE_SCALE_FACTOR },
    pool: state.pool,
    wallets,
    transactions: state.transactions,
    shots: state.shots,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

const wallets = new Map<Role, ScriptedWallet>();
function wallet(role: Role): ScriptedWallet {
  let found = wallets.get(role);
  if (!found) {
    const saved = state.keys[role];
    found = saved ? walletFromJwk(saved) : newWallet();
    state.keys[role] = found.jwk;
    wallets.set(role, found);
  }
  return found;
}

const log = (message: string) =>
  console.log(`${new Date().toISOString().slice(11, 19)}  ${message}`);

async function openAs(browser: Browser, role: Role): Promise<Page> {
  const context: BrowserContext = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: 'light',
    locale: 'en-US',
    reducedMotion: 'no-preference',
  });
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('aquastock_cookie_consent', 'declined');
    } catch {
      // Storage blocked: the banner then stays, which only costs screen space.
    }
  });
  await installWallet(context, wallet(role));
  return context.newPage();
}

/** Parks the mouse off the content so no hover state leaks into a screenshot. */
async function parkMouse(page: Page): Promise<void> {
  await page.mouse.move(VIEWPORT.width - 4, VIEWPORT.height - 4);
}

/** Scrolls just enough that `locator` sits inside the viewport with a margin below it. */
async function reveal(page: Page, locator: Locator): Promise<void> {
  const box = await locator.first().boundingBox({ timeout: 5_000 });
  if (!box) return;
  const overflow = box.y + box.height - (VIEWPORT.height - 56);
  if (overflow > 0) {
    await page.evaluate((by) => window.scrollBy(0, by), overflow);
  }
}

async function shoot(
  page: Page,
  id: string,
  targets: Record<string, Locator> = {},
  options: { reveal?: Locator } = {},
): Promise<void> {
  if (options.reveal) await reveal(page, options.reveal);
  await parkMouse(page);
  await page.waitForTimeout(600);
  const boxes: Record<string, Box> = {};
  for (const [name, locator] of Object.entries(targets)) {
    const box = await locator
      .first()
      .boundingBox({ timeout: 3_000 })
      .catch(() => null);
    if (box) boxes[name] = box;
    else log(`  (no box for ${id}.${name})`);
  }
  const file = `capture/${id}.jpg`;
  await page.screenshot({
    path: join(OUT_DIR, `${id}.jpg`),
    type: 'jpeg',
    quality: 88,
    animations: 'disabled',
  });
  const shot: Shot = {
    id,
    file,
    path: new URL(page.url()).pathname,
    takenAt: new Date().toISOString(),
    boxes,
  };
  state.shots = [...state.shots.filter((s) => s.id !== id), shot];
  save();
  log(`shot ${id}`);
}

const TX_PATTERN = /explorer\.solana\.com\/tx\/([1-9A-HJ-NP-Za-km-z]{64,90})/;

async function signaturesIn(scope: Page | Locator): Promise<Set<string>> {
  const hrefs = await scope
    .locator('a[href*="explorer.solana.com/tx/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const found = new Set<string>();
  for (const href of hrefs) {
    const match = href?.match(TX_PATTERN);
    if (match?.[1]) found.add(match[1]);
  }
  return found;
}

/** Waits for a transaction link that wasn't on the page before, and returns its signature. */
async function newSignature(
  scope: Page | Locator,
  before: Set<string>,
): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    for (const signature of await signaturesIn(scope)) {
      if (!before.has(signature)) return signature;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('No new transaction link appeared');
}

/**
 * The oldest transaction touching `address`, read from devnet. For a fresh throwaway wallet
 * that is the faucet's transfer, whose success message the app replaces as soon as the
 * balance arrives.
 */
async function firstSignature(address: string): Promise<string> {
  // `confirmed`, not the default `finalized`, which trails by ~13 s; retried because the
  // public RPC's index can still lag a moment behind the app's own confirmation.
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const response = await fetch('https://api.devnet.solana.com', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [address, { limit: 20, commitment: 'confirmed' }],
      }),
    });
    const body: unknown = await response.json();
    const result: unknown =
      typeof body === 'object' && body !== null
        ? Reflect.get(body, 'result')
        : undefined;
    const oldest: unknown = Array.isArray(result) ? result.at(-1) : undefined;
    const signature: unknown =
      typeof oldest === 'object' && oldest !== null
        ? Reflect.get(oldest, 'signature')
        : undefined;
    if (typeof signature === 'string') return signature;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`No transactions found for ${address}`);
}

function record(name: TransactionName, signature: string): void {
  state.transactions[name] = signature;
  save();
  log(`tx ${name} ${signature.slice(0, 8)}…`);
}

/** Connects the scripted wallet, the way a person picks their wallet in the dialog. */
async function connect(page: Page): Promise<void> {
  const connected = page.getByRole('button', { name: 'Wallet menu' }).first();
  const open = page.getByRole('button', { name: 'Connect wallet' }).first();
  await connected.or(open).waitFor({ timeout: 60_000 });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await connected.isVisible()) return;
    try {
      await open.click({ timeout: 2_000 });
      await page
        .getByRole('button', { name: new RegExp(WALLET_NAME) })
        .first()
        .click({ timeout: 3_000 });
      await connected.waitFor({ timeout: 8_000 });
      return;
    } catch {
      // Clicked before hydration, or the dialog was still opening: look again.
      await page.keyboard.press('Escape').catch(() => undefined);
    }
  }
  throw new Error('Could not connect the scripted wallet');
}

const panelOf = (page: Page) =>
  page.getByRole('complementary', { name: 'Your actions in this pool' });

async function dismissStatus(scope: Locator): Promise<void> {
  const dismiss = scope.getByRole('button', { name: 'Dismiss' });
  if (await dismiss.isVisible()) await dismiss.click();
}

/** The transaction that created (and funded) `pool`, from the app's chain-verified feed. */
async function creationSignature(pool: string): Promise<string | null> {
  const response = await fetch(`${APP}/api/pools/${pool}`);
  const body: unknown = await response.json();
  const activity: unknown =
    typeof body === 'object' && body !== null
      ? Reflect.get(body, 'activity')
      : undefined;
  const items: unknown =
    typeof activity === 'object' && activity !== null
      ? Reflect.get(activity, 'items')
      : undefined;
  if (!Array.isArray(items)) return null;
  for (const kind of ['POOL_CREATED', 'MATCH_FUNDED']) {
    const item: unknown = items.find(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        Reflect.get(entry, 'kind') === kind,
    );
    const signature: unknown =
      typeof item === 'object' && item !== null
        ? Reflect.get(item, 'txSignature')
        : undefined;
    if (typeof signature === 'string') return signature;
  }
  return null;
}

async function sponsorPhase(browser: Browser): Promise<void> {
  const page = await openAs(browser, 'sponsor');
  log(`sponsor ${wallet('sponsor').address}`);
  // A run that got as far as creating the pool never creates a second one.
  if (!state.pool) await createPool(page);
  const pool = state.pool;
  if (!pool) throw new Error('No pool after the wizard');

  if (!state.transactions.createPool) {
    const signature = await creationSignature(pool.address);
    if (signature) record('createPool', signature);
    else log('  (the feed has no creation transaction yet)');
  }

  // Where the sponsor lands: their pool, live, before anyone has deposited.
  await page.goto(`${APP}/en/pools/${pool.address}`);
  await connect(page);
  await page.getByRole('heading', { name: POOL_NAME }).waitFor();
  await shoot(page, 'pool-new', {
    title: page.getByRole('heading', { name: POOL_NAME }),
    budget: page.getByRole('heading', { name: 'Match budget' }),
  });
  await page.context().close();
}

/**
 * Walks the sponsor wizard. With `submit: false` it stops at the review step: that re-shoots the
 * wizard's screens (same inputs) without creating a second pool.
 */
async function createPool(page: Page, submit = true): Promise<void> {
  await page.goto(`${APP}/en/pools`);
  await connect(page);
  await shoot(page, 'pools-before', {
    create: page.getByRole('link', { name: 'Create a pool' }),
  });

  await page.goto(`${APP}/en/pools/new`);
  await connect(page);
  const next = page.getByRole('button', { name: 'Continue' });

  await page.locator('#pool-name').fill(POOL_NAME);
  await page
    .locator('#pool-about')
    .fill(
      'Recorded for the AquaStock Stocklana demo video, on devnet with demo tokens that have no value.',
    );
  await shoot(
    page,
    'wizard-details',
    { name: page.locator('#pool-name'), cta: next },
    { reveal: next },
  );
  await next.click();

  await page.locator('#pool-cap').fill('50');
  await page.getByRole('button', { name: '3 minutes (demo)' }).click();
  await page
    .getByRole('button', { name: /^(60 minutes|1 hour) \(demo\)$/ })
    .click();
  await shoot(
    page,
    'wizard-rules',
    {
      match: page.locator('#pool-match'),
      vesting: page.getByRole('button', { name: '3 minutes (demo)' }),
      cta: next,
    },
    { reveal: next },
  );
  await next.click();

  const faucet = page.getByRole('button', { name: /^Get 100 dSPYx/ });
  const funded = page.getByText(/Your balance: 100(\.0+)? dSPYx/);
  await faucet.or(funded).first().waitFor({ timeout: 60_000 });
  const sent = page.getByText('Demo tokens and SOL are in your wallet.');
  if (await faucet.isVisible()) {
    await shoot(page, 'wizard-fund-empty', { faucet });
    await faucet.click();
    // The wizard swaps the offer for the budget field once the balance lands, so the
    // confirmation may only flash.
    await sent.or(funded).first().waitFor({ timeout: 60_000 });
    if (await sent.isVisible()) await shoot(page, 'wizard-fund-faucet');
  }
  await funded.waitFor({ timeout: 60_000 });
  if (!state.transactions.faucetSponsor) {
    record('faucetSponsor', await firstSignature(wallet('sponsor').address));
  }
  await page.locator('#pool-budget').fill('100');
  await page.getByText('What this buys').waitFor();
  await shoot(
    page,
    'wizard-fund',
    {
      budget: page.locator('#pool-budget'),
      reach: page.getByText('What this buys'),
      cta: next,
    },
    { reveal: next },
  );
  await next.click();

  const create = page.getByRole('button', {
    name: /^Create pool and lock 100/,
  });
  await create.waitFor();
  await shoot(
    page,
    'wizard-review',
    { cta: create, disclosure: page.getByText('Before you create') },
    { reveal: create },
  );
  if (!submit) return;
  await create.click();
  await page
    .getByRole('heading', { name: 'Your pool is live' })
    .waitFor({ timeout: 90_000 });
  const openPool = page.getByRole('link', { name: 'Open your pool' });
  const href = await openPool.getAttribute('href');
  const address = href?.match(/\/pools\/([1-9A-HJ-NP-Za-km-z]{32,44})/)?.[1];
  if (!address) throw new Error(`No pool address in ${href}`);
  // Saved before anything else can fail, so a rerun never creates a second pool.
  state.pool = { address, name: POOL_NAME, vestingSeconds: VESTING_SECONDS };
  save();
  log(`pool ${address}`);

  // The wizard asks the wallet to sign the pool's name straight away; ours signs at once.
  await page.getByText('Name published').waitFor({ timeout: 60_000 });
  await shoot(page, 'wizard-created', { open: openPool });
}

async function depositPhase(
  browser: Browser,
  role: 'saverA' | 'saverB',
): Promise<void> {
  const pool = state.pool;
  if (!pool) throw new Error('No pool yet');
  const tag = role === 'saverA' ? 'A' : 'B';
  const page = await openAs(browser, role);
  log(`saver ${tag} ${wallet(role).address}`);
  await page.goto(`${APP}/en/pools/${pool.address}`);
  await connect(page);
  const panel = panelOf(page);
  const amount = panel.locator('input[inputmode="decimal"]');
  const faucet = panel.getByRole('button', { name: /^Get 100 dSPYx/ });
  // The amount field shows while the balance loads ("Checking your balance…"); only a known
  // balance, or the faucet offer that replaces the field at zero, says which way to go.
  const knownBalance = panel.getByText(/Your balance: [\d.,]+ dSPYx/);
  await faucet.or(knownBalance).first().waitFor({ timeout: 60_000 });

  if (await faucet.isVisible()) {
    if (role === 'saverA')
      await shoot(page, 'deposit-empty', { faucet, panel });
    await faucet.click();
    const sent = panel.getByText('Demo tokens and SOL are in your wallet.');
    // As in the wizard, the deposit form replaces the offer once the balance lands.
    await sent.or(amount).first().waitFor({ timeout: 60_000 });
    if (role === 'saverA' && (await sent.isVisible())) {
      await shoot(page, 'deposit-faucet', { panel });
    }
    await dismissStatus(panel);
  }

  await panel
    .getByText(/Your balance: [1-9][\d.,]* dSPYx/)
    .waitFor({ timeout: 60_000 });
  const faucetTx = role === 'saverA' ? 'faucetSaverA' : 'faucetSaverB';
  if (!state.transactions[faucetTx]) {
    record(faucetTx, await firstSignature(wallet(role).address));
  }
  await amount.fill(DEPOSIT);
  const submit = panel.getByRole('button', {
    name: `Deposit ${DEPOSIT} dSPYx`,
  });
  await panel.getByText("What you'd lock in").waitFor();
  if (role === 'saverA') {
    await shoot(page, 'deposit-preview', {
      panel,
      preview: panel.getByText("What you'd lock in"),
      cta: submit,
    });
  }
  const before = await signaturesIn(panel);
  await submit.click();
  await panel
    .getByRole('heading', { name: 'Your position' })
    .waitFor({ timeout: 90_000 });
  state.depositedAt[role] = Date.now();
  record(
    role === 'saverA' ? 'depositA' : 'depositB',
    await newSignature(panel, before),
  );
  await shoot(page, role === 'saverA' ? 'deposit-done' : 'deposit-b-done', {
    panel,
  });
  await page.context().close();
}

/** Runs `step` once `delaySeconds` after `from` (straight away if that time has passed). */
async function at(
  from: number,
  delaySeconds: number,
  step: () => Promise<void>,
): Promise<void> {
  const wait = from + delaySeconds * 1000 - Date.now();
  if (wait > 0) {
    log(`  waiting ${Math.round(wait / 1000)}s`);
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  await step();
}

async function timelinePhase(browser: Browser): Promise<void> {
  const pool = state.pool;
  const startA = state.depositedAt.saverA;
  const startB = state.depositedAt.saverB;
  if (!pool || !startA || !startB) throw new Error('Deposits missing');
  if (Date.now() - startA > VESTING_SECONDS * 1000) {
    log('warning: the vesting window has passed; shots will show it complete');
  }

  const saverA = await openAs(browser, 'saverA');
  const saverB = await openAs(browser, 'saverB');
  const poolUrl = `${APP}/en/pools/${pool.address}`;

  const vestShot = async (index: number) => {
    await saverA.goto(poolUrl);
    await connect(saverA);
    const panel = panelOf(saverA);
    await panel.getByRole('heading', { name: 'Your position' }).waitFor();
    await shoot(saverA, `vest-${index}`, { panel });
  };
  const myMatchShot = async (id: string) => {
    await saverA.goto(`${APP}/en/my-match`);
    await connect(saverA);
    await saverA
      .getByRole('heading', { name: 'Your positions' })
      .waitFor({ timeout: 60_000 });
    await saverA.getByText('Match reserved').first().waitFor();
    await shoot(saverA, id, {
      summary: saverA.getByText('Totals across your pools'),
      claim: saverA.getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ }),
    });
  };

  await at(startA, 12, () => vestShot(1));
  await at(startA, 30, () => myMatchShot('mymatch-early'));
  await at(startA, 50, () => vestShot(2));

  // Saver B leaves about a third of the way through their vesting.
  const withdrawn = Boolean(state.transactions.withdrawB);
  await at(startB, withdrawn ? 0 : 60, async () => {
    if (withdrawn) return;
    await saverB.goto(poolUrl);
    await connect(saverB);
    const panel = panelOf(saverB);
    await panel.getByRole('button', { name: 'Withdraw deposit' }).click();
    const dialog = saverB.getByRole('dialog', {
      name: 'Withdraw your deposit?',
    });
    await dialog.getByText('Match you give up', { exact: true }).waitFor();
    const confirm = dialog.getByRole('button', { name: /^Withdraw / });
    await shoot(saverB, 'withdraw-preview', { dialog, cta: confirm });
    const before = await signaturesIn(panel);
    await confirm.click();
    await panel
      .getByText('Withdrawn. Your deposit is back in your wallet.')
      .waitFor({ timeout: 90_000 });
    record('withdrawB', await newSignature(panel, before));
    await shoot(saverB, 'withdraw-done', { panel });
  });

  await at(startA, 100, () => vestShot(3));
  const claimed = Boolean(state.transactions.claimA);
  await at(startA, claimed ? 0 : 125, async () => {
    if (claimed) return;
    await myMatchShot('mymatch-claim');
    const claim = saverA
      .getByRole('button', { name: /^Claim [\d.,]+ dSPYx/ })
      .first();
    const before = await signaturesIn(saverA);
    await claim.click();
    await saverA
      .getByText('Claimed. The tokens are in your wallet.')
      .waitFor({ timeout: 90_000 });
    record('claimA', await newSignature(saverA, before));
    await shoot(saverA, 'claim-done', {
      summary: saverA.getByText('Totals across your pools'),
    });
  });
  await at(startA, VESTING_SECONDS + 8, () => vestShot(4));

  await saverA.context().close();
  await saverB.context().close();
}

async function wrapupPhase(browser: Browser): Promise<void> {
  const pool = state.pool;
  if (!pool) throw new Error('No pool yet');
  const page = await openAs(browser, 'sponsor');
  await page.goto(`${APP}/en/pools/${pool.address}`);
  await connect(page);
  await page.getByRole('heading', { name: pool.name }).waitFor();
  await shoot(page, 'pool-after', {
    budget: page.getByRole('heading', { name: 'Match budget' }),
  });

  const issuer = page.getByRole('heading', { name: 'What you actually own' });
  await issuer.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -24));
  await shoot(page, 'pool-issuer', { heading: issuer });

  const activity = page.getByRole('heading', { name: 'Activity', exact: true });
  await activity.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -24));
  await shoot(page, 'pool-activity', { heading: activity });

  await page.goto(`${APP}/en/pools`);
  await page.getByText(pool.name).first().waitFor();
  await shoot(page, 'pools-after', { card: page.getByText(pool.name) });

  const deposit = state.transactions.depositA;
  if (deposit) {
    await page.goto(`https://explorer.solana.com/tx/${deposit}?cluster=devnet`);
    const success = page.getByText(/^\s*success\s*$/i).first();
    await success.waitFor({ timeout: 60_000 }).catch(() => {
      log('  Explorer did not show "Success" in time; shooting what it shows');
    });
    await page.waitForTimeout(2_000);
    await shoot(page, 'explorer-deposit', { result: success });
  }
  await page.context().close();
}

/**
 * Checks the signer before anything spends faucet budget: offline against hand-built legacy and
 * v0 transactions, then through the page, the way the app reaches the wallet.
 */
async function selfTest(browser: Browser): Promise<void> {
  const probe = newWallet();
  for (const versioned of [false, true]) {
    const message = Buffer.concat([
      Buffer.from(versioned ? [0x80, 1, 0, 1, 2] : [1, 0, 1, 2]),
      probe.publicKey,
      randomBytes(32), // another account
      randomBytes(32), // blockhash
      Buffer.from(versioned ? [0, 0] : [0]), // no instructions (and no lookups)
    ]);
    const wire = Buffer.concat([Buffer.from([1]), Buffer.alloc(64), message]);
    const signed = signTransaction(probe, wire);
    const signature = signed.subarray(1, 65);
    const ok = verify(
      null,
      message,
      { key: probe.jwk, format: 'jwk' },
      signature,
    );
    if (!ok) throw new Error(`Signer self-test failed (v0: ${versioned})`);
  }

  const page = await openAs(browser, 'sponsor');
  await page.goto(`${APP}/en/pools`);
  await connect(page);
  const text = 'AquaStock capture self-test';
  const signatureB64 = await page.evaluate(async (message) => {
    let found: unknown;
    window.dispatchEvent(
      new CustomEvent('wallet-standard:app-ready', {
        detail: { register: (...wallets: unknown[]) => (found = wallets[0]) },
      }),
    );
    const feature: unknown =
      found &&
      Reflect.get(Reflect.get(found, 'features'), 'solana:signMessage');
    const signMessage: unknown = feature && Reflect.get(feature, 'signMessage');
    if (typeof signMessage !== 'function') return null;
    const [output] = await signMessage({
      message: new TextEncoder().encode(message),
    });
    return btoa(String.fromCharCode(...Reflect.get(output, 'signature')));
  }, text);
  if (!signatureB64)
    throw new Error('The page did not see the scripted wallet');
  const ok = verify(
    null,
    Buffer.from(text),
    { key: wallet('sponsor').jwk, format: 'jwk' },
    Buffer.from(signatureB64, 'base64'),
  );
  if (!ok) throw new Error('In-page message signing failed its check');
  await page.context().close();
  log('signer self-test passed');
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  if (process.argv.includes('--self-test')) {
    try {
      await selfTest(browser);
    } finally {
      await browser.close();
    }
    return;
  }
  const phases: [Phase, () => Promise<void>][] = [
    ['sponsor', () => sponsorPhase(browser)],
    ['depositA', () => depositPhase(browser, 'saverA')],
    ['depositB', () => depositPhase(browser, 'saverB')],
    ['timeline', () => timelinePhase(browser)],
    ['wrapup', () => wrapupPhase(browser)],
  ];
  try {
    await selfTest(browser);
    if (process.argv.includes('--retake-wizard')) {
      // Re-shoots the wizard with the same inputs, stopping before "Create", for a run whose
      // pool already exists. The sponsor wallet needs 100 dSPYx for the fund step.
      const page = await openAs(browser, 'sponsor');
      await createPool(page, false);
      await page.context().close();
      log('wizard re-shot');
      return;
    }
    for (const [phase, run] of phases) {
      if (state.done.includes(phase)) {
        log(`skip ${phase} (done)`);
        continue;
      }
      log(`phase ${phase}`);
      await run();
      state.done.push(phase);
      save();
    }
    log('capture complete');
  } finally {
    await browser.close();
  }
}

await main();
