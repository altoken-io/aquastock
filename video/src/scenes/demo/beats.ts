// What the demo chapter shows, in order. Every step is a screenshot from the recorded devnet run
// (public/capture); every rail event carries the real signature of that transaction.
import { capture, secondsBetween } from '../../lib/capture';
import type { BeatSpec } from './timeline';
import { buildTimeline } from './timeline';

const tx = (name: keyof typeof capture.transactions): string => {
  const signature = capture.transactions[name];
  if (!signature) throw new Error(`The capture has no ${name} transaction`);
  return signature;
};

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** "1:36 after the deposit", measured between the two screenshots. */
const sinceDeposit = (id: string) =>
  `${clock(secondsBetween('deposit-done', id))} after the deposit`;

// The ring on the pool page sits here in the captured viewport.
const RING = { x: 996, y: 600 };

export const BEATS: BeatSpec[] = [
  {
    stream: 'sponsor',
    tag: 'Sponsor',
    title: 'A sponsor sets the rules',
    body: 'A 1:1 match, up to 50 dSPYx per saver, vesting over 3 minutes. That is a demo timescale: a real pool vests over months.',
    steps: [
      {
        shot: 'wizard-details',
        frames: 70,
        camera: [
          { at: 4, zoom: 1.45, focus: { box: 'name' } },
          { at: 38, zoom: 1 },
        ],
        clicks: [{ at: 58, target: 'cta' }],
      },
      {
        shot: 'wizard-rules',
        frames: 86,
        camera: [
          { at: 4, zoom: 1.5, focus: { box: 'vesting', dx: 220 } },
          { at: 46, zoom: 1 },
        ],
        clicks: [
          { at: 30, target: 'vesting' },
          { at: 72, target: 'cta' },
        ],
      },
      {
        shot: 'wizard-fund-empty',
        frames: 58,
        camera: [{ at: 4, zoom: 1.5, focus: { box: 'faucet', dx: 220 } }],
        clicks: [{ at: 38, target: 'faucet' }],
      },
      {
        shot: 'wizard-fund',
        frames: 72,
        camera: [
          { at: 4, zoom: 1.4, focus: { box: 'reach' } },
          { at: 40, zoom: 1 },
        ],
        clicks: [{ at: 60, target: 'cta' }],
      },
    ],
  },
  {
    stream: 'sponsor',
    tag: 'Sponsor',
    title: 'One transaction locks the budget',
    body: "Before anyone signs, the review says what the token's issuer and the program's upgrade authority can do.",
    steps: [
      {
        shot: 'wizard-review',
        frames: 140,
        camera: [
          { at: 6, zoom: 1.45, focus: { box: 'disclosure', dy: 120 } },
          { at: 96, zoom: 1 },
        ],
        clicks: [{ at: 124, target: 'cta' }],
        events: [
          {
            at: 130,
            event: {
              strand: 'sponsor',
              kind: 'create',
              instruction: 'create_pool + fund_match',
              who: 'Sponsor',
              signature: tx('createPool'),
            },
          },
        ],
      },
      {
        shot: 'pool-new',
        frames: 70,
        camera: [{ at: 4, zoom: 1.25, focus: { x: 560, y: 470 } }],
        cursor: false,
      },
    ],
  },
  {
    stream: 'saver',
    tag: 'Saver A',
    title: 'A saver deposits, and the match is reserved at once',
    body: "40 dSPYx in, and 40 dSPYx of the sponsor's budget set aside for this saver in the same transaction. Demo tokens come from the app's faucet.",
    steps: [
      {
        shot: 'deposit-empty',
        frames: 60,
        camera: [{ at: 4, zoom: 1.5, focus: { box: 'faucet', dx: 120 } }],
        clicks: [{ at: 38, target: 'faucet' }],
      },
      {
        shot: 'deposit-preview',
        frames: 92,
        camera: [{ at: 4, zoom: 1.45, focus: { box: 'panel', dy: 40 } }],
        clicks: [{ at: 74, target: 'cta' }],
        events: [
          {
            at: 80,
            event: {
              strand: 'saver',
              kind: 'deposit',
              instruction: 'deposit',
              who: 'Saver A',
              signature: tx('depositA'),
            },
          },
        ],
      },
      {
        shot: 'deposit-done',
        frames: 80,
        camera: [{ at: 4, zoom: 1.45, focus: { x: 996, y: 330 } }],
        cursor: false,
        events: [
          {
            at: 56,
            event: {
              strand: 'saver',
              kind: 'deposit',
              instruction: 'deposit',
              who: 'Saver B',
              signature: tx('depositB'),
            },
          },
        ],
      },
    ],
  },
  {
    stream: 'both',
    tag: 'Vesting',
    title: 'The match vests in a straight line',
    body: 'The ticks around the ring fill as it vests. Here that takes 3 minutes; a real pool would take months.',
    steps: [
      {
        shot: 'vest-1',
        frames: 64,
        camera: [{ at: 0, zoom: 1.6, focus: RING }],
        cursor: false,
        badge: sinceDeposit('vest-1'),
      },
      {
        shot: 'vest-2',
        frames: 48,
        camera: [{ at: 0, zoom: 1.6, focus: RING }],
        cursor: false,
        badge: sinceDeposit('vest-2'),
      },
      {
        shot: 'vest-3',
        frames: 60,
        camera: [{ at: 0, zoom: 1.6, focus: RING }],
        cursor: false,
        badge: sinceDeposit('vest-3'),
      },
    ],
  },
  {
    stream: 'saver',
    tag: 'Saver B',
    title: 'Leave early, and see the cost first',
    body: 'About halfway in, Saver B withdraws. The whole deposit comes back, the vested match stays theirs, and the rest returns to the sponsor.',
    steps: [
      {
        shot: 'withdraw-preview',
        frames: 150,
        camera: [{ at: 6, zoom: 1.55, focus: { box: 'dialog' } }],
        clicks: [{ at: 128, target: 'cta' }],
        events: [
          {
            at: 134,
            event: {
              strand: 'saver',
              kind: 'withdraw',
              instruction: 'withdraw',
              who: 'Saver B',
              signature: tx('withdrawB'),
            },
          },
        ],
      },
      {
        shot: 'withdraw-done',
        frames: 62,
        camera: [{ at: 4, zoom: 1.35, focus: { x: 996, y: 250 } }],
        cursor: false,
      },
    ],
  },
  {
    stream: 'saver',
    tag: 'Saver A',
    title: 'Stay, and claim what has vested',
    body: 'Saver A claims about two minutes in. The tokens move to their wallet, and the rest keeps vesting until all 40 are theirs.',
    steps: [
      {
        shot: 'mymatch-claim',
        frames: 98,
        camera: [
          { at: 4, zoom: 1.35, focus: { x: 900, y: 380 } },
          { at: 52, zoom: 1 },
        ],
        clicks: [{ at: 80, target: 'claim' }],
        events: [
          {
            at: 86,
            event: {
              strand: 'saver',
              kind: 'claim',
              instruction: 'claim_vested',
              who: 'Saver A',
              signature: tx('claimA'),
            },
          },
        ],
      },
      {
        shot: 'claim-done',
        frames: 64,
        camera: [{ at: 4, zoom: 1.35, focus: { x: 700, y: 440 } }],
        cursor: false,
      },
      {
        shot: 'vest-4',
        frames: 72,
        camera: [{ at: 4, zoom: 1.6, focus: RING }],
        cursor: false,
        badge: `${sinceDeposit('vest-4')}: fully vested`,
      },
    ],
  },
  {
    stream: 'chain',
    tag: 'On-chain',
    title: 'Every step is a transaction you can check',
    body: "Each action links to Solana Explorer, and the pool's activity feed is re-read from the chain before it is shown.",
    steps: [
      {
        shot: 'explorer-deposit',
        frames: 84,
        camera: [{ at: 4, zoom: 1.3, focus: { x: 640, y: 330 } }],
        cursor: false,
      },
      {
        shot: 'pool-activity',
        frames: 100,
        camera: [{ at: 4, zoom: 1.25, focus: { x: 460, y: 640 } }],
        cursor: false,
      },
    ],
  },
];

export const TIMELINE = buildTimeline(BEATS);
