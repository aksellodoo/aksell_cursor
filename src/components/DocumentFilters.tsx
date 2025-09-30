import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { DocumentTreeItem } from '@/pages/DocumentManagement';

interface DocumentFiltersProps {
  filters: {
    department: string;
    status: string;
    mimeType: string;
  };
  onFiltersChange: (filters: any) => void;
  tree?: DocumentTreeItem[];
}

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onFiltersChange,
  tree
}) => {
  const departments = tree?.filter(node => node.type === 'department') || [];
  
  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'processing', label: 'Processando' },
    { value: 'error', label: 'Erro' },
    { value: 'archived', label: 'Arquivado' },
    { value: 'hidden', label: 'Oculto' }
  ];

  const mimeTypeOptions = [
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (.docx)' },
    { value: 'application/msword', label: 'Word (.doc)' },
    { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (.xlsx)' },
    { value: 'application/vnd.ms-excel', label: 'Excel (.xls)' },
    { value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PowerPoint (.pptx)' },
    { value: 'application/vnd.ms-powerpoint', label: 'PowerPoint (.ppt)' },
    { value: 'text/', label: 'Texto' },
    { value: 'image/', label: 'Imagem' }
  ];

  const hasActiveFilters = filters.department || filters.status || filters.mimeType;

  const clearFilters = () => {
    onFiltersChange({
      department: '',
      status: '',
      mimeType: ''
    });
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      <Select
        value={filters.department}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, department: value })
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          {departments.map(dept => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, status: value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.mimeType}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, mimeType: value })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {mimeTypeOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
    </div>
  );
};