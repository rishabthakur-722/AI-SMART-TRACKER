import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ children, content, position = 'top', className }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1C1C28] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1C1C28] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1C1C28] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1C1C28] border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <div
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-xs rounded-lg border border-white/10 bg-[#1C1C28] px-3 py-2 text-xs font-medium text-white/90 shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100',
          positionClasses[position]
        )}
      >
        {content}
        <div
          className={cn('absolute border-4', arrowClasses[position])}
        />
      </div>
    </div>
  );
}
