'use client';

import { cn } from '@/utils/classNames';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface ComboboxProps {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  value?: string;
  options: ComboboxOption[];
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string | string[];
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  labelClassName?: string;
  parentClassName?: string;
}

export function Combobox({
  label,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  value = '',
  options,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  name,
  className,
  labelClassName,
  parentClassName,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const hasError = Boolean(error);
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((option) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      option.subtitle?.toLowerCase().includes(searchLower)
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onBlur]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        setSearchQuery('');
        setHighlightedIndex(0);
      }
    }
  }, [disabled, isOpen]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      setSearchQuery('');
    },
    [onChange],
  );

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHighlightedIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (isOpen && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          } else {
            handleToggle();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev,
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;
        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchQuery('');
          }
          break;
      }
    },
    [
      disabled,
      isOpen,
      filteredOptions,
      highlightedIndex,
      handleSelect,
      handleToggle,
    ],
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col gap-2', parentClassName)}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          className={cn(
            'text-start text-base max-sm:text-sm font-medium',
            labelClassName,
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Hidden input for form validation */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          aria-invalid={hasError || undefined}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'relative flex items-center justify-between gap-2 w-full px-4 py-2 h-[42px] text-base',
          'border border-neutral-300/75 dark:border-neutral-700/75 rounded-md',
          'bg-neutral-50 dark:bg-neutral-900',
          'transition ease-in-out',
          'focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-400/75 dark:focus-visible:ring-blue-600/75',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-red-400 ring-red-400/20 dark:ring-red-400/40',
          className,
        )}
      >
        <span
          className={cn(
            'truncate text-left',
            !selectedOption && 'text-neutral-400/75 dark:text-neutral-600/75',
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <X
              className="size-4 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onClick={handleClear}
            />
          )}
          <ChevronsUpDown className="size-4 text-neutral-500 dark:text-neutral-400" />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 top-full',
            'border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg',
            'bg-white dark:bg-neutral-900',
            'max-h-[300px] flex flex-col',
          )}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative flex items-center">
              <Search className="absolute left-2 size-4 text-neutral-400 dark:text-neutral-600" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full pl-8 pr-3 py-1.5 text-sm',
                  'border border-neutral-300/75 dark:border-neutral-700/75 rounded',
                  'bg-neutral-50 dark:bg-neutral-950',
                  'focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-400/75 dark:focus-visible:ring-blue-600/75',
                  'placeholder:text-neutral-400/75 dark:placeholder:text-neutral-600/75',
                )}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="overflow-y-auto flex-1 py-1"
            style={{ maxHeight: '250px' }}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-center text-neutral-500 dark:text-neutral-400">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 cursor-pointer text-sm',
                      'transition-colors',
                      isHighlighted && 'bg-neutral-100 dark:bg-neutral-800',
                      isSelected &&
                        'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.subtitle && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {typeof error === 'string' && (
        <p
          role="alert"
          className="text-start text-sm max-sm:text-xs text-red-500"
        >
          {error}
        </p>
      )}
      {Array.isArray(error) &&
        error.map((err, i) => (
          <p
            key={`${i}-${err}`}
            role="alert"
            className="text-start text-sm max-sm:text-xs text-red-500"
          >
            {err}
          </p>
        ))}
    </div>
  );
}
