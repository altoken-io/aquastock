'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { PriceDto } from '@aquastock/types';

import { fetchJson } from '../lib/api-client';
import { toIntlLocale } from '../lib/format';
import { formatUsd } from '../lib/usd';
import { useToken } from '../token-context';
import { useLocale } from 'next-intl';

/** Live SPYx/USD. Absent (no key, stale feed, outage) is a normal state, not an error. */
export function usePrice() {
  return useQuery({
    queryKey: ['price'],
    queryFn: () => fetchJson<PriceDto>('/api/price'),
    staleTime: 15_000,
    refetchInterval: 30_000,
    // A missing price only hides "≈ $" figures; retrying would just delay that.
    retry: false,
  });
}

/**
 * Formats a raw token amount as "≈ $612"; null while there is no price, so callers simply
 * render nothing. Pass `multiplier: '1'` for amounts as typed (the create-pool form).
 */
export function useUsd() {
  const { data } = usePrice();
  const token = useToken();
  const locale = toIntlLocale(useLocale());
  const price = data?.price ?? null;
  return useCallback(
    (
      raw: bigint | string,
      options?: { multiplier?: string },
    ): string | null => {
      if (price === null) return null;
      const usd = formatUsd(
        typeof raw === 'string' ? BigInt(raw) : raw,
        token.decimals,
        options?.multiplier ?? token.multiplier,
        price,
        locale,
      );
      return usd === null ? null : `≈ ${usd}`;
    },
    [price, token.decimals, token.multiplier, locale],
  );
}
