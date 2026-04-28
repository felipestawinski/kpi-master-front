import React, { useEffect, useRef, useState, ReactNode, RefObject } from 'react';

interface MessageRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  className?: string;
  /** When false (default for history), skip the reveal animation and render instantly */
  animate?: boolean;
}

const MessageReveal: React.FC<MessageRevealProps> = ({
  children,
  scrollContainerRef,
  className = '',
  animate = false,
}) => {
  const elRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) return; // Skip observer entirely for historical messages

    const el = elRef.current;
    if (!el) return;

    const root = scrollContainerRef?.current ?? null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        root,
        threshold: 0.05,
        rootMargin: '0px 0px 0px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [animate, scrollContainerRef]);

  return (
    <div
      ref={elRef}
      className={className}
      style={animate ? {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
      } : undefined}
    >
      {children}
    </div>
  );
};

export default MessageReveal;
