'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useTranslations } from 'next-intl';
import { useId, useMemo, useState } from 'react';

import type { PoolDto } from '@aquastock/types';

import {
  AmountError,
  uiToRaw,
  type AmountErrorCode,
} from '@/lib/solana/amounts';

import { useTokenBalance } from '../hooks/queries';
import { useNow } from '../hooks/use-now';
import { useMatchPoolsProgram } from '../hooks/use-program';
import { amountForParsing } from '../lib/amount-input';
import { useFormatters, useToken } from '../token-context';
import { buildFundMatch, buildReclaim } from '../tx/builders';
import type { PoolTx } from '../tx/use-pool-transaction';
import { ActionButton } from './actions';
import { AmountField } from './amount-field';
import { Notice } from './notice';
import { LedgerRow, StreamTag } from './stream-legend';

type FundProblem = AmountErrorCode | 'insufficient-balance' | 'paused';

type FundCheck =
  | { status: 'empty' }
  | { status: 'invalid'; reason: AmountErrorCode | 'insufficient-balance' }
  | { status: 'ok'; amountRaw: bigint };

/** The sponsor's controls: grow the match budget while the pool is open, reclaim what is left after. */
export function SponsorPanel({
  pool,
  serverNow,
  tx,
}: {
  pool: PoolDto;
  serverNow: number;
  tx: PoolTx;
}) {
  const t = useTranslations('sponsor');
  const token = useToken();
  const f = useFormatters();
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
  const balanceRaw = balanceQuery.isSuccess ? (balanceQuery.data ?? 0n) : null;

  const ended = now >= pool.endsAt;
  const unreserved = BigInt(pool.unreserved);
  const symbol = token.symbol;

  const check = useMemo<FundCheck>(() => {
    const text = amountForParsing(input);
    if (text.trim() === '') return { status: 'empty' };
    try {
      const amountRaw = uiToRaw(text, token.decimals, token.multiplier, 'up');
      if (balanceRaw !== null && amountRaw > balanceRaw) {
        return { status: 'invalid', reason: 'insufficient-balance' };
      }
      return { status: 'ok', amountRaw };
    } catch (error) {
      if (error instanceof AmountError)
        return { status: 'invalid', reason: error.code };
      throw error;
    }
  }, [input, token.decimals, token.multiplier, balanceRaw]);

  const problemKey: FundProblem | null = token.paused
    ? 'paused'
    : check.status === 'invalid'
      ? check.reason
      : null;
  const problem =
    problemKey === null
      ? null
      : t(`problems.${problemKey}`, {
          symbol,
          decimals: token.decimals,
          balance: f.tokens(balanceRaw ?? 0n, { rounding: 'down' }),
        });

  const context = () => {
    if (!publicKey || !program || !token.mint) return null;
    return {
      program,
      pool: new PublicKey(pool.address),
      mint: new PublicKey(token.mint),
      sponsor: publicKey,
    };
  };

  const fund = () => {
    const c = context();
    if (!c || check.status !== 'ok') return;
    const { amountRaw } = check;
    void tx
      .run('fund', () => buildFundMatch({ ...c, amountRaw }), {
        poolAddress: pool.address,
      })
      .then((signature) => {
        if (signature) setInput('');
      });
  };

  const reclaim = () => {
    const c = context();
    if (!c) return;
    void tx.run('reclaim', () => buildReclaim(c), {
      poolAddress: pool.address,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{t('title')}</h2>
        <StreamTag stream="sponsor">{t('role')}</StreamTag>
      </div>

      <dl>
        <LedgerRow
          stream="sponsor"
          label={t('summary.total')}
          value={`${f.tokens(pool.budgetTotal)} ${symbol}`}
          emphasis
        />
        <LedgerRow
          label={t('summary.reserved')}
          value={`${f.tokens(pool.reserved)} ${symbol}`}
        />
        <LedgerRow
          label={t('summary.available')}
          value={`${f.tokens(pool.unreserved)} ${symbol}`}
        />
      </dl>

      <section
        className="border-t border-border/60 pt-5"
        aria-labelledby={`${fieldId}-fund`}
      >
        <h3 id={`${fieldId}-fund`} className="text-base font-semibold">
          {t('fund.title')}
        </h3>
        {ended ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t('fund.closed')}
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {t('fund.description')}
            </p>
            <AmountField
              id={fieldId}
              label={t('fund.field')}
              value={input}
              onChange={setInput}
              symbol={symbol}
              disabled={tx.busy || token.paused}
              invalid={problem !== null}
              describedBy={problem ? problemId : undefined}
              hint={
                balanceRaw === null
                  ? undefined
                  : `${t('summary.balance')}: ${f.tokens(balanceRaw, { rounding: 'down' })} ${symbol}`
              }
            />
            <p
              id={problemId}
              className="-mt-1 min-h-5 text-sm text-destructive"
              role={problem ? 'alert' : undefined}
            >
              {problem}
            </p>
            <ActionButton
              className="h-11 w-full"
              onClick={fund}
              disabled={
                check.status !== 'ok' || tx.busy || token.paused || !program
              }
            >
              {check.status === 'ok'
                ? t('fund.submit', {
                    amount: f.tokens(check.amountRaw),
                    symbol,
                  })
                : t('fund.submitIdle')}
            </ActionButton>
          </div>
        )}
      </section>

      <section className="border-t border-border/60 pt-5">
        <h3 className="text-base font-semibold">{t('reclaim.title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('reclaim.description')}
        </p>
        <div className="mt-3">
          {!ended ? (
            <Notice>
              {t('reclaim.waiting', { date: f.dateTime(pool.endsAt) })}
            </Notice>
          ) : unreserved === 0n ? (
            <Notice>{t('reclaim.nothing')}</Notice>
          ) : (
            <ActionButton
              variant="secondary"
              className="h-11 w-full"
              disabled={tx.busy || token.paused || !program}
              onClick={reclaim}
            >
              {t('reclaim.button', { amount: f.tokens(unreserved), symbol })}
            </ActionButton>
          )}
        </div>
      </section>
    </div>
  );
}
