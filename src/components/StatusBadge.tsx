import { Badge } from './ui/badge';
import { Clock, Plus, Edit, Trash2 } from 'lucide-react';

interface StatusBadgeProps {
  isNew?: boolean;
  recordHash?: string;
  updatedAt?: string;
  isPendingDeletion?: boolean;
  status?: 'new' | 'updated' | 'unchanged' | 'pending_deletion' | 'deleted';
  row?: any; // The full row data to check pending_deletion field
  tableStructure?: any; // Dynamic table structure as backup
}

export function StatusBadge({ isNew, recordHash, updatedAt, isPendingDeletion, status, row, tableStructure }: StatusBadgeProps) {
  // Priority 1: Check for deletion status first - strictly from row.pending_deletion
  const isDeleted = row?.pending_deletion === true || 
                   status === 'deleted' || 
                   status === 'pending_deletion' || 
                   isPendingDeletion;
  
  if (isDeleted) {
    return (
      <Badge variant="destructive" className="text-xs gap-1 bg-orange-100 text-orange-700 border-orange-300">
        <Trash2 className="h-3 w-3" />
        Apagado
      </Badge>
    );
  }

  // Priority 2: Check for new records
  if (status === 'new' || isNew) {
    return (
      <Badge variant="default" className="text-xs gap-1 bg-green-100 text-green-700 border-green-300">
        <Plus className="h-3 w-3" />
        Novo
      </Badge>
    );
  }

  // Priority 3: Check for updated records
  if (status === 'updated') {
    return (
      <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 border-blue-300">
        <Edit className="h-3 w-3" />
        Atualizado
      </Badge>
    );
  }

  // Priority 4: Synchronized/unchanged records
  if (status === 'unchanged') {
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Clock className="h-3 w-3" />
        Sincronizado
      </Badge>
    );
  }

  // Fallback to legacy logic for backward compatibility
  if (updatedAt) {
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const diffHours = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return (
        <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 border-blue-300">
          <Edit className="h-3 w-3" />
          Atualizado
        </Badge>
      );
    }
  }

  return (
    <Badge variant="outline" className="text-xs gap-1">
      <Clock className="h-3 w-3" />
      Sincronizado
    </Badge>
  );
}
