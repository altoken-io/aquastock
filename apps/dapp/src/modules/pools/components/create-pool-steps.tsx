'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { rawToUi } from '@/lib/solana/amounts';

import { sanitizeAmountInput } from '../lib/amount-input';
import {
  poolReach,
  type CreatePoolField,
  type CreatePoolForm,
  type Draft,
  type DurationUnit,
} from '../lib/create-pool';
import { formatDuration, toIntlLocale } from '../lib/format';
import { useFormatters, useToken } from '../token-context';
import {
  DurationInput,
  Field,
  QuickPicks,
  SuffixInput,
  TextArea,
  TextInput,
  describedBy,
} from './create-pool-fields';
import { FaucetOffer } from './faucet-offer';
import { Notice } from './notice';

export interface StepProps {
  form: CreatePoolForm;
  set: (patch: Partial<CreatePoolForm>) => void;
  /** The problem to show for a field, already translated; null until the person has touched it. */
  problem: (field: CreatePoolField) => string | null;
  /** Marks a field as touched, so its problem starts showing. */
  touch: (field: CreatePoolField) => void;
}

interface DurationChoice {
  value: string;
  unit: DurationUnit;
}

const VESTING_PICKS: DurationChoice[] = [
  { value: '3', unit: 'minutes' },
  { value: '1', unit: 'days' },
  { value: '30', unit: 'days' },
  { value: '180', unit: 'days' },
  { value: '365', unit: 'days' },
];

const WINDOW_PICKS: DurationChoice[] = [
  { value: '60', unit: 'minutes' },
  { value: '1', unit: 'days' },
  { value: '7', unit: 'days' },
  { value: '30', unit: 'days' },
  { value: '90', unit: 'days' },
];

const UNIT_SECONDS: Record<DurationUnit, number> = {
  minutes: 60,
  hours: 3_600,
  days: 86_400,
};

export function DetailsStep({ form, set, problem, touch }: StepProps) {
  const t = useTranslations('create.details');
  const nameError = problem('name');
  const aboutError = problem('description');
  return (
    <div className="flex flex-col gap-5">
      <Field
        id="pool-name"
        label={t('name.label')}
        hint={t('name.hint')}
        error={nameError}
      >
        <TextInput
          id="pool-name"
          value={form.name}
          onChange={(name) => set({ name })}
          onBlur={() => touch('name')}
          placeholder={t('name.placeholder')}
          maxLength={80}
          invalid={nameError !== null}
          describedBy={describedBy('pool-name', {
            hint: true,
            error: nameError !== null,
          })}
        />
      </Field>
      <Field
        id="pool-about"
        label={t('about.label')}
        badge={t('about.optional')}
        hint={t('about.count', { count: form.description.length })}
        error={aboutError}
      >
        <TextArea
          id="pool-about"
          value={form.description}
          onChange={(description) => set({ description })}
          onBlur={() => touch('description')}
          placeholder={t('about.placeholder')}
          maxLength={500}
          invalid={aboutError !== null}
          describedBy={describedBy('pool-about', {
            hint: true,
            error: aboutError !== null,
          })}
        />
      </Field>
    </div>
  );
}

export function RulesStep({ form, set, problem, touch }: StepProps) {
  const t = useTranslations('create.rules');
  const locale = toIntlLocale(useLocale());
  const { symbol } = useToken();

  const unitNames: Record<DurationUnit, string> = {
    minutes: t('units.minutes'),
    hours: t('units.hours'),
    days: t('units.days'),
  };
  const pickLabel = (choice: DurationChoice): string => {
    const seconds = Number(choice.value) * UNIT_SECONDS[choice.unit];
    const text = formatDuration(seconds, locale);
    // Under a day is a demo setting, not a savings horizon.
    return seconds < UNIT_SECONDS.days ? `${text} (${t('demoTag')})` : text;
  };

  const matchError = problem('matchPercent');
  const capError = problem('cap');
  const vestingError = problem('vesting');
  const windowError = problem('window');

  return (
    <div className="flex flex-col gap-6">
      <Field
        id="pool-match"
        label={t('match.label')}
        hint={t('match.hint')}
        error={matchError}
      >
        <SuffixInput
          id="pool-match"
          suffix="%"
          value={form.matchPercent}
          onChange={(matchPercent) =>
            set({ matchPercent: sanitizeAmountInput(matchPercent) })
          }
          onBlur={() => touch('matchPercent')}
          invalid={matchError !== null}
          describedBy={describedBy('pool-match', {
            hint: true,
            error: matchError !== null,
          })}
        />
        <QuickPicks
          label={t('quickPicks')}
          options={['25', '50', '100'].map((value) => ({
            key: value,
            label: `${value}%`,
            value,
          }))}
          isPressed={(value) => form.matchPercent === value}
          onPick={(matchPercent) => {
            set({ matchPercent });
            touch('matchPercent');
          }}
        />
      </Field>

      <Field
        id="pool-cap"
        label={t('cap.label')}
        hint={t('cap.hint')}
        error={capError}
      >
        <SuffixInput
          id="pool-cap"
          suffix={symbol}
          value={form.cap}
          onChange={(cap) => set({ cap: sanitizeAmountInput(cap) })}
          onBlur={() => touch('cap')}
          invalid={capError !== null}
          describedBy={describedBy('pool-cap', {
            hint: true,
            error: capError !== null,
          })}
        />
      </Field>

      <Field
        id="pool-vesting"
        label={t('vesting.label')}
        hint={t('vesting.hint')}
        error={vestingError}
      >
        <DurationInput
          id="pool-vesting"
          value={form.vestingValue}
          unit={form.vestingUnit}
          unitLabel={t('unit')}
          unitNames={unitNames}
          onChange={({ value, unit }) =>
            set({ vestingValue: value, vestingUnit: unit })
          }
          onBlur={() => touch('vesting')}
          invalid={vestingError !== null}
          describedBy={describedBy('pool-vesting', {
            hint: true,
            error: vestingError !== null,
          })}
        />
        <QuickPicks
          label={t('quickPicks')}
          options={VESTING_PICKS.map((choice) => ({
            key: `${choice.value}-${choice.unit}`,
            label: pickLabel(choice),
            value: choice,
          }))}
          isPressed={(choice) =>
            form.vestingValue === choice.value &&
            form.vestingUnit === choice.unit
          }
          onPick={(choice) => {
            set({ vestingValue: choice.value, vestingUnit: choice.unit });
            touch('vesting');
          }}
        />
      </Field>

      <Field
        id="pool-window"
        label={t('window.label')}
        hint={t('window.hint')}
        error={windowError}
      >
        <DurationInput
          id="pool-window"
          value={form.windowValue}
          unit={form.windowUnit}
          unitLabel={t('unit')}
          unitNames={unitNames}
          onChange={({ value, unit }) =>
            set({ windowValue: value, windowUnit: unit })
          }
          onBlur={() => touch('window')}
          invalid={windowError !== null}
          describedBy={describedBy('pool-window', {
            hint: true,
            error: windowError !== null,
          })}
        />
        <QuickPicks
          label={t('quickPicks')}
          options={WINDOW_PICKS.map((choice) => ({
            key: `${choice.value}-${choice.unit}`,
            label: pickLabel(choice),
            value: choice,
          }))}
          isPressed={(choice) =>
            form.windowValue === choice.value && form.windowUnit === choice.unit
          }
          onPick={(choice) => {
            set({ windowValue: choice.value, windowUnit: choice.unit });
            touch('window');
          }}
        />
      </Field>
    </div>
  );
}

