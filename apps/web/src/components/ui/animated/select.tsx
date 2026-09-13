'use client';

import {
  ComponentProps,
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react-dom';

import { cn } from '@/utils/classNames';

type SelectContextType = {
  selectedOption?: string;
  setSelectedOption: Dispatch<SetStateAction<string | undefined>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  toggleSelect: () => void;
  handleOpen: () => void;
  handleClose: () => void;
  handleOnChange: (value: string | undefined) => void;
  referenceRef: (node: HTMLButtonElement | null) => void;
  floatingRef: (node: HTMLDivElement | null) => void;
  floatingStyles: React.CSSProperties;
};

const SelectContext = createContext<SelectContextType | null>(null);

export const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useSelect must be used within a SelectProvider');
  }
  return context;
};

export type SelectProps = ComponentProps<'div'> & {
  children: ReactNode;
};

export const Select = ({ children, ...props }: SelectProps) => {
  const [selectedOption, setSelectedOption] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ fallbackStrategy: 'bestFit' }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements, availableHeight }) {
          elements.floating.style.minWidth = `${rects.reference.width}px`;
          elements.floating.style.maxHeight = `${availableHeight}px`;
        },
      }),
    ],
  });

  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const toggleSelect = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleOnChange = useCallback((value: string | undefined) => {
    setSelectedOption(value);
    setIsOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      selectedOption,
      setSelectedOption,
      isOpen,
      setIsOpen,
      toggleSelect,
      handleOpen,
      handleClose,
      handleOnChange,
      referenceRef: refs.setReference,
      floatingRef: refs.setFloating,
      floatingStyles,
    }),
    [
      selectedOption,
      isOpen,
      toggleSelect,
      handleOpen,
      handleClose,
      handleOnChange,
      refs.setReference,
      refs.setFloating,
      floatingStyles,
    ],
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <select hidden aria-hidden value={selectedOption} />
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export type SelectTriggerProps = ComponentProps<'button'> & {
  children: ReactNode;
};

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, onClick, type = 'button', ...props }, forwardedRef) => {
    const { toggleSelect, referenceRef } = useSelect();

    const handleClick = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          toggleSelect();
        }
      },
      [onClick, toggleSelect],
    );

    const mergeRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        referenceRef(node);
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [referenceRef, forwardedRef],
    );

    return (
      <button {...props} type={type} ref={mergeRefs} onClick={handleClick}>
        {children}
      </button>
    );
  },
);

SelectTrigger.displayName = 'SelectTrigger';

export type SelectContentProps = ComponentProps<'div'> & {
  children: ReactNode;
};

export const SelectContent = ({
  children,
  className,
  style,
  ...props
}: SelectContentProps) => {
  const { isOpen, floatingRef, floatingStyles } = useSelect();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      {...props}
      ref={floatingRef}
      style={{ ...floatingStyles, ...style, zIndex: 9999 }}
      data-state={isOpen ? 'open' : 'closed'}
      aria-hidden={!isOpen}
      className={cn(
        'select-content z-9999 overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900',
        className,
      )}
    >
      {children}
    </div>
  );
};

export type SelectOptionProps = ComponentProps<'button'> & {
  children: ReactNode;
};

export const SelectOption = ({
  children,
  className,
  type = 'button',
  ...props
}: SelectOptionProps) => {
  const { handleOnChange } = useSelect();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      const value = event.currentTarget.value;

      handleOnChange(value);
    },
    [handleOnChange],
  );

  return (
    <button
      {...props}
      type={type}
      onClick={handleClick}
      className={cn(
        'flex w-full cursor-pointer rounded-md px-3 py-2 text-left hover:bg-neutral-200/75 dark:hover:bg-neutral-800/75',
        className,
      )}
    >
      {children}
    </button>
  );
};
