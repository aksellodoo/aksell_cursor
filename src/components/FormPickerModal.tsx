import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, FilePlus, Plus, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilledFormViewer } from '@/components/FilledFormViewer';

interface Form {
  id: string;
  title: string;
  description: string | null;
  fields_definition: any[];
  created_at: string;
  created_by: string;
  status: string;
  publication_status: string;
}

interface FormResponse {
  id: string;
  form_id: string;
  response_data: any;
  submitted_at: string;
  submitted_by: string | null;
}

interface FormPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormResponseSelected: (responseId: string, formTitle: string) => void;
}

export const FormPickerModal: React.FC<FormPickerModalProps> = ({
  open,
  onOpenChange,
  onFormResponseSelected
}) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [myResponses, setMyResponses] = useState<FormResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingResponse, setViewingResponse] = useState<{form: Form; response: FormResponse} | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .or('status.eq.task_usage,publication_status.eq.task_usage')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Erro ao carregar formulários');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyResponses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('submitted_by', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setMyResponses(data || []);
    } catch (error) {
      console.error('Error fetching my responses:', error);
    }
  }, []);

  // Carregar formulários com status 'task_usage'
  useEffect(() => {
    if (open) {
      fetchForms();
      fetchMyResponses();
    }
  }, [open, fetchForms, fetchMyResponses]);

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFormResponseCount = (formId: string) => {
    return myResponses.filter(r => r.form_id === formId).length;
  };

  const getLatestResponse = (formId: string) => {
    return myResponses.find(r => r.form_id === formId);
  };

  const getRequiredFieldsCount = (form: Form) => {
    try {
      const fields = Array.isArray(form.fields_definition) ? form.fields_definition : [];
      return fields.filter((field: any) => field.required).length;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleFocus = () => {
      fetchForms();
      fetchMyResponses();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [open, fetchForms, fetchMyResponses]);

  const handleFillForm = (form: Form) => {
    // Abrir formulário em nova aba para preenchimento
    window.open(`/formularios/${form.id}/fill`, '_blank');
    toast.info('Preencha o formulário na aba aberta. Após salvar, retorne aqui e use "Usar Última Resposta".');

    // Atualizar lista de respostas após um delay para capturar a nova resposta
    setTimeout(() => {
      fetchMyResponses();
    }, 2000);
  };

  const handleSelectExistingResponse = (response: FormResponse, form: Form) => {
    onFormResponseSelected(response.id, form.title);
    toast.success(`Resposta do formulário "${form.title}" selecionada`);
    onOpenChange(false);
  };

  const handleCreateNewForm = () => {
    window.open('/formularios/builder?taskUsage=true', '_blank', 'noopener');
    toast.info('O construtor de formulários foi aberto em outra aba. Após salvar, retorne aqui para selecioná-lo.');
  };


  // If viewing a response, show the filled form viewer
  if (viewingResponse) {
    return (
      <FilledFormViewer
        form={viewingResponse.form}
        responseData={viewingResponse.response.response_data}
        response={viewingResponse.response}
        onClose={() => setViewingResponse(null)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Selecionar Formulário para Aprovação</DialogTitle>
          <DialogDescription>
            Escolha um formulário e preencha-o, ou selecione uma resposta já existente
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Busca e criação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar formulários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="default"
            className="gap-2 self-start sm:self-auto"
            onClick={handleCreateNewForm}
          >
            <FilePlus className="h-4 w-4" />
            Criar Formulário
          </Button>
        </div>

        {/* Lista de Formulários */}
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando formulários...</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'Nenhum formulário encontrado com esse termo de busca'
                  : 'Nenhum formulário disponível para uso em tarefas'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((form) => {
                const responseCount = getFormResponseCount(form.id);
                const latestResponse = getLatestResponse(form.id);
                const requiredFields = getRequiredFieldsCount(form);

                return (
                  <Card key={form.id} className="relative hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">{form.title}</CardTitle>
                          </div>
                          {form.description && (
                            <CardDescription className="mt-2 text-sm">
                              {form.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {responseCount > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {responseCount} resposta{responseCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {requiredFields > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {requiredFields} campo{requiredFields > 1 ? 's' : ''} obrigatório{requiredFields > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {/* Botão Preencher Novo */}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleFillForm(form)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Preencher Novo
                        </Button>

                        {/* Botão Selecionar Existente (se houver respostas) */}
                        {latestResponse && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingResponse({ form, response: latestResponse })}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver Preenchido
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectExistingResponse(latestResponse, form)}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Usar Última Resposta
                              <span className="text-xs text-muted-foreground ml-1">
                                ({format(new Date(latestResponse.submitted_at), 'dd/MM/yy', { locale: ptBR })})
                              </span>
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Mensagem informativa se já tiver resposta */}
                      {latestResponse && (
                        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Última resposta em {format(new Date(latestResponse.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
