import { describe, expect, it } from 'vitest';

import {
  DEMO_PROJECTS,
  getDemoMilestoneQueue,
  getDemoProjectBySlug,
  getDemoProjectSplit,
} from './projects';
import { DEMO_IMPACT_ENTRIES } from './impact';

describe('demo project data', () => {
  it('has a unique slug and id per project', () => {
    const slugs = DEMO_PROJECTS.map((p) => p.slug);
    const ids = DEMO_PROJECTS.map((p) => p.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves a project by slug', () => {
    expect(getDemoProjectBySlug('rio-verde-water-treatment')?.name).toBe(
      'Río Verde Water Treatment Plant',
    );
    expect(getDemoProjectBySlug('does-not-exist')).toBeUndefined();
  });

  it('keeps raisedAmount equal to the sum of its positions', () => {
    for (const project of DEMO_PROJECTS) {
      const split = getDemoProjectSplit(project);
      expect(split.publicAmount + split.privateAmount).toBe(
        Number(project.raisedAmount),
      );
    }
  });

  it('never raises more than the funding goal', () => {
    for (const project of DEMO_PROJECTS) {
      expect(Number(project.raisedAmount)).toBeLessThanOrEqual(
        Number(project.goalAmount),
      );
    }
  });

  it('gives every milestone a unique, sequential order per project', () => {
    for (const project of DEMO_PROJECTS) {
      const orders = project.milestones
        .map((m) => m.order)
        .sort((a, b) => a - b);
      expect(orders).toEqual(
        Array.from({ length: orders.length }, (_, i) => i + 1),
      );
    }
  });

  it('only sets verifiedAt on VERIFIED milestones', () => {
    for (const project of DEMO_PROJECTS) {
      for (const milestone of project.milestones) {
        expect(milestone.verifiedAt !== null).toBe(
          milestone.status === 'VERIFIED',
        );
      }
    }
  });

  it('only attaches impact entries to a milestone that is already verified', () => {
    for (const entry of DEMO_IMPACT_ENTRIES) {
      const project = getDemoProjectBySlug(
        DEMO_PROJECTS.find((p) => p.id === entry.projectId)?.slug ?? '',
      );
      const milestone = project?.milestones.find(
        (m) => m.id === entry.milestoneId,
      );
      expect(milestone?.status).toBe('VERIFIED');
    }
  });

  it('queues every non-verified milestone with its project name attached', () => {
    const queue = getDemoMilestoneQueue();
    const expectedCount = DEMO_PROJECTS.flatMap((p) => p.milestones).filter(
      (m) => m.status !== 'VERIFIED',
    ).length;
    expect(queue).toHaveLength(expectedCount);
    for (const entry of queue) {
      expect(entry.projectName).toBeTruthy();
      expect(entry.status).not.toBe('VERIFIED');
    }
  });
});
