// The contract between `capture/capture.ts`, which records the live devnet app, and the video,
// which animates those recordings. Everything in a manifest came from a real run: screenshots,
// element positions, transaction signatures and addresses.

/** A rectangle in CSS pixels, relative to the captured viewport's top-left corner. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Shot {
  /** Stable name the scenes look a shot up by, e.g. `wizard-review`. */
  id: string;
  /** Image path relative to `public/`. */
  file: string;
  /** The app path in the browser's address bar when the shot was taken. */
  path: string;
  takenAt: string;
  /** Named regions of interest: the button about to be pressed, a panel to zoom to. */
  boxes: Record<string, Box>;
}

export type TransactionName =
  | 'faucetSponsor'
  | 'createPool'
  | 'faucetSaverA'
  | 'depositA'
  | 'faucetSaverB'
  | 'depositB'
  | 'withdrawB'
  | 'claimA';

export interface CaptureManifest {
  capturedAt: string;
  /** Origin of the app that was recorded. */
  app: string;
  network: 'devnet';
  viewport: { width: number; height: number; deviceScaleFactor: number };
  pool: { address: string; name: string; vestingSeconds: number };
  wallets: { sponsor: string; saverA: string; saverB: string };
  transactions: Partial<Record<TransactionName, string>>;
  shots: Shot[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function isBox(value: unknown): value is Box {
  return (
    isObject(value) &&
    isNumber(value.x) &&
    isNumber(value.y) &&
    isNumber(value.width) &&
    isNumber(value.height)
  );
}

function isShot(value: unknown): value is Shot {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.file === 'string' &&
    typeof value.path === 'string' &&
    typeof value.takenAt === 'string' &&
    isObject(value.boxes) &&
    Object.values(value.boxes).every(isBox)
  );
}

export function isCaptureManifest(value: unknown): value is CaptureManifest {
  if (!isObject(value)) return false;
  const { viewport, pool, wallets, transactions, shots } = value;
  return (
    typeof value.capturedAt === 'string' &&
    typeof value.app === 'string' &&
    value.network === 'devnet' &&
    isObject(viewport) &&
    isNumber(viewport.width) &&
    isNumber(viewport.height) &&
    isNumber(viewport.deviceScaleFactor) &&
    isObject(pool) &&
    typeof pool.address === 'string' &&
    typeof pool.name === 'string' &&
    isNumber(pool.vestingSeconds) &&
    isObject(wallets) &&
    ['sponsor', 'saverA', 'saverB'].every(
      (key) => typeof wallets[key] === 'string',
    ) &&
    isObject(transactions) &&
    Object.values(transactions).every((sig) => typeof sig === 'string') &&
    Array.isArray(shots) &&
    shots.every(isShot)
  );
}
