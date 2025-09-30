import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PendingAccessRequest } from '@/hooks/usePendingAccessRequests';
import { useDepartments } from '@/hooks/useDepartments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, Mail, User, Building, Users, Edit3, Save, X, Bell, Settings } from 'lucide-react';

interface AccessRequestApprovalModalProps {
  request: PendingAccessRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestProcessed: () => void;
}

export const AccessRequestApprovalModal = ({
  request,
  open,
  onOpenChange,
  onRequestProcessed
}: AccessRequestApprovalModalProps) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [supervisorId, setSupervisorId] = useState<string>('none');
  const [supervisors, setSupervisors] = useState<{ id: string; name: string; email: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedRole, setEditedRole] = useState('');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedDepartmentId, setEditedDepartmentId] = useState('');
  const [editedIsLeader, setEditedIsLeader] = useState(false);
  
  // Notification types state
  const [notificationTypes, setNotificationTypes] = useState({
    changes: { app: true, email: true },
    chatter: { app: true, email: true },
    mentions: { app: true, email: true },
    assignments: { app: true, email: true },
    approvals: { app: true, email: true },
    corrections: { app: true, email: true },
    tasks: { app: true, email: true },
    access_requests: { app: true, email: true }
  });

  const { departments } = useDepartments();

  // Initialize edit states when modal opens
  useEffect(() => {
    if (request && open) {
      setEditedRole(request.role);
      setEditedDepartment(request.department);
      setEditedDepartmentId(request.department_id || '');
      setEditedIsLeader(!!request.is_leader);
      
      // Initialize notification types with default values
      setNotificationTypes({
        changes: { app: request.notification_app, email: request.notification_email },
        chatter: { app: request.notification_app, email: request.notification_email },
        mentions: { app: request.notification_app, email: request.notification_email },
        assignments: { app: request.notification_app, email: request.notification_email },
        approvals: { app: request.notification_app, email: request.notification_email },
        corrections: { app: request.notification_app, email: request.notification_email },
        tasks: { app: request.notification_app, email: request.notification_email },
        access_requests: { app: request.notification_app, email: request.notification_email }
      });
    }
  }, [request, open]);

  // Buscar lista de supervisores potenciais
  useEffect(() => {
    const fetchSupervisors = async () => {
      if (!open || !request) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('status', 'active')
          .not('email', 'ilike', '%test%')
          .not('name', 'ilike', '%[TEST]%')
          .order('name');

        if (error) throw error;
        setSupervisors(data || []);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      }
    };

    fetchSupervisors();
  }, [open, request]);

  // Early return AFTER all hooks
  if (!request) return null;

  const handleApproval = async (approved: boolean) => {
    if (!approved && !rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    // If editing mode is active, save changes first
    if (isEditing) {
      const saveResult = handleSaveEdit();
      if (!saveResult) return;
    }

    setProcessing(true);

    try {
      console.log('Starting approval process for request:', request.id);
      
      const { data, error } = await supabase.functions.invoke('process-access-approval', {
        body: {
          requestId: request.id,
          approved,
          rejectionReason: approved ? undefined : rejectionReason.trim(),
          supervisorId: approved && supervisorId !== 'none' ? supervisorId : undefined,
            editedData: approved ? {
              role: editedRole,
              department: editedDepartment,
              department_id: editedDepartmentId,
              notification_types: notificationTypes,
              is_leader: editedIsLeader
            } : undefined
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Erro na função: ${error.message || 'Erro desconhecido'}`);
      }

      if (data?.success) {
        toast.success(
          approved 
            ? 'Usuário aprovado com sucesso! Credenciais enviadas por email.' 
            : 'Solicitação rejeitada com sucesso.'
        );
        onRequestProcessed();
        onOpenChange(false);
        setRejectionReason('');
        setIsEditing(false);
      } else {
        const errorMessage = data?.message || data?.error || 'Erro ao processar solicitação';
        console.error('Process approval failed:', data);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error processing approval:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Erro ao processar solicitação';
      
      if (error.message?.includes('Missing required environment variables')) {
        errorMessage = 'Erro de configuração do servidor. Entre em contato com o administrador.';
      } else if (error.message?.includes('Network request failed')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Validation
    if (!editedRole || !editedDepartment) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return false;
    }

    // Find department ID if not set
    if (editedDepartment && !editedDepartmentId) {
      const dept = departments.find(d => d.name === editedDepartment);
      setEditedDepartmentId(dept?.id || '');
    }

    setIsEditing(false);
    toast.success('Alterações salvas com sucesso');
    return true;
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setEditedRole(request.role);
    setEditedDepartment(request.department);
    setEditedDepartmentId(request.department_id || '');
    setEditedIsLeader(!!request.is_leader);
    setIsEditing(false);
  };

  const handleDepartmentChange = (value: string) => {
    const selectedDept = departments.find(d => d.name === value);
    setEditedDepartment(value);
    setEditedDepartmentId(selectedDept?.id || '');
  };

  const handleNotificationTypeChange = (type: string, method: 'app' | 'email', value: boolean) => {
    setNotificationTypes(prev => ({
      ...prev,
      [type]: {
        ...prev[type as keyof typeof prev],
        [method]: value
      }
    }));
  };

  const handleClose = () => {
    setRejectionReason('');
    setSupervisorId('none');
    setIsEditing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Solicitação de Acesso
          </DialogTitle>
          <DialogDescription>
            Analise os dados da solicitação e aprove ou rejeite o acesso ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Status e Data */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {request.status === 'pending' ? 'Pendente' : request.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Solicitado em {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
          </div>

          <Accordion type="multiple" defaultValue={["basic-info", "editable-data"]} className="w-full">
            {/* Dados Não-Editáveis */}
            <AccordionItem value="basic-info">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Básicas (não editáveis)
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nome Completo</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{request.name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{request.email}</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Dados Editáveis */}
            <AccordionItem value="editable-data">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Dados Editáveis
                  {isEditing && <Badge variant="secondary" className="ml-2">Editando</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Você pode editar estes dados antes de aprovar a solicitação
                  </p>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cargo/Função</Label>
                      {isEditing ? (
                        <Select value={editedRole} onValueChange={setEditedRole} disabled={editedIsLeader}>
                          <SelectTrigger className="border-primary/50 bg-primary/5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="hr">Recursos Humanos</SelectItem>
                            <SelectItem value="director">Diretor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                      <div className="p-3 bg-muted/50 rounded-md">
                        <span>{editedRole}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Departamento</Label>
                    {isEditing ? (
                      <Select value={editedDepartment} onValueChange={handleDepartmentChange}>
                        <SelectTrigger className="border-primary/50 bg-primary/5">
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {dept.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{editedDepartment}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium" htmlFor="edited_is_leader">Líder de Equipe</Label>
                  <Switch id="edited_is_leader" checked={editedIsLeader} onCheckedChange={(checked) => { setEditedIsLeader(checked); if (checked) setEditedRole('user'); }} />
                </div>

                {/* Supervisor Imediato */}
                <div className="space-y-2">
                  <Label htmlFor="supervisor-select">Supervisor Imediato (opcional)</Label>
                  <Select value={supervisorId} onValueChange={setSupervisorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um supervisor (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem supervisor</SelectItem>
                      {supervisors
                        .filter(supervisor => supervisor.id !== request.id)
                        .map((supervisor) => (
                          <SelectItem key={supervisor.id} value={supervisor.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{supervisor.name} ({supervisor.email})</span>
                            </div>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Configurações de Notificação */}
            <AccordionItem value="notifications">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Configurações de Notificação
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Configure as preferências de notificação para cada tipo de evento
                </div>

                {/* Configurações Básicas */}
                <div className="bg-accent/10 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Configurações Básicas</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Email:</span>
                      <Badge variant={request.notification_email ? "default" : "secondary"}>
                        {request.notification_email ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">App:</span>
                      <Badge variant={request.notification_app ? "default" : "secondary"}>
                        {request.notification_app ? 'Sim' : 'Não'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Frequência:</span>
                      <Badge variant="outline">{request.notification_frequency}</Badge>
                    </div>
                  </div>
                </div>

                {/* Tipos Específicos de Notificação */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Tipos de Notificação</h4>
                  <div className="grid gap-3">
                    {Object.entries({
                      changes: 'Alterações de dados',
                      chatter: 'Mensagens no chatter',
                      mentions: 'Menções em conversas',
                      assignments: 'Atribuições de tarefas',
                      approvals: 'Solicitações de aprovação',
                      corrections: 'Solicitações de correção',
                      tasks: 'Atualizações de tarefas',
                      access_requests: 'Solicitações de acesso'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium">{label}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`${key}-app`} className="text-xs">App</Label>
                            <Switch
                              id={`${key}-app`}
                              checked={notificationTypes[key as keyof typeof notificationTypes]?.app}
                              onCheckedChange={(checked) => 
                                handleNotificationTypeChange(key, 'app', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`${key}-email`} className="text-xs">Email</Label>
                            <Switch
                              id={`${key}-email`}
                              checked={notificationTypes[key as keyof typeof notificationTypes]?.email}
                              onCheckedChange={(checked) => 
                                handleNotificationTypeChange(key, 'email', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Rejeição */}
            <AccordionItem value="rejection">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Motivo da Rejeição
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <Label htmlFor="rejection-reason">Motivo da Rejeição (obrigatório apenas se rejeitar)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  rows={3}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Info sobre expiração */}
          <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
            <strong>Nota:</strong> Esta solicitação expira em{' '}
            {format(new Date(request.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleApproval(false)}
            disabled={processing}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Rejeitar
          </Button>
          <Button
            onClick={() => handleApproval(true)}
            disabled={processing}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};