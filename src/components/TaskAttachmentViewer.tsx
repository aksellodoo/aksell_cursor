import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image as ImageIcon, File, ExternalLink } from 'lucide-react';
import { TaskAttachment } from '@/hooks/useTaskApproval';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskAttachmentViewerProps {
  attachments: TaskAttachment[];
}

export const TaskAttachmentViewer = ({ attachments }: TaskAttachmentViewerProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Imagem';
    if (fileType === 'application/pdf') return 'PDF';
    if (fileType.includes('word')) return 'Word';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
    return 'Arquivo';
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      setDownloadingId(attachment.id);

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao fazer download: ' + error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (attachment: TaskAttachment) => {
    try {
      // Verificar se é imagem ou PDF
      const isImage = attachment.file_type.startsWith('image/');
      const isPdf = attachment.file_type === 'application/pdf';

      if (!isImage && !isPdf) {
        toast.info('Preview disponível apenas para imagens e PDFs');
        return;
      }

      const { data, error } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(attachment.file_path, 3600); // 1 hora

      if (error) throw error;

      setPreviewUrl(data.signedUrl);
      setPreviewType(isImage ? 'image' : 'pdf');
    } catch (error: any) {
      console.error('Error creating preview:', error);
      toast.error('Erro ao gerar preview');
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum anexo disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => {
        const FileIcon = getFileIcon(attachment.file_type);
        return (
          <div
            key={attachment.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 rounded-lg hover:bg-muted/30 transition-colors gap-4"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0 w-full sm:w-auto">
              <FileIcon className="w-10 h-10 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold truncate text-base">{attachment.file_name}</p>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {getFileTypeLabel(attachment.file_type)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{formatFileSize(attachment.file_size)}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="truncate">
                    Enviado por {attachment.uploader?.name || 'Usuário'}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="whitespace-nowrap">
                    {format(new Date(attachment.uploaded_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(attachment.file_type.startsWith('image/') ||
                attachment.file_type === 'application/pdf') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(attachment)}
                  className="flex-1 sm:flex-initial"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visualizar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(attachment)}
                disabled={downloadingId === attachment.id}
                className="flex-1 sm:flex-initial"
              >
                <Download className="w-4 h-4 mr-1" />
                {downloadingId === attachment.id ? 'Baixando...' : 'Baixar'}
              </Button>
            </div>
          </div>
        );
      })}

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setPreviewUrl(null);
            setPreviewType(null);
          }}
        >
          <Card className="max-w-5xl max-h-[90vh] w-full overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview do Anexo</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewUrl(null);
                    setPreviewType(null);
                  }}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewType === 'image' && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              )}
              {previewType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] border-0"
                  title="PDF Preview"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
