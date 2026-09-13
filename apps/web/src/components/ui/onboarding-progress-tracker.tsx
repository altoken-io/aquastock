import { cn } from '@/utils/classNames';

type OnboardingProgressTrackerProps = {
  steps: Array<{
    key: string;
    completed: boolean;
    active?: boolean;
  }>;
  className?: string;
};

const OnboardingProgressTracker = ({
  steps,
  className,
}: OnboardingProgressTrackerProps) => {
  return (
    <div className={cn('flex items-center justify-center gap-6', className)}>
      {steps.map((step) => (
        <div
          key={step.key}
          className={cn(
            'relative h-2 w-16 rounded-full bg-neutral-200 transition-all dark:bg-neutral-700',
            step.active &&
              'ring-1 ring-emerald-400/70 shadow-[0_0_10px_rgba(52,211,153,0.45)]',
          )}
        >
          <div
            className={cn(
              'absolute left-0 h-full rounded-full bg-emerald-600 transition-all',
              step.completed ? 'w-full' : 'w-0',
            )}
          />
        </div>
      ))}
    </div>
  );
};

export default OnboardingProgressTracker;
