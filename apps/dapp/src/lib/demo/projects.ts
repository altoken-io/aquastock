import type {
  InvestorType,
  Milestone,
  Position,
  Project,
} from '@aquastock/types';

/**
 * Static, checked-in demo dataset for the AquaStock dApp's investor-facing
 * screens (project list/detail, My Impact) and the admin console. There is
 * no Solana Anchor program and no route handlers over packages/db-prisma yet
 * (docs/ROADMAP.md) — everything here is illustrative, devnet-hackathon-demo
 * data, not a live feed. Every wallet address reuses the same obviously-fake
 * repeated-digit convention as packages/db-prisma/seed.ts. Amounts are in
 * whole USD-equivalent units for display only.
 *
 * Government ("public") positions all share one wallet on purpose — the
 * same anchor institution funding across projects. Community ("private")
 * positions get a distinct fake wallet per project.
 */

const GOVERNMENT_WALLET = '11111111111111111111111111111111';

export type DemoProject = Project & {
  /** One-line card/summary copy — UI-only enrichment, not part of the shared transport type. */
  readonly summary: string;
};

function position(
  id: string,
  projectId: string,
  investorType: Position['investorType'],
  walletAddress: string,
  amount: number,
  createdAt: string,
  txSignature: string | null,
): Position {
  return {
    id,
    projectId,
    investorType,
    walletAddress,
    amount: String(amount),
    txSignature,
    onchainAddress: null,
    createdAt,
  };
}

function milestone(
  id: string,
  projectId: string,
  order: number,
  title: string,
  description: string,
  status: Milestone['status'],
  verifiedAt: string | null,
): Milestone {
  return {
    id,
    projectId,
    title,
    description,
    targetAmount: null,
    status,
    order,
    verifiedAt,
    onchainAddress: null,
  };
}

