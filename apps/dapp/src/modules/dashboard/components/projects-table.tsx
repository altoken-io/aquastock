import type { Project, ProjectStatus } from '@aquastock/types';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';
import { getDemoProjectSplit, type DemoProject } from '@/lib/demo/projects';

export function ProjectsTable({
  projects,
  columnLabels,
  statusLabels,
  milestonesLabel,
  formatAmount,
  className,
}: {
  projects: readonly DemoProject[];
  columnLabels: {
    project: string;
    status: string;
    goal: string;
    raised: string;
  };
  statusLabels: Record<ProjectStatus, string>;
  milestonesLabel: (verified: number, total: number) => string;
  formatAmount: (value: number) => string;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <th className="pb-3 pr-4 font-medium">{columnLabels.project}</th>
            <th className="pb-3 pr-4 font-medium">{columnLabels.status}</th>
            <th className="pb-3 pr-4 font-medium">{columnLabels.goal}</th>
            <th className="pb-3 font-medium">{columnLabels.raised}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {projects.map((project) => {
            const split = getDemoProjectSplit(project as Project);
            const verified = project.milestones.filter(
              (m) => m.status === 'VERIFIED',
            ).length;

            return (
              <tr key={project.id}>
                <td className="py-3 pr-4">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {project.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {project.location} ·{' '}
                    {milestonesLabel(verified, project.milestones.length)}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-1 text-xs whitespace-nowrap">
                    {statusLabels[project.status]}
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums whitespace-nowrap">
                  {formatAmount(split.goalAmount)}
                </td>
                <td className="py-3 tabular-nums whitespace-nowrap">
                  {formatAmount(split.raisedAmount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
