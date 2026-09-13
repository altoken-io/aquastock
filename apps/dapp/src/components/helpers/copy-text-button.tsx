'use client';

import { cn } from '@/utils/classNames';
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
// import Button, { ButtonProps } from "@/components/shared/ui/Button";

// export interface CopyTextButtonProps extends ButtonProps {
//   readonly text: string;
//   readonly children?: React.ReactNode;
// }

export interface CopyTextButtonProps extends ComponentProps<'button'> {
  readonly text?: string;
  readonly children?: ReactNode;
  readonly customCopyText?: ReactNode;
}

const CopyTextButton = ({
  children,
  className,
  text = 'No text provided',
  customCopyText = 'Copied!',
  ...props
}: CopyTextButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  // The explicit `text` prop is the intended copy value; `children` is only
  // a fallback for callers that render plain text as their own label (e.g.
  // <CopyTextButton>0x1234...</CopyTextButton> with no separate label/value).
  // Every real call site in this app passes both — a distinct button label
  // as children and the actual value via `text` — so `text` must win, or
  // every "Copy address" button copies its own label instead of the address.
  const value = useMemo(
    () => text ?? children?.toString() ?? '',
    [children, text],
  ).trim();

  const handleCopy = useCallback(async () => {
    try {
      // Copy text to clipboard
      await navigator.clipboard.writeText(value);

      // Update state
      setIsCopied(true);

      // Display toast notification
      toast.success('Text copied to clipboard');
    } catch (error) {
      console.error(`Failed to copy text: ${error}`);

      // Display toast notification
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  }, [value, setIsCopied]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(className, 'cursor-pointer')}
      {...props}
    >
      {isCopied ? customCopyText : children}
    </button>
  );
};

export default CopyTextButton;
