import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

interface DocumentSelectorProps {
  availableDocuments: Array<{ id: string; name: string; folder_id: string }>;
  selectedDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  placeholder?: string;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  availableDocuments,
  selectedDocumentId,
  onDocumentSelect,
  placeholder = "Selecione um documento..."
}) => {
  return (
    <div className="w-full">
      <Select value={selectedDocumentId || ""} onValueChange={onDocumentSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableDocuments.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="truncate">{doc.name}</span>
              </div>
            </SelectItem>
          ))}
          {availableDocuments.length === 0 && (
            <SelectItem value="" disabled>
              Nenhum documento disponível
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};