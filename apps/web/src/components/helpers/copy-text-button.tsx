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
  readonly customCopyText?: string;
}

const CopyTextButton = ({
  children,
  className,
  text = 'No text provided',
  customCopyText = 'Copied!',
  ...props
}: CopyTextButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const value = useMemo(
    () => children?.toString() ?? text,
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
