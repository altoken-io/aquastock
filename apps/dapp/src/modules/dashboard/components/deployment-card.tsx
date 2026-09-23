import type { ReactNode } from 'react';

import type { DeploymentDto } from '@aquastock/types';

import { cn } from '@/utils/classNames';

export interface DeploymentLabels {
  network: string;
  program: string;
  upgradeAuthority: string;
  upgradeNone: string;
  token: string;
  transfers: string;
  live: string;
  paused: string;
  multiplier: string;
  pauseAuthority: string;
  freezeAuthority: string;
  permanentDelegate: string;
  none: string;
  notInitialized: string;
  unavailable: string;
  faucet: string;
  faucetOff: string;
  faucetLow: string;
  faucetUnreadable: string;
}

/** The demo faucet as the console shows it; amounts already formatted. */
export type FaucetRow =
  | { state: 'off' }
  | { state: 'unreadable' }
  | { state: 'ok'; address: string; balance: string; low: boolean };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-all text-foreground sm:text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * The deployment's facts, all read from the chain: which program and token this is, who can
 * upgrade the program, and what the token's issuer can do. The same disclosure savers and
 * sponsors see, in one place for the operator.
 */
export function DeploymentCard({
  deployment,
  labels,
  explorer,
  faucet = null,
}: {
  deployment: DeploymentDto | null;
  labels: DeploymentLabels;
  /** Null hides the row (mainnet has no faucet). */
  faucet?: FaucetRow | null;
  /** A link to an address on the network's explorer. */
  explorer: (kind: 'address', id: string) => string;
}) {
  if (!deployment) {
    return (
      <p className="text-sm text-muted-foreground">{labels.unavailable}</p>
    );
  }
  const { issuer } = deployment;

  const address = (value: string | null): ReactNode =>
    value ? (
      <a
        href={explorer('address', value)}
        target="_blank"
        rel="noopener noreferrer"
        className="tabular-nums text-primary underline-offset-4 hover:underline"
      >
        {value}
      </a>
    ) : (
      <span className="text-muted-foreground">{labels.none}</span>
    );

  return (
    <div>
      {deployment.allowedMint === null ? (
        <p className="mb-2 text-sm text-warning">{labels.notInitialized}</p>
      ) : null}
      <dl>
        <Row label={labels.network}>{deployment.network}</Row>
        <Row label={labels.program}>{address(deployment.programId)}</Row>
        <Row label={labels.upgradeAuthority}>
          {deployment.upgradeAuthority ? (
            address(deployment.upgradeAuthority)
          ) : (
            <span className="text-muted-foreground">{labels.upgradeNone}</span>
          )}
        </Row>
        {issuer ? (
          <>
            <Row label={labels.token}>
              {issuer.symbol ?? ''} {address(issuer.mint)}
            </Row>
            <Row label={labels.transfers}>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  issuer.paused
                    ? 'border-warning/40 bg-warning/15'
                    : 'border-ok/30 bg-ok/10 text-ok-text',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-1.5 rounded-full',
                    issuer.paused ? 'bg-warning' : 'bg-ok',
                  )}
                />
                {issuer.paused ? labels.paused : labels.live}
              </span>
            </Row>
            <Row label={labels.multiplier}>{issuer.multiplier}</Row>
            <Row label={labels.pauseAuthority}>
              {address(issuer.pauseAuthority)}
            </Row>
            <Row label={labels.freezeAuthority}>
              {address(issuer.freezeAuthority)}
            </Row>
            <Row label={labels.permanentDelegate}>
              {address(issuer.permanentDelegate)}
            </Row>
          </>
        ) : null}
        {faucet ? (
          <Row label={labels.faucet}>
            {faucet.state === 'off' ? (
              <span className="text-muted-foreground">{labels.faucetOff}</span>
            ) : faucet.state === 'unreadable' ? (
              <span className="text-muted-foreground">
                {labels.faucetUnreadable}
              </span>
            ) : (
              <span className="flex flex-col gap-1 sm:items-end">
                <span className="tabular-nums">{faucet.balance}</span>
                {address(faucet.address)}
                {faucet.low ? (
                  <span className="text-warning">{labels.faucetLow}</span>
                ) : null}
              </span>
            )}
          </Row>
        ) : null}
      </dl>
    </div>
  );
}
