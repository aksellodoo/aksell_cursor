import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ValidationIndicatorProps {
  isValid?: boolean;
  hasWarning?: boolean;
  errorCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ValidationIndicator = ({ 
  isValid = true, 
  hasWarning = false, 
  errorCount = 0,
  className = '',
  size = 'md'
}: ValidationIndicatorProps) => {
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  if (errorCount > 0) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <XCircle className={cn(iconSize, 'text-destructive')} />
        <Badge variant="destructive" className="text-xs">
          {errorCount}
        </Badge>
      </div>
    );
  }

  if (hasWarning) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <AlertTriangle className={cn(iconSize, 'text-orange-500')} />
        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
          !
        </Badge>
      </div>
    );
  }

  if (isValid) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <CheckCircle className={cn(iconSize, 'text-green-500')} />
      </div>
    );
  }

  return null;
};