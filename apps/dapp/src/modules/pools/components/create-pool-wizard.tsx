'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ArrowLeft, CircleCheck, LoaderCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { Link } from '@/lib/i18n/navigation';
import { poolPda } from '@/lib/solana/pdas';
import { env } from '@/lib/env/client';
import { WalletButton } from '@/modules/wallet/wallet-button';
import { cn } from '@/utils/classNames';

import { useTokenBalance } from '../hooks/queries';
import { useNow } from '../hooks/use-now';
import { useMatchPoolsProgram } from '../hooks/use-program';
import { usePublishMetadata } from '../hooks/use-publish-metadata';
import {
  EMPTY_FORM,
  parseDraft,
  problemFields,
  stepErrors,
  stepOfField,
  validateCreatePool,
  type CreatePoolContext,
  type CreatePoolField,
  type CreatePoolForm,
  type FieldProblem,
  type ValidCreatePool,
  type STEP_FIELDS,
  type WizardStep,
} from '../lib/create-pool';
import { resolveDemoCap } from '../lib/demo-cap';
import { formatDuration, shortAddress, toIntlLocale } from '../lib/format';
import { useFormatters, useToken } from '../token-context';
import { buildCreatePool, randomPoolId } from '../tx/builders';
import { usePoolTransaction } from '../tx/use-pool-transaction';
import { ActionButton, ActionLink } from './actions';
import { PoolPreview } from './create-pool-preview';
import {
  DetailsStep,
  FundStep,
  ReviewRow,
  RulesStep,
  type StepProps,
} from './create-pool-steps';
import { Notice } from './notice';
import { TxStatus } from './tx-status';

const STEPS = ['details', 'rules', 'fund', 'review'] as const;

const FIELD_INPUT_ID: Record<CreatePoolField, string> = {
  name: 'pool-name',
  description: 'pool-about',
  matchPercent: 'pool-match',
  cap: 'pool-cap',
  vesting: 'pool-vesting',
  window: 'pool-window',
  budget: 'pool-budget',
};

interface CreatedPool {
  pool: string;
  value: ValidCreatePool;
}

