import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, RefreshCw, Trash2, X } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/duplicateUtils';

interface DuplicateFile {
  file: File;
  existingDocument: {
    id: string;
    name: string;
    file_size: number;
    created_at: string;
    folder_name?: string;
    department_name?: string;
  };
  duplicateType: 'critical' | 'informative';
}

interface DuplicateResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateFile[];
  onResolve: (resolutions: { file: File; action: 'cancel' | 'rename' | 'replace' | 'import_anyway' }[]) => void;
}

export const DuplicateResolutionModal: React.FC<DuplicateResolutionModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  onResolve,
}) => {
  const [resolutions, setResolutions] = React.useState<Record<string, 'cancel' | 'rename' | 'replace' | 'import_anyway'>>({});

  React.useEffect(() => {
    // Initialize resolutions with default action based on duplicate type
    const initialResolutions: Record<string, 'cancel' | 'rename' | 'replace' | 'import_anyway'> = {};
    duplicates.forEach((duplicate) => {
      // Critical duplicates default to 'cancel', informative ones to 'import_anyway'
      initialResolutions[duplicate.file.name] = duplicate.duplicateType === 'critical' ? 'cancel' : 'import_anyway';
    });
    setResolutions(initialResolutions);
  }, [duplicates]);

  const handleResolutionChange = (fileName: string, action: 'cancel' | 'rename' | 'replace' | 'import_anyway') => {
    setResolutions(prev => ({
      ...prev,
      [fileName]: action
    }));
  };

  const handleConfirm = () => {
    const resolvedDuplicates = duplicates.map(duplicate => ({
      file: duplicate.file,
      action: resolutions[duplicate.file.name] || 'cancel'
    }));
    onResolve(resolvedDuplicates);
    onClose();
  };

  // Use utility functions for formatting

  const getActionColor = (action: string) => {
    switch (action) {
      case 'rename': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'replace': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'import_anyway': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-red-500/10 text-red-700 border-red-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'rename': return <RefreshCw className="h-4 w-4" />;
      case 'replace': return <Trash2 className="h-4 w-4" />;
      case 'import_anyway': return <FileText className="h-4 w-4" />;
      default: return <X className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Arquivos Duplicados Detectados
          </DialogTitle>
          <DialogDescription>
            Encontramos arquivos com mesmo nome, extensão e tamanho. Escolha como deseja proceder com cada um:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {duplicates.map((duplicate) => (
            <div key={duplicate.file.name} className={`border rounded-lg p-4 space-y-4 ${
              duplicate.duplicateType === 'critical' 
                ? 'border-red-200 bg-red-50' 
                : 'border-amber-200 bg-amber-50'
            }`}>
              {/* File Info */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <FileText className="h-8 w-8 text-primary" />
                  <Badge variant={duplicate.duplicateType === 'critical' ? 'destructive' : 'default'} className="text-xs px-2 py-0">
                    {duplicate.duplicateType === 'critical' ? 'Crítica' : 'Informativa'}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">{duplicate.file.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      Novo: {formatFileSize(duplicate.file.size)}
                    </Badge>
                    <Badge variant="secondary">
                      Existente: {formatFileSize(duplicate.existingDocument.file_size)}
                    </Badge>
                    <Badge variant="outline">
                      Criado em: {formatDate(duplicate.existingDocument.created_at)}
                    </Badge>
                    {duplicate.existingDocument.folder_name && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        📁 {duplicate.existingDocument.folder_name}
                      </Badge>
                    )}
                    {duplicate.existingDocument.department_name && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        🏢 {duplicate.existingDocument.department_name}
                      </Badge>
                    )}
                  </div>
                  {duplicate.duplicateType === 'critical' && (
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ <strong>Duplicata Crítica:</strong> Mesmo arquivo na mesma pasta
                    </p>
                  )}
                  {duplicate.duplicateType === 'informative' && (
                    <p className="text-sm text-amber-600 mt-2">
                      ℹ️ <strong>Duplicata Informativa:</strong> Mesmo arquivo em pasta/departamento diferente
                    </p>
                  )}
                </div>
              </div>

              {/* Resolution Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Como deseja proceder?</h4>
                
                <div className={`grid gap-3 ${duplicate.duplicateType === 'critical' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-4'}`}>
                  {/* Cancel Option */}
                  <button
                    onClick={() => handleResolutionChange(duplicate.file.name, 'cancel')}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-muted/50 ${
                      resolutions[duplicate.file.name] === 'cancel' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Cancelar Upload</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remove este arquivo da seleção e mantém o documento existente.
                    </p>
                  </button>

                  {/* Rename Option */}
                  <button
                    onClick={() => handleResolutionChange(duplicate.file.name, 'rename')}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-muted/50 ${
                      resolutions[duplicate.file.name] === 'rename' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Renomear Automaticamente</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adiciona um sufixo numérico ao nome (ex: arquivo (1).pdf).
                    </p>
                  </button>

                  {/* Replace Option - Only for critical duplicates */}
                  {duplicate.duplicateType === 'critical' && (
                    <button
                      onClick={() => handleResolutionChange(duplicate.file.name, 'replace')}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-muted/50 ${
                        resolutions[duplicate.file.name] === 'replace' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Substituir Existente</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Substitui o documento mantendo histórico das últimas 5 versões.
                      </p>
                    </button>
                  )}

                  {/* Import Anyway Option - Only for informative duplicates */}
                  {duplicate.duplicateType === 'informative' && (
                    <button
                      onClick={() => handleResolutionChange(duplicate.file.name, 'import_anyway')}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:bg-muted/50 ${
                        resolutions[duplicate.file.name] === 'import_anyway' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Importar Mesmo Assim</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Importa o arquivo para esta pasta mesmo existindo em outra localização.
                      </p>
                    </button>
                  )}
                </div>

                {/* Current Resolution Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ação selecionada:</span>
                  <Badge className={getActionColor(resolutions[duplicate.file.name])}>
                    {getActionIcon(resolutions[duplicate.file.name])}
                    <span className="ml-1">
                      {resolutions[duplicate.file.name] === 'cancel' && 'Cancelar Upload'}
                      {resolutions[duplicate.file.name] === 'rename' && 'Renomear Automaticamente'}
                      {resolutions[duplicate.file.name] === 'replace' && 'Substituir Existente'}
                      {resolutions[duplicate.file.name] === 'import_anyway' && 'Importar Mesmo Assim'}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={handleConfirm}>
            Aplicar Resoluções ({duplicates.length} arquivo{duplicates.length !== 1 ? 's' : ''})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};