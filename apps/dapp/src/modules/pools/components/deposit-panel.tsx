'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useMemo, useState } from 'react';

import type { PoolDto } from '@aquastock/types';

import { rawToUi, type AmountErrorCode } from '@/lib/solana/amounts';

import { useTokenBalance } from '../hooks/queries';
import { useNow } from '../hooks/use-now';
import { useMatchPoolsProgram } from '../hooks/use-program';
import { amountForParsing } from '../lib/amount-input';
import {
  previewDepositInput,
  type BlockedReason,
} from '../lib/deposit-preview';
import { formatDuration, isMainnet, toIntlLocale } from '../lib/format';
import { useFormatters, useToken } from '../token-context';
import { buildDeposit } from '../tx/builders';
import type { PoolTx } from '../tx/use-pool-transaction';
import { ActionButton } from './actions';
import { AmountField } from './amount-field';
import { Notice } from './notice';
import { LedgerRow } from './stream-legend';

/** Reasons that stop a deposit before anything is typed: no point showing a form. */
const HARD_BLOCKS: ReadonlySet<BlockedReason> = new Set([
  'ended',
  'paused',
  'transfer-hook',
]);

export function DepositPanel({
  pool,
  serverNow,
  tx,
}: {
  pool: PoolDto;
  serverNow: number;
  tx: PoolTx;
}) {
  const t = useTranslations('deposit');
  const token = useToken();
  const f = useFormatters();
  const locale = toIntlLocale(useLocale());
  const { publicKey } = useWallet();
  const program = useMatchPoolsProgram();
  const now = useNow(serverNow);
  const fieldId = useId();
  const problemId = useId();
  const [input, setInput] = useState('');

  const balanceQuery = useTokenBalance(
    token.mint,
    publicKey?.toBase58() ?? null,
  );
  // No token account at all means a zero balance; an unread balance is unknown, not zero.
  const balanceRaw = balanceQuery.isSuccess ? (balanceQuery.data ?? 0n) : null;

  const preview = useMemo(
    () =>
      previewDepositInput(amountForParsing(input), {
        pool,
        decimals: token.decimals,
        multiplier: token.multiplier,
        balanceRaw,
        paused: token.paused,
        transferHookEnabled: token.transferHookEnabled,
        now,
      }),
    [input, pool, token, balanceRaw, now],
  );

  const budgetExhausted = BigInt(pool.unreserved) === 0n;
  const problemKey: AmountErrorCode | BlockedReason | null =
    preview.status === 'invalid' || preview.status === 'blocked'
      ? preview.reason
      : budgetExhausted
        ? 'budget-exhausted'
        : null;
  const hardBlocked =
    (preview.status === 'blocked' && HARD_BLOCKS.has(preview.reason)) ||
    budgetExhausted;
  const problem =
    problemKey === null
      ? null
      : t(`problems.${problemKey}`, {
          symbol: token.symbol,
          decimals: token.decimals,
          cap: f.tokens(pool.perSaverCap),
          balance: f.tokens(balanceRaw ?? 0n, { rounding: 'down' }),
        });

  const duration = formatDuration(pool.vestingSeconds, locale);
  const capRaw = BigInt(pool.perSaverCap);
  const maxRaw =
    balanceRaw === null ? null : balanceRaw < capRaw ? balanceRaw : capRaw;
  const noBalance = balanceRaw === 0n;

  const submit = () => {
    if (preview.status !== 'ok' || !publicKey || !program || !token.mint)
      return;
    const mint = new PublicKey(token.mint);
    void tx.run(
      'deposit',
      () =>
        buildDeposit({
          program,
          pool: new PublicKey(pool.address),
          mint,
          saver: publicKey,
          amountRaw: preview.amountRaw,
          // The program reverts rather than match less than the person just saw.
          minMatchRaw: preview.matchedRaw,
        }),
      { poolAddress: pool.address },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold">
          {t('title', { symbol: token.symbol })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle', { percent: f.percent(pool.matchBps), duration })}
        </p>
      </div>

      {hardBlocked && problem ? (
        <Notice tone="warning">{problem}</Notice>
      ) : noBalance ? (
        <Notice>
          <p className="font-medium">
            {t('noBalance.title', { symbol: token.symbol })}
          </p>
          <p className="mt-0.5 text-muted-foreground">{t('noBalance.body')}</p>
          {isMainnet(token.network) && token.mint ? (
            <a
              href={`https://jup.ag/swap/SOL-${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {t('noBalance.buy', { symbol: token.symbol })}
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          ) : (
            <p className="mt-1.5 text-muted-foreground">
              {t('noBalance.demo')}
            </p>
          )}
        </Notice>
      ) : (
        <>
          <AmountField
            id={fieldId}
            label={t('field.label')}
            value={input}
            onChange={setInput}
            symbol={token.symbol}
            disabled={tx.busy}
            invalid={problem !== null}
            describedBy={problem ? problemId : undefined}
            hint={
              balanceRaw === null
                ? t('field.balanceLoading')
                : t('field.balance', {
                    amount: f.tokens(balanceRaw, { rounding: 'down' }),
                    symbol: token.symbol,
                  })
            }
            max={{
              label: t('field.maxLabel'),
              text: t('field.max'),
              disabled: maxRaw === null || maxRaw === 0n,
              onClick: () => {
                if (maxRaw !== null) {
                  setInput(rawToUi(maxRaw, token.decimals, token.multiplier));
                }
              },
            }}
          />
          <p
            id={problemId}
            className="-mt-2 min-h-5 text-sm text-destructive"
            role={problem ? 'alert' : undefined}
          >
            {problem}
          </p>
          <p className="-mt-3 text-xs text-muted-foreground">
            {t('field.cap', {
              amount: f.tokens(pool.perSaverCap),
              symbol: token.symbol,
            })}
          </p>

          {preview.status === 'ok' ? (
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-2">
              <p className="pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('preview.title')}
              </p>
              <dl>
                <LedgerRow
                  stream="saver"
                  label={t('preview.deposit')}
                  value={`${f.tokens(preview.amountRaw)} ${token.symbol}`}
                />
                <LedgerRow
                  stream="sponsor"
                  label={t('preview.match')}
                  value={`${f.tokens(preview.matchedRaw)} ${token.symbol}`}
                  emphasis
                />
              </dl>
              <p className="pb-2 text-xs text-muted-foreground">
                {t('preview.matchHint', { duration })}
              </p>
            </div>
          ) : null}
          {preview.status === 'ok' && preview.partial ? (
            <Notice tone="warning">
              {t('preview.partial', {
                matched: f.tokens(preview.matchedRaw),
                wanted: f.tokens(preview.wantedRaw),
                symbol: token.symbol,
              })}
            </Notice>
          ) : null}

          <ActionButton
            className="h-11 w-full"
            onClick={submit}
            disabled={preview.status !== 'ok' || tx.busy || !program}
          >
            {preview.status === 'ok'
              ? t('submit', {
                  amount: f.tokens(preview.amountRaw),
                  symbol: token.symbol,
                })
              : t('submitIdle')}
          </ActionButton>
        </>
      )}

      <p className="text-xs text-muted-foreground">{t('terms')}</p>
    </div>
  );
}
