import { MapPin } from 'lucide-react';

import type { Project, ProjectStatus } from '@aquastock/types';
import { Link } from '@/lib/i18n/navigation';
import { cn } from '@/utils/classNames';
import { getDemoProjectSplit } from '@/lib/demo/projects';
import { FundingSplitBar } from './funding-split-bar';
import { ProjectImagePlaceholder } from './project-image-placeholder';

const STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'border-border/70 bg-muted/60 text-muted-foreground',
  ACTIVE: 'border-primary/25 bg-primary/10 text-primary',
  FUNDED: 'border-ok/30 bg-ok/10 text-ok',
  COMPLETED: 'border-ok/30 bg-ok/10 text-ok',
  CLOSED: 'border-border/70 bg-muted/60 text-muted-foreground',
};

export function ProjectCard({
  project,
  statusLabel,
  raisedLabel,
  governmentLabel,
  communityLabel,
  formatAmount,
  className,
}: {
  project: Project & { summary: string };
  statusLabel: string;
  raisedLabel: string;
  governmentLabel: string;
  communityLabel: string;
  formatAmount: (value: number) => string;
  className?: string;
}) {
  const split = getDemoProjectSplit(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        'dapp-panel-hover group flex flex-col overflow-hidden rounded-2xl border border-border/85 bg-card shadow-sm transition-colors',
        className,
      )}
    >
      <div className="relative p-3 pb-0">
        <ProjectImagePlaceholder seed={project.slug} ratio="card" />
        <span
          className={cn(
            'absolute top-5 right-5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm',
            STATUS_STYLES[project.status],
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-primary">
            {project.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {project.location}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {project.summary}
          </p>
        </div>
        <FundingSplitBar
          goalAmount={split.goalAmount}
          publicAmount={split.publicAmount}
          privateAmount={split.privateAmount}
          raisedLabel={raisedLabel}
          governmentLabel={governmentLabel}
          communityLabel={communityLabel}
          formatAmount={formatAmount}
          className="mt-auto"
        />
      </div>
    </Link>
  );
}
