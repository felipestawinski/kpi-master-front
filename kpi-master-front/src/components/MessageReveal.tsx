import React, { useEffect, useRef, useState, ReactNode, RefObject } from 'react';

interface MessageRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const MessageReveal: React.FC<MessageRevealProps> = ({
  children,
  scrollContainerRef,
  className = '',
}) => {
  const elRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  }, [scrollContainerRef]);

  return (
    <div
      ref={elRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
      }}
    >
      {children}
    </div>
  );
};

export default MessageReveal;