export function FundStep({
  form,
  set,
  problem,
  touch,
  draft,
  balanceRaw,
  connected,
  demoCap,
}: StepProps & {
  draft: Draft;
  /** Null while unknown. */
  balanceRaw: bigint | null;
  connected: boolean;
  /** The demo cap to explain, in raw units; null when there is none. */
  demoCap: bigint | null;
}) {
  const t = useTranslations('create.fund');
  const f = useFormatters();
  const { symbol, decimals, multiplier } = useToken();
  const budgetError = problem('budget');

  const reach =
    draft.budgetUnits !== null &&
    draft.capUnits !== null &&
    draft.matchBps !== null
      ? poolReach(draft.budgetUnits, draft.capUnits, draft.matchBps)
      : null;

  const useAll = (): void => {
    if (balanceRaw === null) return;
    const limit =
      demoCap !== null && demoCap < balanceRaw ? demoCap : balanceRaw;
    set({ budget: rawToUi(limit, decimals, multiplier) });
    touch('budget');
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {t('description', { symbol })}
      </p>

      {balanceRaw === 0n ? (
        <>
          <Notice tone="warning">{t('noBalance', { symbol })}</Notice>
          <FaucetOffer />
        </>
      ) : null}

      <Field
        id="pool-budget"
        label={t('budget.label')}
        hint={
          !connected
            ? t('budget.notConnected')
            : balanceRaw === null
              ? t('budget.balanceLoading')
              : t('budget.balance', {
                  amount: f.tokens(balanceRaw, { rounding: 'down' }),
                  symbol,
                })
        }
        error={budgetError}
      >
        <SuffixInput
          id="pool-budget"
          suffix={symbol}
          value={form.budget}
          onChange={(budget) => set({ budget: sanitizeAmountInput(budget) })}
          onBlur={() => touch('budget')}
          invalid={budgetError !== null}
          describedBy={describedBy('pool-budget', {
            hint: true,
            error: budgetError !== null,
          })}
          action={
            <button
              type="button"
              onClick={useAll}
              disabled={balanceRaw === null || balanceRaw === 0n}
              aria-label={t('budget.maxLabel')}
              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {t('budget.max')}
            </button>
          }
        />
      </Field>

      {demoCap !== null ? (
        <Notice tone="warning">
          {t('demoCap', { cap: f.tokens(demoCap), symbol })}
        </Notice>
      ) : null}

      {reach ? (
        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('reach.title')}
          </p>
          {reach.fullyMatchedSavers === null ? (
            <p className="mt-1.5 text-sm">{t('reach.none')}</p>
          ) : (
            <>
              <p className="font-display mt-1 text-lg font-semibold">
                {t('reach.savers', { count: Number(reach.fullyMatchedSavers) })}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t('reach.each', {
                  cap: f.units(draft.capUnits ?? 0n),
                  match: f.units(reach.matchAtCap),
                  symbol,
                })}
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** A labelled row on the review screen, with a way back to fix it. */
export function ReviewRow({
  label,
  value,
  onEdit,
  editLabel,
}: {
  label: string;
  value: ReactNode;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-3 text-right text-sm text-foreground tabular-nums">
        <span className="min-w-0 break-words">{value}</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {editLabel}
        </button>
      </dd>
    </div>
  );
}
