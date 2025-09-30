import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { File, Download, RefreshCw, Archive, MoreHorizontal, CheckCircle, AlertCircle, Clock, XCircle, Trash2, Bot, Eye, FileText, FileSpreadsheet, Presentation, Image as ImageIcon, AlertTriangle, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { DocumentItem } from '@/pages/DocumentManagement';
import { usePermissions } from '@/hooks/usePermissions';

import { useDocumentHealthCheck } from '@/hooks/useDocumentHealthCheck';

interface DocumentListProps {
  documents: DocumentItem[];
  loading: boolean;
  selectedDocuments: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onDocumentAction: (action: string, documentId: string | string[]) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading,
  selectedDocuments,
  onSelectionChange,
  onDocumentAction
}) => {
  const { userProfile } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentItem | null>(null);
  const { isChecking, checkAndCleanStuckDocuments, forceCleanupDocument } = useDocumentHealthCheck();
  
  const isAdmin = userProfile?.role === 'admin';

  const handleDeleteClick = (document: DocumentItem) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      onDocumentAction('delete', documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusIcon = (status: DocumentItem['status']) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente_revisao':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pendente_aprovacao':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'rejeitado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'obsoleto':
        return <Archive className="h-4 w-4 text-gray-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      // Legacy statuses for compatibility
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-orange-600" />;
      case 'hidden':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: DocumentItem['status']) => {
    const variants = {
      aprovado: 'bg-green-100 text-green-700 border-green-200',
      pendente_revisao: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pendente_aprovacao: 'bg-blue-100 text-blue-700 border-blue-200',
      rejeitado: 'bg-red-100 text-red-700 border-red-200',
      obsoleto: 'bg-gray-100 text-gray-700 border-gray-200',
      // Legacy statuses for compatibility
      active: 'bg-green-100 text-green-700 border-green-200',
      archived: 'bg-orange-100 text-orange-700 border-orange-200',
      hidden: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    const labels = {
      aprovado: 'Aprovado',
      pendente_revisao: 'Pendente de Revisão',
      pendente_aprovacao: 'Pendente de Aprovação',
      rejeitado: 'Rejeitado',
      obsoleto: 'Obsoleto',
      // Legacy labels for compatibility
      active: 'Ativo',
      archived: 'Arquivado',
      hidden: 'Oculto'
    };

    return (
      <Badge className={cn('text-xs', variants[status] || 'bg-gray-100 text-gray-700 border-gray-200')}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getProcessingStatusBadge = (processingStatus: string) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-700 border-gray-200',
      processing: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200'
    };

    const labels = {
      pending: 'Aguardando',
      processing: 'Processando',
      completed: 'Processado',
      failed: 'Falha'
    };

    if (!processingStatus) return null;

    return (
      <Badge className={cn('text-xs', variants[processingStatus as keyof typeof variants] || 'bg-gray-100 text-gray-700 border-gray-200')}>
        {labels[processingStatus as keyof typeof labels] || processingStatus}
      </Badge>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(documents.map(doc => doc.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    const newSelection = new Set(selectedDocuments);
    if (checked) {
      newSelection.add(documentId);
    } else {
      newSelection.delete(documentId);
    }
    onSelectionChange(newSelection);
  };

  const getMimeTypeIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-4 w-4" />;
    
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-700" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-700" />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="h-4 w-4 text-orange-600" />;
    if (mimeType.includes('image')) return <ImageIcon className="h-4 w-4 text-purple-600" />;
    if (mimeType.includes('text')) return <FileText className="h-4 w-4 text-gray-600" />;
    
    return <File className="h-4 w-4" />;
  };

  const isDocumentStuck = (doc: DocumentItem) => {
    if (doc.status !== 'processing' && (doc as any).processing_status !== 'processing') return false;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const updatedAt = new Date(doc.updated_at);
    return updatedAt < oneHourAgo;
  };

  // Helper function to check if document can be viewed (PDF or Office)
  const canViewDocument = (doc: DocumentItem) => {
    if (!doc.mime_type || 
        (doc.status !== 'active' && doc.status !== 'aprovado') ||
        (doc as any).processing_status !== 'completed') {
      return false;
    }

    // Office document types supported by OnlyOffice
    const officeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
      'application/pdf' // PDF
    ];

    return officeTypes.includes(doc.mime_type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento encontrado nesta pasta</p>
          <Button 
            variant="outline" 
            onClick={checkAndCleanStuckDocuments}
            disabled={isChecking}
            className="mt-4"
          >
            {isChecking ? 'Verificando...' : 'Verificar Documentos Travados'}
          </Button>
        </div>
      </div>
    );
  }

  const allSelected = documents.length > 0 && selectedDocuments.size === documents.length;
  const someSelected = selectedDocuments.size > 0 && selectedDocuments.size < documents.length;

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table className="w-full min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 sticky left-0 bg-background z-10">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el && el instanceof HTMLInputElement) {
                    el.indeterminate = someSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="min-w-[200px]">Nome</TableHead>
            <TableHead className="w-24">Versão</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-40">RAG</TableHead>
            <TableHead className="w-24">Tamanho</TableHead>
            <TableHead className="w-40">Atualizado</TableHead>
            <TableHead className="w-20 sticky right-0 bg-background z-10">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <ContextMenu key={document.id}>
              <ContextMenuTrigger asChild>
                <TableRow
                  className={cn(
                    'group cursor-context-menu',
                    selectedDocuments.has(document.id) && 'bg-accent/50'
                  )}
                >
              <TableCell className="sticky left-0 bg-background z-10">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDocuments.has(document.id)}
                    onCheckedChange={(checked) => 
                      handleSelectDocument(document.id, checked as boolean)
                    }
                    aria-label={`Selecionar ${document.name}`}
                  />
                  {isDocumentStuck(document) && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-3">
                  {getMimeTypeIcon(document.mime_type)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {document.name}
                    </p>
                    {document.mime_type && (
                      <p className="text-xs text-muted-foreground">
                        {document.mime_type}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  v{document.version || 1}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(document.status)}
                    {getStatusBadge(document.status)}
                  </div>
                  {(document as any).processing_status && (
                    <div className="flex items-center gap-2">
                      {getProcessingStatusBadge((document as any).processing_status)}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {(document as any).rag_status === 'processed' ? (
                    <span className="text-green-600">✓ Processado</span>
                  ) : (document as any).rag_status === 'processing' ? (
                    <span className="text-yellow-600">⏳ Processando</span>
                  ) : (
                    <span className="text-gray-600">⏸ Não processado</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="text-sm text-muted-foreground">
                {formatFileSize(document.file_size)}
              </TableCell>
              
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(document.updated_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </TableCell>
              
              <TableCell className="sticky right-0 bg-background z-10 border-l">
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canViewDocument(document) && (
                        <DropdownMenuItem 
                          onClick={() => onDocumentAction('view', document.id)}
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          Visualizar PDF
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => onDocumentAction('download', document.id)}
                        disabled={document.status !== 'aprovado' || (document as any).processing_status !== 'completed'}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => onDocumentAction('reprocess', document.id)}
                        disabled={(document as any).processing_status === 'processing'}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reprocessar
                      </DropdownMenuItem>
                      
                      {isDocumentStuck(document) && (
                        <DropdownMenuItem 
                          onClick={() => forceCleanupDocument(document.id)}
                          className="text-blue-600 focus:text-blue-600"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Forçar Finalização
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => onDocumentAction('chat', document.id)}
                        disabled={document.status !== 'aprovado' || (document as any).processing_status !== 'completed'}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Falar com IA
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => onDocumentAction('details', document.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => onDocumentAction('archive', document.id)}
                        disabled={document.status === 'archived'}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar
                      </DropdownMenuItem>
                      
                      {isAdmin && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(document)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
              </ContextMenuTrigger>
              
              <ContextMenuContent className="w-56">
                <ContextMenuItem 
                  onClick={() => onDocumentAction('download', document.id)}
                  disabled={document.status !== 'aprovado' || (document as any).processing_status !== 'completed'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </ContextMenuItem>
                
                <ContextMenuItem 
                  onClick={() => onDocumentAction('reprocess', document.id)}
                  disabled={(document as any).processing_status === 'processing'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocessar
                </ContextMenuItem>
                
                <ContextMenuItem 
                  onClick={() => onDocumentAction('chat', document.id)}
                  disabled={document.status !== 'aprovado' || (document as any).processing_status !== 'completed'}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Falar com IA
                </ContextMenuItem>
                
                <ContextMenuItem 
                  onClick={() => onDocumentAction('details', document.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </ContextMenuItem>
                
                <ContextMenuItem 
                  onClick={() => onDocumentAction('archive', document.id)}
                  disabled={document.status === 'archived'}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </ContextMenuItem>
                
                {isAdmin && (
                  <ContextMenuItem 
                    onClick={() => handleDeleteClick(document)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o documento "{documentToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};