'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/classNames';

interface TypewriterProps {
  words: string[];
  className?: string;
  delay?: number;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function Typewriter({
  words,
  className,
  delay = 0,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 3000,
}: TypewriterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(delay === 0);

  useEffect(() => {
    if (isReady) return;
    const timeout = setTimeout(() => setIsReady(true), delay);
    return () => clearTimeout(timeout);
  }, [delay, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const currentWord = words[currentWordIndex];

    const timeout = setTimeout(
      () => {
        if (isPaused) {
          setIsPaused(false);
          setIsDeleting(true);
          return;
        }

        if (isDeleting) {
          // Deleting text
          if (currentText === '') {
            setIsDeleting(false);
            setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
          } else {
            setCurrentText(currentWord.substring(0, currentText.length - 1));
          }
        } else {
          // Typing text
          if (currentText === currentWord) {
            setIsPaused(true);
          } else {
            setCurrentText(currentWord.substring(0, currentText.length + 1));
          }
        }
      },
      isPaused ? pauseDuration : isDeleting ? deletingSpeed : typingSpeed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentText,
    currentWordIndex,
    isDeleting,
    isPaused,
    words,
    typingSpeed,
    deletingSpeed,
    isReady,
    pauseDuration,
  ]);

  return (
    <span className={cn('inline', className)}>
      {currentText}
      <span className="ml-1 inline-block h-[1em] w-[3px] animate-blink bg-current align-middle" />
    </span>
  );
}