export const DEMO_PROJECTS: readonly DemoProject[] = [
  {
    id: 'proj_rio-verde',
    slug: 'rio-verde-water-treatment',
    name: 'Río Verde Water Treatment Plant',
    summary:
      'A new treatment plant bringing certified drinking water to five neighborhoods above the Río Verde watershed.',
    description:
      'Replaces an aging, undersized filtration system with a plant sized for the growing settlements above the watershed.',
    location: 'Cusco Region, Peru',
    goalAmount: '180000',
    raisedAmount: '150000',
    status: 'ACTIVE',
    onchainAddress: null,
    positions: [
      position(
        'pos_rio-verde_public',
        'proj_rio-verde',
        'PUBLIC',
        GOVERNMENT_WALLET,
        96000,
        '2026-02-10T00:00:00.000Z',
        'DEMOtx1PublicRioVerdeAnchorPosition',
      ),
      position(
        'pos_rio-verde_private',
        'proj_rio-verde',
        'PRIVATE',
        '22222222222222222222222222222222',
        54000,
        '2026-02-20T00:00:00.000Z',
        'DEMOtx1PrivateRioVerdeCommunityFund',
      ),
    ],
    milestones: [
      milestone(
        'ms_rio-verde_1',
        'proj_rio-verde',
        1,
        'Site assessment',
        'Watershed survey and soil testing at the plant site.',
        'VERIFIED',
        '2026-03-02T00:00:00.000Z',
      ),
      milestone(
        'ms_rio-verde_2',
        'proj_rio-verde',
        2,
        'Equipment procurement',
        'Filtration and chlorination equipment ordered and received.',
        'VERIFIED',
        '2026-05-18T00:00:00.000Z',
      ),
      milestone(
        'ms_rio-verde_3',
        'proj_rio-verde',
        3,
        'Pipeline installation',
        'Distribution pipeline connecting the plant to the five neighborhoods.',
        'IN_PROGRESS',
        null,
      ),
      milestone(
        'ms_rio-verde_4',
        'proj_rio-verde',
        4,
        'Water quality certification',
        'Independent lab certification of treated water quality.',
        'PENDING',
        null,
      ),
      milestone(
        'ms_rio-verde_5',
        'proj_rio-verde',
        5,
        'Community handover',
        'Operations handed to the local water committee.',
        'PENDING',
        null,
      ),
    ],
  },
  {
    id: 'proj_altiplano',
    slug: 'altiplano-well-network',
    name: 'Altiplano Community Well Network',
    summary:
      'Six solar-pumped wells bringing year-round water access to herding communities on the altiplano.',
    description:
      'A network of six wells, each with a solar pump, replacing seasonal surface water that runs dry half the year.',
    location: 'Puno Region, Peru',
    goalAmount: '95000',
    raisedAmount: '70000',
    status: 'ACTIVE',
    onchainAddress: null,
    positions: [
      position(
        'pos_altiplano_public',
        'proj_altiplano',
        'PUBLIC',
        GOVERNMENT_WALLET,
        40000,
        '2026-03-05T00:00:00.000Z',
        'DEMOtx2PublicAltiplanoAnchorPosition',
      ),
      position(
        'pos_altiplano_private',
        'proj_altiplano',
        'PRIVATE',
        '33333333333333333333333333333333',
        30000,
        '2026-03-15T00:00:00.000Z',
        'DEMOtx2PrivateAltiplanoCommunityFund',
      ),
    ],
    milestones: [
      milestone(
        'ms_altiplano_1',
        'proj_altiplano',
        1,
        'Site survey',
        'Hydrogeological survey across the six well sites.',
        'VERIFIED',
        '2026-04-01T00:00:00.000Z',
      ),
      milestone(
        'ms_altiplano_2',
        'proj_altiplano',
        2,
        'Drilling permits',
        'Municipal drilling permits secured for all six sites.',
        'VERIFIED',
        '2026-06-10T00:00:00.000Z',
      ),
      milestone(
        'ms_altiplano_3',
        'proj_altiplano',
        3,
        'Well drilling',
        'Drilling and casing across the six well sites.',
        'IN_PROGRESS',
        null,
      ),
      milestone(
        'ms_altiplano_4',
        'proj_altiplano',
        4,
        'Solar pump installation',
        'Solar pump and storage tank installed at each well.',
        'PENDING',
        null,
      ),
    ],
  },
  {
    id: 'proj_costa-norte',
    slug: 'costa-norte-desalination-pilot',
    name: 'Costa Norte Desalination Pilot',
    summary:
      'A small-scale desalination unit for a coastal fishing community with no reliable freshwater source.',
    description:
      'A pilot desalination unit sized for one coastal community, built to inform a larger regional rollout if it performs.',
    location: 'Piura Region, Peru',
    goalAmount: '220000',
    raisedAmount: '220000',
    status: 'FUNDED',
    onchainAddress: null,
    positions: [
      position(
        'pos_costa-norte_public',
        'proj_costa-norte',
        'PUBLIC',
        GOVERNMENT_WALLET,
        140000,
        '2025-10-01T00:00:00.000Z',
        'DEMOtx3PublicCostaNorteAnchorPosition',
      ),
      position(
        'pos_costa-norte_private',
        'proj_costa-norte',
        'PRIVATE',
        '44444444444444444444444444444444',
        80000,
        '2025-10-10T00:00:00.000Z',
        'DEMOtx3PrivateCostaNorteCommunityFund',
      ),
    ],
    milestones: [
      milestone(
        'ms_costa-norte_1',
        'proj_costa-norte',
        1,
        'Feasibility study',
        'Salinity testing and site feasibility for the desalination unit.',
        'VERIFIED',
        '2025-11-20T00:00:00.000Z',
      ),
      milestone(
        'ms_costa-norte_2',
        'proj_costa-norte',
        2,
        'Environmental permit',
        'Brine discharge permit approved by the regional authority.',
        'VERIFIED',
        '2026-01-15T00:00:00.000Z',
      ),
      milestone(
        'ms_costa-norte_3',
        'proj_costa-norte',
        3,
        'Desalination unit installed',
        'Reverse-osmosis unit installed and pressure-tested on site.',
        'VERIFIED',
        '2026-04-22T00:00:00.000Z',
      ),
      milestone(
        'ms_costa-norte_4',
        'proj_costa-norte',
        4,
        'Water quality certification',
        'Independent lab certification of desalinated output.',
        'VERIFIED',
        '2026-07-30T00:00:00.000Z',
      ),
      milestone(
        'ms_costa-norte_5',
        'proj_costa-norte',
        5,
        'Commissioning',
        'Unit commissioned and handed to the community water board.',
        'IN_PROGRESS',
        null,
      ),
    ],
  },
  {
    id: 'proj_valle-sagrado',
    slug: 'valle-sagrado-irrigation-canal',
    name: 'Valle Sagrado Irrigation Canal Restoration',
    summary:
      'Restoring a pre-Hispanic irrigation canal that still feeds terraced farmland across the valley.',
    description:
      'Structural restoration of a stone-lined irrigation canal, reducing the seepage loss that has been shrinking farmable terrace area.',
    location: 'Cusco Region, Peru',
    goalAmount: '60000',
    raisedAmount: '8000',
    status: 'DRAFT',
    onchainAddress: null,
    positions: [
      position(
        'pos_valle-sagrado_public',
        'proj_valle-sagrado',
        'PUBLIC',
        GOVERNMENT_WALLET,
        8000,
        '2026-08-01T00:00:00.000Z',
        'DEMOtx4PublicValleSagradoAnchorPosition',
      ),
    ],
    milestones: [
      milestone(
        'ms_valle-sagrado_1',
        'proj_valle-sagrado',
        1,
        'Engineering survey',
        'Structural survey of the existing canal lining.',
        'IN_PROGRESS',
        null,
      ),
      milestone(
        'ms_valle-sagrado_2',
        'proj_valle-sagrado',
        2,
        'Canal restoration',
        'Relining the canal sections identified in the survey.',
        'PENDING',
        null,
      ),
      milestone(
        'ms_valle-sagrado_3',
        'proj_valle-sagrado',
        3,
        'Irrigation handover',
        'Operations handed to the terrace farmers’ irrigation committee.',
        'PENDING',
        null,
      ),
    ],
  },
] as const;

