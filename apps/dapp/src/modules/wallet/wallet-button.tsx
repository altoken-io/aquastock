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
import { ConnectOptions } from './connect-options';
import {
  MOBILE_WALLET_ADAPTER_NAME,
  WALLET_INSTALL_LINKS,
  connectMode,
  isMobileDevice,
  walletAppLinks,
} from './lib/connect-options';

const NETWORK = env('NEXT_PUBLIC_SOLANA_NETWORK', true) ?? 'localnet';
const RPC_URL =
  env('NEXT_PUBLIC_SOLANA_RPC_URL', true) ?? 'http://127.0.0.1:8899';

const triggerClasses =
  'inline-flex h-9 items-center gap-2 rounded-md border border-border/70 bg-card px-3 text-sm font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60';

/**
 * Connect and account menu. Wallets come from Wallet Standard detection, so there is nothing
 * to configure per wallet; AquaStock never sees a key.
 */
export function WalletButton({
  className,
  compact = false,
}: {
  className?: string;
  /** Header use: below 640px the label hides and only the icon shows. Elsewhere the button is
   *  the call to action, so it always says what it does. */
  compact?: boolean;
}) {
  const t = useTranslations('wallet');
  const { wallets, publicKey, connected, connecting, select, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Read from the browser when the dialog opens, never during render, so the server-rendered
  // button and the first client render always match.
  const [device, setDevice] = useState({ mobile: false, pageUrl: '' });

  const usable = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable,
  );
  // An extension, or the injected wallet of a wallet app's own browser.
  const installed = usable.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed &&
      w.adapter.name !== MOBILE_WALLET_ADAPTER_NAME,
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
        onClick={() => {
          setDevice({
            mobile: isMobileDevice(
              navigator.userAgent,
              navigator.maxTouchPoints,
            ),
            pageUrl: window.location.href,
          });
          setOpen(true);
        }}
        disabled={connecting}
        aria-label={connecting ? t('connecting') : t('connect')}
      >
        <Wallet aria-hidden className="size-4" />
        <span className={cn(compact && 'max-sm:sr-only')}>
          {connecting ? t('connecting') : t('connect')}
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
          <ConnectOptions
            mode={connectMode({
              mobile: device.mobile,
              installedCount: installed.length,
            })}
            wallets={usable.map((wallet) => ({
              name: wallet.adapter.name,
              icon: wallet.adapter.icon,
              isMobileApp: wallet.adapter.name === MOBILE_WALLET_ADAPTER_NAME,
              onSelect: () => {
                select(wallet.adapter.name);
                setOpen(false);
              },
            }))}
            appLinks={device.pageUrl ? walletAppLinks(device.pageUrl) : []}
            installLinks={WALLET_INSTALL_LINKS}
            network={NETWORK}
            onCopyLink={() => {
              void navigator.clipboard
                .writeText(device.pageUrl)
                .then(() => toast.success(t('dialog.openInApp.copied')));
            }}
          />
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
