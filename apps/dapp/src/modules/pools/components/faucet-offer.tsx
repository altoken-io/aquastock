'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { CircleCheck, Droplets, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { FaucetInfoDto } from '@aquastock/types';

import { cn } from '@/utils/classNames';

import { useFaucet } from '../hooks/use-faucet';
import { ApiClientError } from '../lib/api-client';
import { faucetErrorKey, type FaucetErrorKey } from '../lib/faucet';
import { useFormatters, useToken } from '../token-context';
import { ActionButton } from './actions';

export type FaucetOfferState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'sent'; signature: string }
  | { phase: 'error'; error: FaucetErrorKey };

/**
 * Offers demo tokens and fee SOL to a connected wallet on a demo network. Renders nothing on
 * a deployment without a faucet, which includes every mainnet deployment.
 */
export function FaucetOffer({ className }: { className?: string }) {
  const token = useToken();
  // Checked before touching the wallet, so no faucet means no wallet or query hooks at all.
  if (!token.faucet) return null;
  return (
    <ConnectedFaucetOffer
      className={className}
      info={token.faucet}
      symbol={token.symbol}
    />
  );
}

function ConnectedFaucetOffer({
  info,
  symbol,
  className,
}: {
  info: FaucetInfoDto;
  symbol: string;
  className?: string;
}) {
  const { publicKey } = useWallet();
  const faucet = useFaucet();
  if (!publicKey) return null;
  const wallet = publicKey.toBase58();

  const state: FaucetOfferState = faucet.isPending
    ? { phase: 'sending' }
    : faucet.isSuccess
      ? { phase: 'sent', signature: faucet.data.signature }
      : faucet.isError
        ? {
            phase: 'error',
            error: faucetErrorKey(
              faucet.error instanceof ApiClientError
                ? faucet.error.code
                : 'unknown',
            ),
          }
        : { phase: 'idle' };

  return (
    <FaucetOfferView
      className={className}
      info={info}
      symbol={symbol}
      state={state}
      onRequest={() => faucet.mutate(wallet)}
    />
  );
}

export function FaucetOfferView({
  info,
  symbol,
  state,
  onRequest,
  className,
}: {
  info: FaucetInfoDto;
  symbol: string;
  state: FaucetOfferState;
  onRequest: () => void;
  className?: string;
}) {
  const t = useTranslations('faucet');
  const f = useFormatters();

  if (state.phase === 'sent') {
    return (
      <div
        role="status"
        className={cn(
          'dapp-enter flex items-start gap-2.5 rounded-lg border border-ok/30 bg-ok/10 p-3 text-sm',
          className,
        )}
      >
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-ok" />
        <div className="min-w-0">
          <p className="font-medium text-foreground">{t('sent')}</p>
          <a
            href={f.explorer('tx', state.signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            {t('viewTx')}
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'dapp-enter rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Droplets aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{t('title')}</p>
          <p className="mt-0.5 text-muted-foreground">
            {t('body', { tokens: info.tokens, symbol, sol: info.sol })}
          </p>
          <ActionButton
            className="mt-2.5 h-9 px-3"
            onClick={onRequest}
            disabled={state.phase === 'sending'}
            aria-busy={state.phase === 'sending'}
          >
            {state.phase === 'sending'
              ? t('sending')
              : t('request', { tokens: info.tokens, symbol })}
          </ActionButton>
          {state.phase === 'error' ? (
            <p role="alert" className="mt-2 text-destructive">
              {t(`errors.${state.error}`)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