export function getDemoProjectBySlug(slug: string): DemoProject | undefined {
  return DEMO_PROJECTS.find((project) => project.slug === slug);
}

export function getFeaturedDemoProjects(limit = 3): readonly DemoProject[] {
  return DEMO_PROJECTS.filter((project) => project.status === 'ACTIVE').slice(
    0,
    limit,
  );
}

export function getDemoProjectSplit(project: Project): {
  publicAmount: number;
  privateAmount: number;
  goalAmount: number;
  raisedAmount: number;
} {
  const publicAmount = project.positions
    .filter((position) => position.investorType === 'PUBLIC')
    .reduce((sum, position) => sum + Number(position.amount), 0);
  const privateAmount = project.positions
    .filter((position) => position.investorType === 'PRIVATE')
    .reduce((sum, position) => sum + Number(position.amount), 0);

  return {
    publicAmount,
    privateAmount,
    goalAmount: Number(project.goalAmount),
    raisedAmount: Number(project.raisedAmount),
  };
}

export type MilestoneQueueEntry = Milestone & {
  readonly projectName: string;
  readonly projectSlug: string;
};

/** Milestones still awaiting verification, oldest project first — the admin console's core queue. */
export function getDemoMilestoneQueue(): readonly MilestoneQueueEntry[] {
  return DEMO_PROJECTS.flatMap((project) =>
    project.milestones
      .filter((milestone) => milestone.status !== 'VERIFIED')
      .map((milestone) => ({
        ...milestone,
        projectName: project.name,
        projectSlug: project.slug,
      })),
  );
}

export type DemoTotals = {
  readonly projectCount: number;
  readonly activeProjectCount: number;
  readonly milestonesVerified: number;
  readonly milestonesPending: number;
  readonly totalGoal: number;
  readonly totalRaised: number;
  readonly totalPublic: number;
  readonly totalPrivate: number;
};

export type DemoActivityEntry =
  | {
      readonly id: string;
      readonly kind: 'position_funded';
      readonly projectName: string;
      readonly projectSlug: string;
      readonly investorType: InvestorType;
      readonly amount: number;
      readonly occurredAt: string;
    }
  | {
      readonly id: string;
      readonly kind: 'milestone_verified';
      readonly projectName: string;
      readonly projectSlug: string;
      readonly milestoneTitle: string;
      readonly occurredAt: string;
    };

/** A chronological demo feed (funded positions + verified milestones), newest first. */
export function getDemoActivityFeed(limit = 8): readonly DemoActivityEntry[] {
  const entries: DemoActivityEntry[] = [];

  for (const project of DEMO_PROJECTS) {
    for (const pos of project.positions) {
      entries.push({
        id: `activity_${pos.id}`,
        kind: 'position_funded',
        projectName: project.name,
        projectSlug: project.slug,
        investorType: pos.investorType,
        amount: Number(pos.amount),
        occurredAt: pos.createdAt,
      });
    }
    for (const milestone of project.milestones) {
      if (milestone.status === 'VERIFIED' && milestone.verifiedAt) {
        entries.push({
          id: `activity_${milestone.id}`,
          kind: 'milestone_verified',
          projectName: project.name,
          projectSlug: project.slug,
          milestoneTitle: milestone.title,
          occurredAt: milestone.verifiedAt,
        });
      }
    }
  }

  return entries
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

export function getDemoTotals(): DemoTotals {
  return DEMO_PROJECTS.reduce<DemoTotals>(
    (totals, project) => {
      const split = getDemoProjectSplit(project);
      const verified = project.milestones.filter(
        (m) => m.status === 'VERIFIED',
      ).length;
      return {
        projectCount: totals.projectCount + 1,
        activeProjectCount:
          totals.activeProjectCount + (project.status === 'ACTIVE' ? 1 : 0),
        milestonesVerified: totals.milestonesVerified + verified,
        milestonesPending:
          totals.milestonesPending + (project.milestones.length - verified),
        totalGoal: totals.totalGoal + split.goalAmount,
        totalRaised: totals.totalRaised + split.raisedAmount,
        totalPublic: totals.totalPublic + split.publicAmount,
        totalPrivate: totals.totalPrivate + split.privateAmount,
      };
    },
    {
      projectCount: 0,
      activeProjectCount: 0,
      milestonesVerified: 0,
      milestonesPending: 0,
      totalGoal: 0,
      totalRaised: 0,
      totalPublic: 0,
      totalPrivate: 0,
    },
  );
}
