// Adapted from Motion Primitives (MIT). See THIRD_PARTY_NOTICES.md.
'use client';
import { cn } from '@/lib/utils';
import { type Transition, motion } from 'motion/react';
import {
  Children,
  cloneElement,
  type ReactElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type AnimatedBackgroundProps = {
  children:
    | ReactElement<{ 'data-id': string }>[]
    | ReactElement<{ 'data-id': string }>;
  defaultValue?: string;
  value?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
};

export function AnimatedBackground({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null);
  const uniqueId = useId();
  const controlled = value !== undefined;
  const resolvedId = controlled ? value : activeId;
  const hasMatch = Children.toArray(children).some(
    (child: any) => child?.props?.['data-id'] === resolvedId,
  );
  const hadMatchRef = useRef(hasMatch);

  useEffect(() => {
    hadMatchRef.current = hasMatch;
  }, [hasMatch]);

  const handleSetActiveId = (id: string | null) => {
    if (!controlled) setActiveId(id);
    onValueChange?.(id);
  };

  useEffect(() => {
    if (!controlled && defaultValue !== undefined) {
      setActiveId(defaultValue);
    }
  }, [controlled, defaultValue]);

  return Children.map(children, (child: any, index) => {
    const id = child.props['data-id'];
    const isActive = resolvedId === id;

    const interactionProps = enableHover
      ? {
          onMouseEnter: () => handleSetActiveId(id),
          onMouseLeave: () => handleSetActiveId(null),
        }
      : {
          onClick: (event: React.MouseEvent) => {
            child.props.onClick?.(event);
            if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) handleSetActiveId(id);
          },
        };

    return cloneElement(
      child,
      {
        key: index,
        className: cn('relative inline-flex', child.props.className),
        'data-checked': isActive ? 'true' : 'false',
        ...interactionProps,
      },
      <>
        {isActive && (
          <motion.div
            data-nav-pill
            aria-hidden='true'
            layoutId={`background-${uniqueId}`}
            style={{ borderRadius: 9999 }}
            className={cn('absolute inset-0', className)}
            transition={transition}
            initial={{ opacity: hadMatchRef.current ? 1 : 0 }}
            animate={{ opacity: 1 }}
          />
        )}
        <span className='relative z-10'>{child.props.children}</span>
      </>
    );
  });
}
