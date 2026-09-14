import type { Impact } from '@aquastock/types';

/**
 * Demo "My Impact" entries — see src/lib/demo/projects.ts for the honesty
 * rationale. Only ever attached to a milestone that's already VERIFIED in
 * that dataset (DESIGN.md: never show impact before the chain confirms the
 * milestone that produced it). Metric keys map to copy via
 * impact.metrics.<key> in packages/locales, never rendered raw.
 *
 * `metric` narrows the shared `Impact.metric: string` to the exact keys this
 * demo dataset uses, so callers can build a translation key
 * (`metrics.${entry.metric}`) without an `as` cast.
 */
export type DemoMetricKey = 'households_connected' | 'liters_treated_per_day';
export type DemoImpact = Omit<Impact, 'metric'> & {
  readonly metric: DemoMetricKey;
};

export const DEMO_IMPACT_ENTRIES: readonly DemoImpact[] = [
  {
    id: 'impact_costa-norte_1',
    projectId: 'proj_costa-norte',
    milestoneId: 'ms_costa-norte_3',
    metric: 'liters_treated_per_day',
    value: '45000',
    recordedAt: '2026-04-25T00:00:00.000Z',
    onchainAddress: null,
  },
  {
    id: 'impact_costa-norte_2',
    projectId: 'proj_costa-norte',
    milestoneId: 'ms_costa-norte_4',
    metric: 'households_connected',
    value: '1200',
    recordedAt: '2026-08-05T00:00:00.000Z',
    onchainAddress: null,
  },
] as const;

export function getDemoImpactForProject(
  projectId: string,
): readonly DemoImpact[] {
  return DEMO_IMPACT_ENTRIES.filter((entry) => entry.projectId === projectId);
}
