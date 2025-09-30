import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, RefreshCw, Archive, Eye, Trash2 } from 'lucide-react';
import { DocumentItem } from '@/pages/DocumentManagement';

interface DocumentActionsDropdownProps {
  document: DocumentItem;
  onAction: (action: string, documentId: string) => void;
}

export const DocumentActionsDropdown: React.FC<DocumentActionsDropdownProps> = ({
  document,
  onAction
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onAction('download', document.id)}
          disabled={(document as any).processing_status !== 'completed'}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onAction('reprocess', document.id)}
          disabled={(document as any).processing_status === 'processing'}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reprocessar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onAction('details', document.id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onAction('archive', document.id)}
          disabled={document.status === 'archived'}
        >
          <Archive className="h-4 w-4 mr-2" />
          Arquivar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onAction('delete', document.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};