export function CreatePoolWizard({ serverNow }: { serverNow: number }) {
  const t = useTranslations('create');
  const tProblems = useTranslations('create.problems');
  const token = useToken();
  const f = useFormatters();
  const locale = toIntlLocale(useLocale());
  const { publicKey } = useWallet();
  const program = useMatchPoolsProgram();
  const tx = usePoolTransaction();
  const publisher = usePublishMetadata();
  const now = useNow(serverNow, 5_000);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [form, setForm] = useState<CreatePoolForm>(EMPTY_FORM);
  const [step, setStep] = useState<WizardStep>('details');
  const [touched, setTouched] = useState<ReadonlySet<CreatePoolField>>(
    new Set(),
  );
  const [created, setCreated] = useState<CreatedPool | null>(null);

  const balanceQuery = useTokenBalance(
    token.mint,
    publicKey?.toBase58() ?? null,
  );
  const balanceRaw = balanceQuery.isSuccess ? (balanceQuery.data ?? 0n) : null;

  const demoCap = useMemo(
    () =>
      resolveDemoCap(
        token.network,
        env('NEXT_PUBLIC_MAINNET_DEMO_CAP', true),
        token.decimals,
        token.multiplier,
      ),
    [token.network, token.decimals, token.multiplier],
  );

  const context = useMemo<CreatePoolContext>(
    () => ({
      decimals: token.decimals,
      multiplier: token.multiplier,
      balanceRaw,
      ...demoCap,
      now,
    }),
    [token.decimals, token.multiplier, balanceRaw, demoCap, now],
  );

  const result = useMemo(
    () => validateCreatePool(form, context),
    [form, context],
  );
  const errors = result.ok ? {} : result.errors;
  const draft = useMemo(() => parseDraft(form, context), [form, context]);

  // Move focus to the step's heading when it changes, so keyboard and screen-reader users land
  // at the top of the new content instead of on a button that no longer exists.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const set = (patch: Partial<CreatePoolForm>): void =>
    setForm((current) => ({ ...current, ...patch }));
  const touch = (field: CreatePoolField): void =>
    setTouched((current) => new Set(current).add(field));

  const problemText = (
    field: CreatePoolField,
    problem: FieldProblem,
  ): string => {
    const params = {
      symbol: token.symbol,
      decimals: token.decimals,
      balance: f.tokens(balanceRaw ?? 0n, { rounding: 'down' }),
      cap: f.tokens(demoCap.demoCapRaw ?? 0n),
    };
    switch (problem) {
      case 'required':
        return tProblems('required');
      case 'invalid':
        return tProblems('invalid');
      case 'too-long':
        return tProblems('tooLong');
      case 'single-line':
        return tProblems('singleLine');
      case 'characters':
        return tProblems('characters');
      case 'precision':
        return tProblems('precision', params);
      case 'too-small':
        return tProblems('tooSmall');
      case 'too-large':
        return tProblems('tooLarge');
      case 'over-balance':
        return tProblems('overBalance', params);
      case 'over-demo-cap':
        return tProblems('overDemoCap', params);
      case 'demo-cap-unset':
        return tProblems('demoCapUnset');
      case 'out-of-range':
        return field === 'matchPercent' ||
          field === 'vesting' ||
          field === 'window'
          ? tProblems(`outOfRange.${field}`)
          : tProblems('invalid');
    }
  };

  const stepProps: StepProps = {
    form,
    set,
    touch,
    problem: (field) => {
      const problem = errors[field];
      return problem && touched.has(field) ? problemText(field, problem) : null;
    },
  };

  const index = STEPS.indexOf(step);
  const goTo = (next: WizardStep): void => setStep(next);

  const next = (): void => {
    if (step === 'review') return;
    const own = stepErrors(step, errors);
    const fields = problemFields(own);
    if (fields.length > 0) {
      // Show every problem on this step, and put the cursor on the first one.
      setTouched((current) => new Set([...current, ...fields]));
      const first = fields[0];
      if (first)
        requestAnimationFrame(() =>
          document.getElementById(FIELD_INPUT_ID[first])?.focus(),
        );
      return;
    }
    goTo(STEPS[index + 1] ?? 'review');
  };

  const submit = async (): Promise<void> => {
    if (!result.ok || !publicKey || !program || !token.mint) return;
    const value = result.value;
    const poolId = randomPoolId();
    const pool = poolPda(program.programId, publicKey, poolId);
    const mint = new PublicKey(token.mint);
    const signature = await tx.run(
      'create',
      async () =>
        (
          await buildCreatePool({
            program,
            mint,
            sponsor: publicKey,
            input: {
              poolId,
              matchBps: value.matchBps,
              perSaverCap: value.perSaverCapRaw,
              vestingSeconds: value.vestingSeconds,
              endsAt: value.endsAt,
              budgetRaw: value.budgetRaw,
            },
          })
        ).instructions,
      { poolAddress: pool.toBase58() },
    );
    if (!signature) return;
    setCreated({ pool: pool.toBase58(), value });
    // The next thing is naming it. The wallet asks once more, this time to sign a message.
    void publisher.publish({
      pool: pool.toBase58(),
      name: value.name,
      description: value.description,
    });
  };

  if (created) {
    return (
      <CreatedView
        created={created}
        publisher={publisher}
        locale={locale}
        headingRef={headingRef}
      />
    );
  }

  const reviewProblems = (result.ok ? [] : problemFields(result.errors)).map(
    (field) => ({
      field,
      step: stepOfField(field),
      text: problemText(field, errors[field] ?? 'invalid'),
    }),
  );

  const blockedReason: string | null = token.paused
    ? t('review.paused', { symbol: token.symbol })
    : !program
      ? t('review.notReady')
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-10">
      <div>
        <Link
          href="/pools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t('nav.back')}
        </Link>
        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          {t('eyebrow')}
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t('subtitle', { symbol: token.symbol })}
        </p>

        <nav aria-label={t('steps.label')} className="mt-8">
          <ol className="flex items-center gap-2">
            {STEPS.map((name, i) => {
              const state =
                i < index ? 'done' : i === index ? 'current' : 'todo';
              return (
                <li
                  key={name}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className="flex min-w-0 flex-1 flex-col gap-1.5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'h-1 rounded-full transition-colors',
                      state === 'todo' ? 'bg-border' : 'bg-primary',
                    )}
                  />
                  <span
                    className={cn(
                      'truncate text-xs font-medium',
                      state === 'current'
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {t(`steps.${name}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <section aria-labelledby="step-title" className="mt-8">
          <div key={step} className="dapp-enter">
            <p className="text-xs text-muted-foreground">
              {t('stepOf', { current: index + 1, total: STEPS.length })}
            </p>
            <h2
              id="step-title"
              ref={headingRef}
              tabIndex={-1}
              className="font-display mt-1 text-2xl font-semibold outline-none"
            >
              {t(`${step}.title`)}
            </h2>
            {step !== 'fund' ? (
              <p className="mt-1 mb-6 text-sm text-muted-foreground">
                {t(`${step}.description`)}
              </p>
            ) : (
              <div className="mb-6" />
            )}

            {step === 'details' ? <DetailsStep {...stepProps} /> : null}
            {step === 'rules' ? <RulesStep {...stepProps} /> : null}
            {step === 'fund' ? (
              <FundStep
                {...stepProps}
                draft={draft}
                balanceRaw={balanceRaw}
                connected={publicKey !== null}
                demoCap={demoCap.demoCapRaw}
              />
            ) : null}
            {step === 'review' ? (
              <ReviewStep
                result={result}
                problems={reviewProblems}
                locale={locale}
                goTo={goTo}
                blockedReason={blockedReason}
                tx={tx}
                submit={submit}
                connected={publicKey !== null}
              />
            ) : null}
          </div>

          {step !== 'review' ? (
            <div className="mt-8 flex items-center justify-between gap-3">
              <ActionButton
                variant="ghost"
                onClick={() => goTo(STEPS[index - 1] ?? 'details')}
                disabled={index === 0}
                className={index === 0 ? 'invisible' : undefined}
              >
                {t('nav.back')}
              </ActionButton>
              <ActionButton onClick={next}>{t('nav.next')}</ActionButton>
            </div>
          ) : (
            <div className="mt-6 flex justify-start">
              <ActionButton
                variant="ghost"
                onClick={() => goTo('fund')}
                disabled={tx.busy}
              >
                {t('nav.back')}
              </ActionButton>
            </div>
          )}
        </section>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <PoolPreview name={form.name} draft={draft} locale={locale} />
      </div>
    </div>
  );
}

function ReviewStep({
  result,
  problems,
  locale,
  goTo,
  blockedReason,
  tx,
  submit,
  connected,
}: {
  result: ReturnType<typeof validateCreatePool>;
  /** What no longer checks out, with the step that fixes it. */
  problems: {
    field: CreatePoolField;
    step: keyof typeof STEP_FIELDS;
    text: string;
  }[];
  locale: string;
  goTo: (step: WizardStep) => void;
  blockedReason: string | null;
  tx: ReturnType<typeof usePoolTransaction>;
  submit: () => Promise<void>;
  connected: boolean;
}) {
  const t = useTranslations('create.review');
  const f = useFormatters();
  const { symbol, upgradeAuthority } = useToken();

  if (!result.ok) {
    // Something earlier no longer checks out (the balance moved, or time passed): say what, and
    // offer the step that fixes it.
    return (
      <Notice tone="warning" live="alert">
        <ul className="flex flex-col gap-2">
          {problems.map((problem) => (
            <li
              key={problem.field}
              className="flex items-baseline justify-between gap-3"
            >
              <span>{problem.text}</span>
              <button
                type="button"
                onClick={() => goTo(problem.step)}
                className="shrink-0 text-xs text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t('edit')}
              </button>
            </li>
          ))}
        </ul>
      </Notice>
    );
  }
  const { value } = result;

  return (
    <div className="flex flex-col gap-6">
      <dl className="rounded-lg border border-border px-4">
        <ReviewRow
          label={t('rows.name')}
          value={value.name}
          editLabel={t('edit')}
          onEdit={() => goTo('details')}
        />
        <ReviewRow
          label={t('rows.match')}
          value={f.percent(value.matchBps)}
          editLabel={t('edit')}
          onEdit={() => goTo('rules')}
        />
        <ReviewRow
          label={t('rows.cap')}
          value={`${f.tokens(value.perSaverCapRaw)} ${symbol}`}
          editLabel={t('edit')}
          onEdit={() => goTo('rules')}
        />
        <ReviewRow
          label={t('rows.vesting')}
          value={formatDuration(value.vestingSeconds, locale)}
          editLabel={t('edit')}
          onEdit={() => goTo('rules')}
        />
        <ReviewRow
          label={t('rows.window')}
          value={formatDuration(value.windowSeconds, locale)}
          editLabel={t('edit')}
          onEdit={() => goTo('rules')}
        />
        <ReviewRow
          label={t('rows.budget')}
          value={`${f.tokens(value.budgetRaw)} ${symbol}`}
          editLabel={t('edit')}
          onEdit={() => goTo('fund')}
        />
      </dl>

      <section aria-labelledby="disclosure-title">
        <h3 id="disclosure-title" className="text-sm font-semibold">
          {t('disclosureTitle')}
        </h3>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
          <li>
            {t('disclosure.locked', {
              amount: f.tokens(value.budgetRaw),
              symbol,
              date: f.dateTime(value.endsAt),
            })}
          </li>
          <li>{t('disclosure.final')}</li>
          <li>{t('disclosure.issuer', { symbol })}</li>
          <li>
            {upgradeAuthority
              ? t('disclosure.upgrade', {
                  authority: shortAddress(upgradeAuthority),
                })
              : t('disclosure.upgradeNone')}
          </li>
          <li className="font-medium text-foreground">
            {t('disclosure.demo')}
          </li>
        </ul>
      </section>

      {blockedReason ? <Notice tone="warning">{blockedReason}</Notice> : null}

      {connected ? (
        <ActionButton
          className="h-12 w-full"
          disabled={tx.busy || blockedReason !== null}
          onClick={() => void submit()}
        >
          {t('submit', { amount: f.tokens(value.budgetRaw), symbol })}
        </ActionButton>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">{t('connect')}</p>
          <WalletButton />
        </div>
      )}

      <TxStatus state={tx.state} onDismiss={tx.reset} />
    </div>
  );
}

function CreatedView({
  created,
  publisher,
  locale,
  headingRef,
}: {
  created: CreatedPool;
  publisher: ReturnType<typeof usePublishMetadata>;
  locale: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const t = useTranslations('create.created');
  const f = useFormatters();
  const { state, supported } = publisher;
  const working = state.phase === 'signing' || state.phase === 'saving';

  useEffect(() => {
    headingRef.current?.focus();
  }, [headingRef]);

  return (
    <div className="dapp-enter mx-auto max-w-xl">
      <div className="flex items-center gap-3">
        <span className="dapp-icon-tile">
          <CircleCheck aria-hidden className="size-5 text-ok" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-3xl font-semibold outline-none"
        >
          {t('title')}
        </h1>
      </div>
      <p className="mt-3 text-base text-muted-foreground">
        {t('description', { date: f.dateTime(created.value.endsAt) })}
      </p>

      <section
        className="dapp-console-panel mt-6 p-5"
        aria-labelledby="publish-title"
      >
        <h2 id="publish-title" className="text-base font-semibold">
          {t('publish.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('publish.description', { name: created.value.name })}
        </p>
        <div aria-live="polite" className="mt-3 text-sm">
          {working ? (
            <p className="flex items-center gap-2">
              <LoaderCircle
                aria-hidden
                className="size-4 text-primary motion-safe:animate-spin"
              />
              {state.phase === 'signing'
                ? t('publish.signing')
                : t('publish.saving')}
            </p>
          ) : null}
          {state.phase === 'done' ? (
            <p className="flex items-center gap-2 font-medium">
              <CircleCheck aria-hidden className="size-4 text-ok" />
              {t('publish.done')}
            </p>
          ) : null}
          {state.phase === 'error' ? (
            <p role="alert" className="text-destructive">
              {state.reason === 'cancelled'
                ? t('publish.cancelled')
                : t('publish.error')}
            </p>
          ) : null}
          {!supported ? (
            <p className="text-muted-foreground">{t('publish.unsupported')}</p>
          ) : null}
        </div>
        {supported && (state.phase === 'error' || state.phase === 'idle') ? (
          <div className="mt-3">
            <ActionButton
              variant="secondary"
              onClick={() =>
                void publisher.publish({
                  pool: created.pool,
                  name: created.value.name,
                  description: created.value.description,
                })
              }
            >
              {t('publish.action')}
            </ActionButton>
          </div>
        ) : null}
      </section>

      <div className="mt-6">
        <ActionLink href={`/pools/${created.pool}`} className="h-11">
          {t('open')}
        </ActionLink>
      </div>
    </div>
  );
}
