import React from 'react';
import { ChevronRight, Building2, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/pages/DocumentManagement';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onItemClick: (item: BreadcrumbItem) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onItemClick }) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <span>Nenhuma pasta selecionada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-4 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onItemClick(item)}
            className={cn(
              'flex items-center gap-2 h-auto p-1 font-normal',
              index === items.length - 1 
                ? 'text-foreground cursor-default' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            disabled={index === items.length - 1}
          >
            {item.type === 'department' ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
            <span className="truncate max-w-32">{item.name}</span>
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
};