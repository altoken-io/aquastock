import { cn } from '@/utils/classNames';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { ComponentPropsWithRef, ComponentType, FC } from 'react';
import Button, { type ButtonProps } from '@/components/ui/my-button';

export type SubmitButtonProps = Omit<ComponentPropsWithRef<'button'>, 'type'> &
  Readonly<{
    Loader?: ComponentType<{ className?: string }>;
    loaderText?: string;
    loaderClassName?: string;
    isSubmitting?: boolean;
  }> &
  ButtonProps;

export const SubmitButton: FC<SubmitButtonProps> = ({
  children,
  className,
  loaderClassName,
  Loader = Loader2,
  loaderText,
  isSubmitting,
  ...props
}) => {
  const { pending } = useFormStatus();

  const isLoading = pending || isSubmitting;

  return (
    <Button
      type="submit"
      disabled={isLoading}
      aria-busy={isLoading}
      className={cn(
        className,
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none',
      )}
      {...props}
    >
      {isLoading ? (
        <>
          {loaderText && <span>{loaderText}</span>}
          <Loader className={cn('h-5 w-5 animate-spin', loaderClassName)} />
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default SubmitButton;
