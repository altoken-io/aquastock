'use client';

import { useLocale } from 'next-intl';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type {
  DeploymentDto,
  FaucetInfoDto,
  IssuerPowersDto,
} from '@aquastock/types';

import { useDeployment } from './hooks/queries';
import { env } from '@/lib/env/client';

import {
  explorerUrl,
  formatTokens,
  toIntlLocale,
  type ExplorerKind,
} from './lib/format';

const RPC_URL =
  env('NEXT_PUBLIC_SOLANA_RPC_URL', true) ?? 'http://127.0.0.1:8899';

export interface TokenInfo {
  /** The deployed Match Pools program; null until the deployment has been read. */
  programId: string | null;
  mint: string | null;
  decimals: number;
  symbol: string;
  multiplier: string;
  paused: boolean;
  transferHookEnabled: boolean;
  issuer: IssuerPowersDto | null;
  /** Who can change the program's code. Disclosed wherever a sponsor commits funds. */
  upgradeAuthority: string | null;
  network: string;
  /** The demo faucet's terms; null when this deployment has none (always on mainnet). */
  faucet: FaucetInfoDto | null;
  /** False until the deployment has been read at least once. */
  ready: boolean;
}

const FALLBACK: TokenInfo = {
  programId: null,
  mint: null,
  decimals: 8,
  symbol: 'SPYx',
  multiplier: '1',
  paused: false,
  transferHookEnabled: false,
  issuer: null,
  upgradeAuthority: null,
  network: 'localnet',
  faucet: null,
  ready: false,
};

const TokenContext = createContext<TokenInfo>(FALLBACK);

/** Live token facts for the pool token: symbol, decimals, the display multiplier, pause state. */
export function TokenProvider({
  initial,
  children,
}: {
  initial?: DeploymentDto;
  children: ReactNode;
}) {
  const { data } = useDeployment(initial);
  const value = useMemo<TokenInfo>(() => {
    if (!data) return FALLBACK;
    const issuer = data.issuer;
    return {
      programId: data.programId,
      mint: data.allowedMint ?? issuer?.mint ?? null,
      decimals: issuer?.decimals ?? FALLBACK.decimals,
      symbol: issuer?.symbol ?? FALLBACK.symbol,
      multiplier: issuer?.multiplier ?? FALLBACK.multiplier,
      paused: issuer?.paused ?? false,
      transferHookEnabled: issuer?.transferHookProgram != null,
      issuer,
      upgradeAuthority: data.upgradeAuthority,
      network: data.network,
      faucet: data.faucet ?? null,
      ready: true,
    };
  }, [data]);
  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

export function useToken(): TokenInfo {
  return useContext(TokenContext);
}

/** Locale-aware formatters bound to the current token and language. */
export function useFormatters() {
  const locale = toIntlLocale(useLocale());
  const token = useToken();
  return useMemo(
    () => ({
      locale,
      /**
       * Raw units as a wallet would show them, without the symbol. Rounds to nearest; use
       * `rounding: 'down'` for a balance the person may type back into an input.
       */
      tokens: (
        raw: bigint | string,
        options?: { minFractionDigits?: number; rounding?: 'nearest' | 'down' },
      ): string =>
        formatTokens(
          typeof raw === 'string' ? BigInt(raw) : raw,
          token.decimals,
          token.multiplier,
          locale,
          options,
        ),
      /**
       * Amounts as typed (10^decimals per token, multiplier 1), for arithmetic on what a person
       * entered rather than on what the chain will hold.
       */
      units: (value: bigint): string =>
        formatTokens(value, token.decimals, '1', locale),
      explorer: (kind: ExplorerKind, id: string): string =>
        explorerUrl(token.network, kind, id, RPC_URL),
      percent: (basisPoints: number): string =>
        new Intl.NumberFormat(locale, {
          style: 'percent',
          maximumFractionDigits: 2,
        }).format(basisPoints / 10_000),
      fraction: (value: number): string =>
        new Intl.NumberFormat(locale, {
          style: 'percent',
          maximumFractionDigits: 0,
        }).format(value),
      dateTime: (unixSeconds: number): string =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(unixSeconds * 1_000)),
      date: (unixSeconds: number): string =>
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
          new Date(unixSeconds * 1_000),
        ),
    }),
    [locale, token.decimals, token.multiplier, token.network],
  );
}
