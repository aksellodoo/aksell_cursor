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
  const [previewLoading, setPreviewLoading] = useState(false);

  const KNOWN_BUCKETS = ['docs-prod', 'task-attachments'] as const;

  const splitBucketFromPath = (
    rawPath: string
  ): { bucket: string | null; path: string } => {
    if (!rawPath) return { bucket: null, path: '' };

    // Normalizar separadores e remover espaços
    let inputPath = String(rawPath).trim().replace(/^\/+/, '');

    // Remover prefixos do endpoint do Supabase Storage, caso presentes
    // Exemplos aceitos:
    // storage/v1/object/public/<bucket>/<path>
    // public/<bucket>/<path>
    // sign/<bucket>/<path>
    // raw/<bucket>/<path>
    const storagePrefixes = [
      'storage/v1/object/',
      'public/',
      'sign/',
      'raw/'
    ];
    for (const p of storagePrefixes) {
      if (inputPath.startsWith(p)) {
        inputPath = inputPath.slice(p.length);
        break;
      }
    }

    // Se após remover prefixo ainda começar com escopo (public|sign|raw)
    const scopeMatch = inputPath.match(/^(public|sign|raw)\/(.+)$/);
    if (scopeMatch) {
      inputPath = scopeMatch[2];
    }

    // Se vier com bucket explícito no início
    for (const b of KNOWN_BUCKETS) {
      if (inputPath.startsWith(`${b}/`)) {
        return { bucket: b, path: inputPath.slice(b.length + 1) };
      }
    }

    // Caso contrário, nenhum bucket explícito; retornar caminho como está
    return { bucket: null, path: inputPath };
  };

  const createSignedUrlWithFallback = async (inputPath: string): Promise<string> => {
    const { bucket, path } = splitBucketFromPath(inputPath);
    const bucketsToTry = bucket ? [bucket] : [...KNOWN_BUCKETS];
    let lastErr: any = null;
    for (const b of bucketsToTry) {
      const { data, error } = await supabase.storage
        .from(b)
        .createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) return data.signedUrl;
      lastErr = error;
    }
    throw lastErr || new Error('Falha ao gerar URL do arquivo');
  };

  const downloadWithFallback = async (inputPath: string): Promise<Blob> => {
    const { bucket, path } = splitBucketFromPath(inputPath);
    const bucketsToTry = bucket ? [bucket] : [...KNOWN_BUCKETS];
    let lastErr: any = null;
    for (const b of bucketsToTry) {
      const { data, error } = await supabase.storage.from(b).download(path);
      if (!error && data) return data;
      lastErr = error;
    }
    throw lastErr || new Error('Arquivo não encontrado em buckets conhecidos');
  };

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
      // Se o caminho já é uma URL completa (legado), baixar diretamente
      if (/^https?:\/\//i.test(attachment.file_path)) {
        const link = document.createElement('a');
        link.href = attachment.file_path;
        link.download = attachment.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download iniciado');
        return;
      }

      // Detectar bucket correto: se file_path contém "/" é storage_key de docs-prod
      const bucket = attachment.file_path.includes('/') ? 'docs-prod' : 'task-attachments';

      const blob = await downloadWithFallback(attachment.file_path);

      // Criar URL para download
      const url = URL.createObjectURL(blob);
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
    setPreviewLoading(true);
    try {
      console.log('🔍 Preview - Starting preview for:', attachment.file_name);
      console.log('🔍 Preview - File path:', attachment.file_path);
      console.log('🔍 Preview - File type:', attachment.file_type);

      // Se já é URL completa (legado), usar diretamente
      if (/^https?:\/\//i.test(attachment.file_path)) {
        console.log('✅ Preview - Using legacy URL directly');
        const isImageUrl = attachment.file_type.startsWith('image/');
        setPreviewUrl(attachment.file_path);
        setPreviewType(isImageUrl ? 'image' : 'pdf');
        return;
      }

      // Verificar tipo suportado
      const isImage = attachment.file_type.startsWith('image/');
      const isPdf = attachment.file_type === 'application/pdf';
      if (!isImage && !isPdf) {
        console.warn('⚠️ Preview - Unsupported file type:', attachment.file_type);
        toast.info('Preview disponível apenas para imagens e PDFs');
        return;
      }

      // Detectar bucket correto
      // IMPORTANTE: Arquivos estão sempre em docs-prod (Gestão de Documentos)
      const { bucket, path } = splitBucketFromPath(attachment.file_path);
      const detectedBucket = bucket || 'docs-prod';

      // Se splitBucketFromPath retornou bucket null mas detectamos um, precisamos remover o prefixo do path
      let finalPath = path;
      if (!bucket && detectedBucket) {
        // Remover o bucket do início do path se estiver presente
        if (finalPath.startsWith(`${detectedBucket}/`)) {
          finalPath = finalPath.slice(detectedBucket.length + 1);
        }
      }

      console.log('🔍 Preview - Detected bucket:', detectedBucket);
      console.log('🔍 Preview - Extracted path:', finalPath);

      // 1) Tentar URL assinada
      try {
        console.log('🔄 Preview - Attempting signed URL...');
        const { data, error } = await supabase.storage
          .from(detectedBucket)
          .createSignedUrl(finalPath, 3600);

        if (!error && data?.signedUrl) {
          console.log('✅ Preview - Signed URL created successfully');
          setPreviewUrl(data.signedUrl);
          setPreviewType(isImage ? 'image' : 'pdf');
          return;
        }

        console.warn('⚠️ Preview - Signed URL failed:', error?.message);
      } catch (err) {
        console.warn('⚠️ Preview - Signed URL error:', err);
      }

      // 2) Fallback: baixar blob e criar ObjectURL com tipo MIME correto
      console.log('🔄 Preview - Trying blob download fallback...');
      const { data: blob, error: downloadError } = await supabase.storage
        .from(detectedBucket)
        .download(finalPath);

      if (downloadError || !blob) {
        throw new Error(`Falha ao baixar arquivo: ${downloadError?.message || 'Blob vazio'}`);
      }

      console.log('✅ Preview - Blob downloaded successfully, size:', blob.size);

      // Criar blob com tipo MIME correto (importante para PDFs)
      const typedBlob = new Blob([blob], { type: attachment.file_type });
      const objectUrl = URL.createObjectURL(typedBlob);

      console.log('✅ Preview - ObjectURL created:', objectUrl);
      setPreviewUrl(objectUrl);
      setPreviewType(isImage ? 'image' : 'pdf');
    } catch (error: any) {
      console.error('❌ Preview - Error:', error);
      toast.error('Erro ao gerar preview: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setPreviewLoading(false);
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
      {(previewUrl || previewLoading) && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!previewLoading) {
              // Limpar ObjectURL para evitar memory leak
              if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
              }
              setPreviewUrl(null);
              setPreviewType(null);
            }
          }}
        >
          <Card className="max-w-5xl max-h-[90vh] w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview do Anexo</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Limpar ObjectURL para evitar memory leak
                    if (previewUrl && previewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                    setPreviewType(null);
                  }}
                  disabled={previewLoading}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previewLoading && (
                <div className="flex items-center justify-center h-[70vh]">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Carregando preview...</p>
                  </div>
                </div>
              )}
              {!previewLoading && previewType === 'image' && (
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              )}
              {!previewLoading && previewType === 'pdf' && (
                <iframe
                  src={previewUrl!}
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


