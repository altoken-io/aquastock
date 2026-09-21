'use client';

import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  LoaderCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { TxState } from '../tx/use-pool-transaction';
import { useFormatters } from '../token-context';
import { ActionButton } from './actions';

/**
 * Where the current transaction is, in words a person can act on. The live region is always
 * mounted so screen readers announce each change; only errors use the assertive `alert` role.
 */
export function TxStatus({
  state,
  onDismiss,
}: {
  state: TxState;
  onDismiss: () => void;
}) {
  const t = useTranslations('tx');
  const f = useFormatters();

  const link = (signature: string) => (
    <a
      href={f.explorer('tx', signature)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
    >
      {t('status.viewTx')}
      <ExternalLink aria-hidden className="size-3.5" />
    </a>
  );

  return (
    <div aria-live="polite" className="empty:hidden">
      {state.phase === 'signing' || state.phase === 'confirming' ? (
        <div className="dapp-enter flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-3 text-sm">
          <LoaderCircle
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-primary motion-safe:animate-spin"
          />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {state.phase === 'signing'
                ? t('status.signing')
                : t('status.confirming')}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {state.phase === 'signing'
                ? t('status.signingHint')
                : t('status.confirmingHint')}
            </p>
            {state.phase === 'confirming' ? (
              <p className="mt-1">{link(state.signature)}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {state.phase === 'done' ? (
        <div className="dapp-enter flex items-start gap-3 rounded-lg border border-ok/30 bg-ok/10 p-3 text-sm">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-ok" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">
              {t(`done.${state.action}`)}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {link(state.signature)}
              <button
                type="button"
                onClick={onDismiss}
                className="text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t('status.dismiss')}
              </button>
            </p>
          </div>
        </div>
      ) : null}

      {state.phase === 'error' ? (
        <div
          role="alert"
          className="dapp-enter flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          <CircleAlert
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">{t('errors.title')}</p>
            <p className="mt-0.5 text-muted-foreground">
              {state.error.kind === 'program'
                ? t(`errors.program.${state.error.code}`)
                : t(`errors.kinds.${state.error.kind}`)}
            </p>
            <div className="mt-2">
              <ActionButton
                variant="secondary"
                className="h-8 px-3"
                onClick={onDismiss}
              >
                {t('status.dismiss')}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
