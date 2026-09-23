import { expect, test } from '@playwright/test';
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

import { readStack } from './support';

// The faucet against a real validator: a real transfer, balances read back from the chain.
// It is an API flow, so it runs once rather than per viewport.
test.beforeEach(() => {
  test.skip(
    test.info().project.name !== 'desktop',
    'API flow; one viewport is enough',
  );
});

const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

test('the deployment advertises the demo faucet', async ({ request }) => {
  const response = await request.get('/api/deployment');
  expect(response.ok()).toBe(true);
  expect((await response.json()).faucet).toEqual({
    tokens: '100',
    sol: '0.02',
  });
});

test('a fresh wallet gets demo tokens and fee SOL once, on-chain', async ({
  request,
}) => {
  const { mint } = readStack();
  const wallet = Keypair.generate().publicKey;

  const first = await request.post('/api/faucet', {
    data: { wallet: wallet.toBase58() },
  });
  expect(first.status()).toBe(200);
  const sent = await first.json();
  expect(sent.lamports).toBe('20000000');
  expect(BigInt(sent.tokensRaw)).toBeGreaterThan(0n);

  // What the API says it sent is what the chain holds.
  expect(await connection.getBalance(wallet)).toBe(20_000_000);
  const ata = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const balance = await connection.getTokenAccountBalance(ata);
  expect(balance.value.amount).toBe(sent.tokensRaw);

  // Now it has enough: a second request sends nothing.
  const second = await request.post('/api/faucet', {
    data: { wallet: wallet.toBase58() },
  });
  expect(second.status()).toBe(409);
  expect((await second.json()).error.code).toBe('already_funded');
});

test('the faucet refuses addresses nobody can spend from', async ({
  request,
}) => {
  const { pool } = readStack();
  const response = await request.post('/api/faucet', {
    data: { wallet: pool },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error.code).toBe('invalid_wallet');
});
