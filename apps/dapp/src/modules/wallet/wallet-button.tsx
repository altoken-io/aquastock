'use client';

import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@aquastock/ui/tw/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@aquastock/ui/tw/dropdown-menu';

import { env } from '@/lib/env/client';
import { cn } from '@/utils/classNames';

import { explorerUrl, shortAddress } from '../pools/lib/format';

const NETWORK = env('NEXT_PUBLIC_SOLANA_NETWORK', true) ?? 'localnet';
const RPC_URL =
  env('NEXT_PUBLIC_SOLANA_RPC_URL', true) ?? 'http://127.0.0.1:8899';

const triggerClasses =
  'inline-flex h-9 items-center gap-2 rounded-md border border-border/70 bg-card px-3 text-sm font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60';

/**
 * Connect and account menu. Wallets come from Wallet Standard detection, so there is nothing
 * to configure per wallet; AquaStock never sees a key.
 */
export function WalletButton({ className }: { className?: string }) {
  const t = useTranslations('wallet');
  const { wallets, publicKey, connected, connecting, select, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const usable = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );

  if (connected && publicKey) {
    const address = publicKey.toBase58();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(triggerClasses, className)}
          aria-label={t('menu.label')}
        >
          <span aria-hidden className="size-2 rounded-full bg-ok" />
          <span className="tabular-nums">{shortAddress(address)}</span>
          <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">
            {t(`network.${networkKey(NETWORK)}`)}
          </div>
          <DropdownMenuItem
            onClick={() => {
              void navigator.clipboard.writeText(address).then(() => {
                setCopied(true);
                toast.success(t('menu.copied'));
                window.setTimeout(() => setCopied(false), 1_500);
              });
            }}
          >
            {copied ? (
              <Check aria-hidden className="size-4" />
            ) : (
              <Copy aria-hidden className="size-4" />
            )}
            {t('menu.copy')}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={explorerUrl(NETWORK, 'address', address, RPC_URL)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <ExternalLink aria-hidden className="size-4" />
            {t('menu.explorer')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void disconnect()} variant="danger">
            <LogOut aria-hidden className="size-4" />
            {t('menu.disconnect')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          triggerClasses,
          'border-primary bg-primary text-primary-foreground hover:bg-primary-pressed',
          className,
        )}
        onClick={() => setOpen(true)}
        disabled={connecting}
        aria-label={connecting ? t('connecting') : t('connect')}
      >
        <Wallet aria-hidden className="size-4" />
        <span className="max-sm:sr-only">
          {connecting ? t('connecting') : t('connect')}
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
          {usable.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('dialog.detected')}
              </p>
              <ul className="flex flex-col gap-2">
                {usable.map((wallet) => (
                  <li key={wallet.adapter.name}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        select(wallet.adapter.name);
                        setOpen(false);
                      }}
                    >
                      <img
                        src={wallet.adapter.icon}
                        alt=""
                        className="size-6 rounded"
                      />
                      {wallet.adapter.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm">
              <p className="font-medium">{t('dialog.noWallets')}</p>
              <p className="mt-1 text-muted-foreground">
                {t('dialog.installHint')}
              </p>
              <a
                href="https://phantom.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('dialog.install')}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function networkKey(network: string): 'localnet' | 'devnet' | 'mainnet-beta' {
  return network === 'devnet' || network === 'mainnet-beta'
    ? network
    : 'localnet';
}
