import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className,
  containerClassName 
}) => {
  return (
    <div className={cn("flex-1 overflow-auto", className)}>
      <div className={cn(
        "container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-full min-w-0",
        containerClassName
      )}>
        {children}
      </div>
    </div>
  );
};