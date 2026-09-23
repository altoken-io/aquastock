import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LedgerRow } from './stream-legend';

const row = (usd?: string | null) =>
  renderToStaticMarkup(
    <dl>
      <LedgerRow label="Sponsor match" value="100 dSPYx" usd={usd} />
    </dl>,
  );

describe('LedgerRow', () => {
  it('shows the dollar estimate under the token amount', () => {
    const html = row('≈ $61,235');
    expect(html).toContain('100 dSPYx');
    expect(html).toContain('≈ $61,235');
  });

  it('shows only the token amount when there is no market price', () => {
    expect(row(null)).not.toContain('$');
    expect(row()).not.toContain('$');
  });
});
