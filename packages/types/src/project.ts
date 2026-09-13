/**
 * Transport-layer (JSON-serialisable) mirrors of the off-chain Project
 * schema (packages/db-prisma) and the Solana Anchor program's account
 * types. Shared between apps/dapp's route handlers and its UI.
 */

export type ProjectStatus =
  'DRAFT' | 'ACTIVE' | 'FUNDED' | 'COMPLETED' | 'CLOSED';
export type InvestorType = 'PUBLIC' | 'PRIVATE';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED';

export interface Position {
  readonly id: string;
  readonly projectId: string;
  readonly investorType: InvestorType;
  readonly walletAddress: string;
  readonly amount: string;
  readonly txSignature: string | null;
  readonly onchainAddress: string | null;
  readonly createdAt: string;
}

export interface Milestone {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly description: string | null;
  readonly targetAmount: string | null;
  readonly status: MilestoneStatus;
  readonly order: number;
  readonly verifiedAt: string | null;
  readonly onchainAddress: string | null;
}

export interface Impact {
  readonly id: string;
  readonly projectId: string;
  readonly milestoneId: string | null;
  readonly metric: string;
  readonly value: string;
  readonly recordedAt: string;
  readonly onchainAddress: string | null;
}

export interface Project {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly location: string;
  readonly goalAmount: string;
  readonly raisedAmount: string;
  readonly status: ProjectStatus;
  readonly onchainAddress: string | null;
  readonly positions: readonly Position[];
  readonly milestones: readonly Milestone[];
}
