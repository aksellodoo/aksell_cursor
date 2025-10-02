import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Clock,
  Building,
  Mail,
  MessageSquare,
  Flag
} from 'lucide-react';
import { useTaskApproval } from '@/hooks/useTaskApproval';
import { TaskAttachmentViewer } from '@/components/TaskAttachmentViewer';
import { FilledFormViewer } from '@/components/FilledFormViewer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const TaskApprovalProcessor = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const {
    task,
    attachments,
    formResponseData,
    comments,
    loading,
    processing,
    processApproval,
    addComment
  } = useTaskApproval(taskId || '');

  const [justification, setJustification] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showFormViewer, setShowFormViewer] = useState(false);

  const handleDecision = async (decision: 'approved' | 'rejected' | 'correction_requested') => {
    const success = await processApproval(decision, justification);
    if (success) {
      setTimeout(() => {
        navigate('/tarefas');
      }, 1500);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const statusConfig = {
    todo: { label: 'A Fazer', variant: 'outline' as const, color: 'text-gray-600' },
    in_progress: { label: 'Em Andamento', variant: 'default' as const, color: 'text-blue-600' },
    review: { label: 'Em Revisão', variant: 'secondary' as const, color: 'text-yellow-600' },
    done: { label: 'Concluída', variant: 'default' as const, color: 'text-green-600' },
  };

  const priorityConfig = {
    urgent: { label: 'Urgente', variant: 'destructive' as const },
    high: { label: 'Alta', variant: 'default' as const },
    medium: { label: 'Média', variant: 'secondary' as const },
    low: { label: 'Baixa', variant: 'outline' as const },
    P1: { label: 'Crítica', variant: 'destructive' as const },
    P2: { label: 'Alta', variant: 'default' as const },
    P3: { label: 'Média', variant: 'secondary' as const },
    P4: { label: 'Baixa', variant: 'outline' as const },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="text-lg font-semibold">Tarefa não encontrada</h2>
              <Button onClick={() => navigate('/tarefas')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Tarefas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se estiver visualizando o formulário preenchido
  if (showFormViewer && formResponseData) {
    return (
      <FilledFormViewer
        form={formResponseData.form}
        responseData={formResponseData.response.response_data}
        response={formResponseData.response as any}
        onClose={() => setShowFormViewer(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/tarefas')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold">Processar Aprovação</h1>
                <p className="text-sm text-muted-foreground">
                  Analise os detalhes e tome uma decisão
                </p>
              </div>
            </div>
            <Badge variant={statusConfig[task.status as keyof typeof statusConfig]?.variant}>
              {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 space-y-6 max-w-6xl">
        {/* Informações da Tarefa */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                {task.description && (
                  <CardDescription className="text-base">{task.description}</CardDescription>
                )}
              </div>
              <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig]?.variant}>
                <Flag className="w-3 h-3 mr-1" />
                {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Solicitado por</p>
                    <p className="font-medium">{task.creator?.name}</p>
                    <p className="text-xs text-muted-foreground">{task.creator?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">{task.creator?.department || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de criação</p>
                    <p className="font-medium">
                      {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {task.due_date && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <p className="font-medium">
                        {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo para Aprovação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Conteúdo para Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Renderizar baseado no data_source */}
            {task.payload.data_source === 'file' && (
              <TaskAttachmentViewer attachments={attachments} />
            )}

            {task.payload.data_source === 'form' && formResponseData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{formResponseData.form.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Preenchido por {formResponseData.response.user_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(formResponseData.response.submitted_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowFormViewer(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Formulário Preenchido
                  </Button>
                </div>
              </div>
            )}

            {task.payload.data_source === 'text' && task.payload.text_content && (
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{task.payload.text_content}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Ações de Aprovação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Decisão de Aprovação
            </CardTitle>
            <CardDescription>
              {task.payload.require_justification
                ? 'Justificativa obrigatória para esta aprovação'
                : 'Adicione uma justificativa ou comentário (opcional)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="justification">
                Justificativa / Comentários
                {task.payload.require_justification && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Digite sua justificativa ou comentários sobre a decisão..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                variant="default"
                size="lg"
                onClick={() => handleDecision('approved')}
                disabled={processing || task.status === 'done'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Aprovar
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => handleDecision('correction_requested')}
                disabled={processing || task.status === 'done'}
                className="flex-1"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Solicitar Correção
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={() => handleDecision('rejected')}
                disabled={processing || task.status === 'done'}
                className="flex-1"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Rejeitar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Comentários */}
        {comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Histórico de Comentários ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{comment.author?.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Adicionar Comentário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Adicionar Comentário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Adicionar Comentário
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
