import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isCaptureManifest } from './capture-manifest.ts';

const valid = {
  capturedAt: '2026-09-24T19:09:08.025Z',
  app: 'https://aquastock-dapp.vercel.app',
  network: 'devnet',
  viewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
  pool: { address: 'Pool1111', name: 'Video demo', vestingSeconds: 180 },
  wallets: { sponsor: 'S', saverA: 'A', saverB: 'B' },
  transactions: { depositA: 'sig' },
  shots: [
    {
      id: 'deposit-done',
      file: 'capture/deposit-done.jpg',
      path: '/en/pools/Pool1111',
      takenAt: '2026-09-24T19:05:50.000Z',
      boxes: { panel: { x: 753, y: -121, width: 487, height: 786 } },
    },
  ],
};

test('accepts a manifest the capture writes', () => {
  assert.equal(isCaptureManifest(valid), true);
});

test('rejects a manifest from another network or with broken parts', () => {
  assert.equal(isCaptureManifest({ ...valid, network: 'mainnet' }), false);
  assert.equal(isCaptureManifest({ ...valid, shots: [{ id: 'x' }] }), false);
  assert.equal(
    isCaptureManifest({
      ...valid,
      shots: [{ ...valid.shots[0], boxes: { panel: { x: 'left' } } }],
    }),
    false,
  );
  assert.equal(
    isCaptureManifest({ ...valid, transactions: { depositA: 42 } }),
    false,
  );
  assert.equal(isCaptureManifest(null), false);
  assert.equal(isCaptureManifest('manifest'), false);
});
