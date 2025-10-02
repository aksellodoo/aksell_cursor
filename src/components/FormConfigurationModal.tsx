import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { X, Save, Users, Shield, Calendar, Hash, Globe, Mail, Settings, Briefcase } from 'lucide-react';
import { AdvancedApproverSelector } from './AdvancedApproverSelector';
import { ExternalRecipientsManager } from './ExternalRecipientsManager';
import { DeliveryChannelSelector } from './DeliveryChannelSelector';
import { ValidationPanel } from './ValidationPanel';
import { ValidationIndicator } from './ValidationIndicator';
import { useFormValidation } from '../hooks/useFormValidation';
import { useContacts } from '../hooks/useContacts';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

type FormStatus = 'draft' | 'published_internal' | 'published_external' | 'published_mixed' | 'archived' | 'task_usage';

interface FormConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  formId?: string | null;
  form?: any;
  lockedStatus?: FormStatus;
}

export const FormConfigurationModal = ({ isOpen, onClose, onSave, formId, form, lockedStatus }: FormConfigurationModalProps) => {
  const [currentTab, setCurrentTab] = useState('publication');
  const [showDeliverySelector, setShowDeliverySelector] = useState(false);
  const [savedFormId, setSavedFormId] = useState<string | null>(null);

  const { contacts } = useContacts();
  const { user } = useAuth();
  
  const [config, setConfig] = useState({
    title: form?.title || '',
    confidentiality_level: 'public' as 'public' | 'private',
    allow_anonymous: false,
    response_limit: null as number | null,
    deadline: null as string | null,
    estimated_fill_minutes: null as number | null,
    status: (lockedStatus ?? 'draft') as FormStatus,
    access_selection: {
      specificUsers: [],
      roleSelections: [],
      departmentSelections: []
    },
    
    // Campos para publicação
    allows_anonymous_responses: false,
    internal_recipients: {
      users: [],
      departments: [],
      roles: []
    },
    external_recipients: [] as Array<{ name: string; email: string }>,
    external_contact_ids: [] as string[],
        publication_settings: {
          auto_notify: true,
          collect_metadata: true,
          max_responses_per_user: null as number | null,
          response_deadline: null as string | null,
          require_privacy_consent: false as boolean
        }
  });

  // Validation hook
  const validation = useFormValidation(config);

  // Debug: log state changes
  useEffect(() => {
    console.log('FormConfigurationModal: Config updated', config);
  }, [config]);

  // Helper function to build config from form data
  const buildConfigFromForm = (form: any) => {
    console.log('FormConfigurationModal: Building config from form', form);
    
    // Extract values from multiple possible locations
    const estimatedFillMinutes = form.settings?.estimated_fill_minutes || form.publication_settings?.estimated_fill_minutes || null;
    const responseLimit = form.settings?.response_limit || form.publication_settings?.max_responses_per_user || null;
    const deadline = form.settings?.deadline || form.publication_settings?.response_deadline || null;
    
    return {
      title: form.title || '',
      confidentiality_level: form.confidentiality_level || 'public',
      allow_anonymous: form.allow_anonymous || false,
      response_limit: responseLimit,
      deadline: deadline,
      estimated_fill_minutes: estimatedFillMinutes,
      status: lockedStatus ?? (form.publication_status || form.status || 'draft'),
      access_selection: {
        specificUsers: form.allowed_users || [],
        roleSelections: form.allowed_roles || [],
        departmentSelections: form.allowed_departments || []
      },
      allows_anonymous_responses: form.allows_anonymous_responses || false,
      internal_recipients: form.internal_recipients || {
        users: [],
        departments: [],
        roles: []
      },
      external_recipients: form.external_recipients || [],
      external_contact_ids: form.external_contact_ids || [],
      publication_settings: {
        auto_notify: form.publication_settings?.auto_notify ?? true,
        collect_metadata: form.publication_settings?.collect_metadata ?? true,
        max_responses_per_user: responseLimit,
        response_deadline: deadline,
        estimated_fill_minutes: estimatedFillMinutes,
        ...form.publication_settings
      }
    };
  };

  // Initialize form data if editing
  useEffect(() => {
    if (form && isOpen) {
      console.log('FormConfigurationModal: Loading form data', form);
      const newConfig = buildConfigFromForm(form);
      console.log('FormConfigurationModal: Built config', newConfig);
      setConfig(newConfig);
    }
  }, [form, isOpen, lockedStatus]);

  useEffect(() => {
    if (!lockedStatus) return;
    setConfig(prev => ({
      ...prev,
      status: lockedStatus
    }));
  }, [lockedStatus, isOpen]);

  const isInternal = config.status === 'published_internal' || config.status === 'published_mixed';
  const isExternal = config.status === 'published_external' || config.status === 'published_mixed';
  const isTaskUsage = config.status === 'task_usage';

  const handleInternalRecipientsChange = (recipients: any) => {
    console.log('Updating internal recipients:', recipients);
    const convertedRecipients = {
      users: recipients.specificUsers || [],
      departments: recipients.departmentSelections || [],
      roles: recipients.roleSelections || []
    };
    console.log('Converted recipients:', convertedRecipients);
    setConfig(prev => ({
      ...prev,
      internal_recipients: convertedRecipients,
      access_selection: recipients
    }));
  };

  const handleExternalRecipientsChange = (recipients: any[]) => {
    console.log('Updating external recipients:', recipients);
    setConfig(prev => ({
      ...prev,
      external_recipients: recipients
    }));
  };

  const handleAccessSelectionChange = (selection: any) => {
    console.log('Updating access selection:', selection);
    setConfig(prev => ({
      ...prev,
      access_selection: selection
    }));
  };

  const handleSave = async () => {
    console.log('=== FormConfigurationModal.handleSave INICIADO ===');
    console.log('Config atual:', config);
    console.log('Validation result:', validation);

    // Check for critical errors
    if (!validation.isValid) {
      toast.error('Corrija os erros antes de salvar a configuração');
      return;
    }

    // Verificar se é edição de formulário existente
    if (formId && form) {
      console.log('Editando formulário existente:', formId);
      console.log('Formulário original:', form);

      // Verificar se o status está sendo alterado
      if (form.status !== config.status || form.publication_status !== config.status) {
        console.log('Status sendo alterado de', form.status, 'para', config.status);
      }
    }

    // Preparar dados no formato correto para a tabela forms
    const formData = {
      // Campos básicos
      title: config.title,
      publication_status: config.status,
      status: config.status,
      confidentiality_level: config.confidentiality_level,
      allows_anonymous_responses: config.allows_anonymous_responses,

      // internal_recipients como jsonb no formato correto
      internal_recipients: config.internal_recipients,

      // Campos opcionais
      allowed_users: config.confidentiality_level === 'private' ? config.access_selection?.specificUsers || [] : null,
      allowed_departments: config.confidentiality_level === 'private' ? config.access_selection?.departmentSelections || [] : null,
      allowed_roles: config.confidentiality_level === 'private' ? config.access_selection?.roleSelections || [] : null,

      // Configurações como jsonb
      publication_settings: {
        ...config.publication_settings,
        response_limit: config.response_limit,
        deadline: config.deadline,
        estimated_fill_minutes: config.estimated_fill_minutes
      },

      // Definir is_published baseado no status
      is_published: ['published_internal', 'published_external', 'published_mixed', 'task_usage'].includes(config.status),
      published_at: ['published_internal', 'published_external', 'published_mixed', 'task_usage'].includes(config.status)
        ? (form?.published_at || new Date().toISOString())
        : null,

      // Adicionar external_contact_ids
      external_contact_ids: config.external_contact_ids
    };

    console.log('=== DADOS PREPARADOS PARA SALVAMENTO ===');
    console.log('FormData que será enviado:', formData);
    console.log('Status final:', formData.status);
    console.log('Publication status final:', formData.publication_status);
    console.log('External contact IDs:', formData.external_contact_ids);

    // Executar onSave e aguardar o formId retornado
    const returnedFormId = await onSave(formData);

    console.log('FormId retornado do onSave:', returnedFormId);

    // Se há contatos externos selecionados e o status permite envio externo, mostrar seletor de canais
    const hasExternalContacts = config.external_contact_ids && config.external_contact_ids.length > 0;
    const allowsExternalDelivery = config.status === 'published_external' || config.status === 'published_mixed';

    if (hasExternalContacts && allowsExternalDelivery && returnedFormId) {
      console.log('Abrindo DeliveryChannelSelector com formId:', returnedFormId);
      setSavedFormId(returnedFormId);
      setShowDeliverySelector(true);
    } else {
      console.log('Não abrindo DeliveryChannelSelector:', {
        hasExternalContacts,
        allowsExternalDelivery,
        returnedFormId
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-semibold">
            {formId ? 'Editar Configurações' : 'Configurações do Formulário'}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!validation.isValid}
              className={!validation.isValid ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Save className="w-4 h-4 mr-2" />
              {formId ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Validation Panel */}
            <ValidationPanel 
              validation={validation}
              onNavigateToTab={setCurrentTab}
            />
            
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className={`grid w-full ${isTaskUsage ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <TabsTrigger value="publication" className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Publicação
                  </div>
                  <ValidationIndicator 
                    isValid={!validation.errorsByTab.publication?.some(e => e.severity === 'critical')}
                    hasWarning={validation.errorsByTab.publication?.some(e => e.severity === 'warning')}
                    errorCount={validation.errorsByTab.publication?.filter(e => e.severity === 'critical').length || 0}
                    size="sm"
                  />
                </TabsTrigger>
                {!isTaskUsage && (
                  <TabsTrigger value="recipients" className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Destinatários
                    </div>
                    <ValidationIndicator 
                      isValid={!validation.errorsByTab.recipients?.some(e => e.severity === 'critical')}
                      hasWarning={validation.errorsByTab.recipients?.some(e => e.severity === 'warning')}
                      errorCount={validation.errorsByTab.recipients?.filter(e => e.severity === 'critical').length || 0}
                      size="sm"
                    />
                  </TabsTrigger>
                )}
                <TabsTrigger value="settings" className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </div>
                  <ValidationIndicator 
                    isValid={!validation.errorsByTab.settings?.some(e => e.severity === 'critical')}
                    hasWarning={validation.errorsByTab.settings?.some(e => e.severity === 'warning')}
                    errorCount={validation.errorsByTab.settings?.filter(e => e.severity === 'critical').length || 0}
                    size="sm"
                  />
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Publicação */}
              <TabsContent value="publication" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Status de Publicação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        Status do Formulário
                        <ValidationIndicator 
                          isValid={config.status && config.status !== 'draft'}
                          size="sm"
                        />
                      </Label>
                      <Select 
                        value={config.status} 
                        onValueChange={(value: any) => {
                          if (lockedStatus) return;
                          console.log('Status changed to:', value);
                          setConfig(prev => ({ 
                            ...prev, 
                            status: value,
                            // Reset related fields when changing status
                            allows_anonymous_responses: false,
                            internal_recipients: { users: [], departments: [], roles: [] },
                            external_recipients: []
                          }));
                      }}
                        disabled={!!lockedStatus}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="draft">
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary">Rascunho</Badge>
                               <span>Não visível para usuários</span>
                             </div>
                           </SelectItem>
                           <SelectItem value="published_internal">
                             <div className="flex items-center gap-2">
                               <Badge variant="default">Publicado - Interno</Badge>
                               <span>Disponível apenas para usuários internos</span>
                             </div>
                           </SelectItem>
                           <SelectItem value="published_external">
                             <div className="flex items-center gap-2">
                               <Badge variant="default">Publicado - Externo</Badge>
                               <span>Disponível para destinatários externos</span>
                             </div>
                           </SelectItem>
                           <SelectItem value="published_mixed">
                             <div className="flex items-center gap-2">
                               <Badge variant="default">Publicado - Misto</Badge>
                               <span>Disponível para usuários internos e externos</span>
                             </div>
                           </SelectItem>
                           <SelectItem value="task_usage">
                             <div className="flex items-center gap-2">
                               <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                                 <Briefcase className="w-3 h-3 mr-1" />
                                 Uso em Tarefas
                               </Badge>
                               <span>Será vinculado a tipos de tarefa específicos</span>
                             </div>
                           </SelectItem>
                           <SelectItem value="archived">
                             <div className="flex items-center gap-2">
                               <Badge variant="outline">Arquivado</Badge>
                               <span>Não aceita mais respostas</span>
                             </div>
                           </SelectItem>
                         </SelectContent>
                      </Select>
                      {lockedStatus === 'task_usage' && (
                        <p className="mt-2 text-sm text-purple-700">
                          Este formulário ficará disponível apenas para tarefas. O status está travado em "Uso em Tarefas".
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        Nível de Confidencialidade
                        <ValidationIndicator 
                          isValid={!!config.confidentiality_level}
                          size="sm"
                        />
                      </Label>
                      <Select 
                        value={config.confidentiality_level} 
                        onValueChange={(value: any) => setConfig(prev => ({ ...prev, confidentiality_level: value }))}
                      >
                        <SelectTrigger className={`w-full ${!config.confidentiality_level ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecione o nível de confidencialidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-700 border-green-200">
                                Público
                              </Badge>
                              <span>Todos os usuários podem ver e responder</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-orange-700 border-orange-200">
                                Privado
                              </Badge>
                              <span>Apenas usuários específicos podem acessar</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Seletor de Acesso para Confidencialidade Privada */}
                    {config.confidentiality_level === 'private' && (
                      <div className="mt-4">
                        <Label className="text-base font-medium flex items-center gap-2">
                          Quem deve ter acesso?
                          <ValidationIndicator 
                            isValid={
                              (config.access_selection?.specificUsers?.length > 0) ||
                              (config.access_selection?.departmentSelections?.length > 0) ||
                              (config.access_selection?.roleSelections?.length > 0)
                            }
                            size="sm"
                          />
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Selecione quem pode acessar este formulário privado
                        </p>
                        <AdvancedApproverSelector
                          value={config.access_selection}
                          onChange={handleAccessSelectionChange}
                          approvalFormat="any"
                        />
                      </div>
                     )}

                     {/* Informação para Uso em Tarefas */}
                     {isTaskUsage && (
                       <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                         <div className="flex items-start gap-3">
                           <Briefcase className="w-5 h-5 text-purple-600 mt-0.5" />
                           <div>
                             <h4 className="font-medium text-purple-900">Formulário para Uso em Tarefas</h4>
                             <p className="text-sm text-purple-700 mt-1">
                               Este formulário será usado exclusivamente no módulo de tarefas. 
                               Não aparecerá na listagem geral de formulários e só poderá ser preenchido através de tarefas específicas.
                             </p>
                             <p className="text-sm text-purple-600 mt-2">
                               <strong>Próximo passo:</strong> Vincule este formulário a um tipo de tarefa na seção "Tipos de Tarefas".
                             </p>
                           </div>
                         </div>
                       </div>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Destinatários - Oculto para Uso em Tarefas */}
              {!isTaskUsage && (
                <TabsContent value="recipients" className="space-y-6">
                {/* Show destinatários internos for internal or mixed */}
                {isInternal && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Destinatários Internos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          Quem deve preencher internamente?
                          <ValidationIndicator 
                            isValid={
                              (config.internal_recipients?.users?.length > 0) ||
                              (config.internal_recipients?.departments?.length > 0) ||
                              (config.internal_recipients?.roles?.length > 0)
                            }
                            size="sm"
                          />
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Selecione os usuários internos que devem preencher este formulário
                        </p>
                        <AdvancedApproverSelector
                          value={{
                            specificUsers: config.internal_recipients?.users || [],
                            roleSelections: config.internal_recipients?.roles || [],
                            departmentSelections: config.internal_recipients?.departments || []
                          }}
                          onChange={handleInternalRecipientsChange}
                          approvalFormat="any"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Show destinatários externos for external or mixed */}
                {isExternal && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Destinatários Externos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          Configuração Externa
                          <ValidationIndicator 
                            isValid={
                              config.allows_anonymous_responses || 
                              (config.external_recipients?.length > 0)
                            }
                            size="sm"
                          />
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure como usuários externos acessarão o formulário
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allows_anonymous_responses"
                          checked={config.allows_anonymous_responses}
                          onCheckedChange={(checked) => {
                            console.log('Anonymous responses changed:', checked);
                            setConfig(prev => ({
                              ...prev,
                              allows_anonymous_responses: !!checked
                            }));
                          }}
                        />
                        <Label htmlFor="allows_anonymous_responses" className="text-sm">
                          Permitir respostas anônimas
                        </Label>
                      </div>

                      {!config.allows_anonymous_responses && (
                        <ExternalRecipientsManager
                          mode="contacts"
                          selectedContactIds={config.external_contact_ids}
                          onContactsChange={(contactIds) => {
                            console.log('External contact IDs changed:', contactIds);
                            setConfig(prev => ({
                              ...prev,
                              external_contact_ids: contactIds
                            }));
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Show message if draft or archived */}
                {!isInternal && !isExternal && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Configuração de Destinatários</h3>
                      <p className="text-muted-foreground text-center">
                        Selecione um status de publicação na aba "Publicação" para configurar os destinatários
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              )}

              {/* Tab 3: Configurações */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Limitações e Prazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Limite de Respostas</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 100 (deixe em branco para ilimitado)"
                        value={config.response_limit || ''}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          response_limit: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        O formulário será automaticamente fechado após atingir este número de respostas
                      </p>
                    </div>

                    <div>
                      <Label>Data Limite para Respostas</Label>
                      <Input
                        type="datetime-local"
                        value={config.deadline || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, deadline: e.target.value || null }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        O formulário será automaticamente fechado após esta data
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Informações do Formulário
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="form-title" className="text-sm font-medium flex items-center gap-2">
                        Nome do Formulário <span className="text-red-500">*</span>
                        <ValidationIndicator 
                          isValid={!!config.title && config.title.trim() !== ''}
                          size="sm"
                        />
                      </Label>
                      <Input
                        id="form-title"
                        type="text"
                        placeholder="Digite o nome do formulário"
                        value={config.title}
                        onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                        className={!config.title || config.title.trim() === '' ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-muted-foreground">
                        Este nome será exibido como título do formulário
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configurações de Publicação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-notify"
                        checked={config.publication_settings.auto_notify}
                        onCheckedChange={(checked) =>
                          setConfig(prev => ({
                            ...prev,
                            publication_settings: {
                              ...prev.publication_settings,
                              auto_notify: !!checked
                            }
                          }))
                        }
                      />
                      <Label htmlFor="auto-notify" className="text-sm">
                        Notificar destinatários automaticamente
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="collect-metadata"
                        checked={config.publication_settings.collect_metadata}
                        onCheckedChange={(checked) =>
                          setConfig(prev => ({
                            ...prev,
                            publication_settings: {
                              ...prev.publication_settings,
                              collect_metadata: !!checked
                            }
                          }))
                        }
                      />
                      <Label htmlFor="collect-metadata" className="text-sm">
                        Coletar metadados (IP, navegador)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-responses" className="text-sm">
                        Máximo de respostas por usuário
                      </Label>
                      <Input
                        id="max-responses"
                        type="number"
                        placeholder="Ilimitado"
                        value={config.publication_settings.max_responses_per_user || ''}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            publication_settings: {
                              ...prev.publication_settings,
                              max_responses_per_user: e.target.value ? parseInt(e.target.value) : null
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated-fill-time" className="text-sm font-medium flex items-center gap-2">
                        Tempo estimado de preenchimento (minutos) <span className="text-red-500">*</span>
                        <ValidationIndicator 
                          isValid={!!config.estimated_fill_minutes}
                          size="sm"
                        />
                      </Label>
                      <Input
                        id="estimated-fill-time"
                        type="number"
                        min="1"
                        placeholder="Ex: 5"
                        value={config.estimated_fill_minutes || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          setConfig(prev => ({
                            ...prev,
                            estimated_fill_minutes: value,
                            publication_settings: {
                              ...prev.publication_settings,
                              estimated_fill_minutes: value
                            }
                          }));
                        }}
                        className={!config.estimated_fill_minutes ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-muted-foreground">
                        Informe o tempo médio em minutos que o usuário levará para preencher o formulário completamente
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="publication-deadline" className="text-sm">
                        Prazo para resposta
                      </Label>
                      <Input
                        id="publication-deadline"
                        type="datetime-local"
                        value={config.publication_settings.response_deadline || ''}
                        onChange={(e) =>
                          setConfig(prev => ({
                            ...prev,
                            publication_settings: {
                              ...prev.publication_settings,
                              response_deadline: e.target.value || null
                            }
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo das Configurações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo das Configurações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span>Status:</span>
                         <Badge variant={config.status.includes('published') ? 'default' : 'secondary'}>
                            {config.status === 'draft' ? 'Rascunho' : 
                             config.status === 'published_internal' ? 'Publicado - Interno' :
                             config.status === 'published_external' ? 'Publicado - Externo' :
                             config.status === 'published_mixed' ? 'Publicado - Misto' :
                             config.status === 'task_usage' ? 'Uso em Tarefas' : 'Arquivado'}
                         </Badge>
                       </div>
                      <div className="flex justify-between">
                        <span>Confidencialidade:</span>
                        <Badge variant="outline">
                          {config.confidentiality_level === 'public' ? 'Público' : 'Privado'}
                        </Badge>
                      </div>
                      {isInternal && (
                        <div className="flex justify-between">
                          <span>Destinatários Internos:</span>
                          <span>
                            {config.internal_recipients.users.length + 
                             config.internal_recipients.departments.length + 
                             config.internal_recipients.roles.length} selecionados
                          </span>
                        </div>
                      )}
                      {isExternal && (
                        <div className="flex justify-between">
                          <span>Destinatários Externos:</span>
                          <span>
                            {config.allows_anonymous_responses ? 'Respostas anônimas permitidas' : 
                             `${config.external_recipients.length} destinatários`}
                          </span>
                        </div>
                      )}
                      {config.response_limit && (
                        <div className="flex justify-between">
                          <span>Limite de Respostas:</span>
                          <span>{config.response_limit}</span>
                        </div>
                      )}
                       {config.deadline && (
                         <div className="flex justify-between">
                           <span>Data Limite:</span>
                           <span>{new Date(config.deadline).toLocaleString('pt-BR')}</span>
                         </div>
                       )}
                       {config.estimated_fill_minutes && (
                         <div className="flex justify-between">
                           <span>Tempo Estimado:</span>
                           <span>~{config.estimated_fill_minutes} min</span>
                         </div>
                       )}
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy consent configuration */}
                {(config.status === 'published_internal' || config.status === 'task_usage') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Consentimento de Privacidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="require-consent"
                          checked={config.publication_settings?.require_privacy_consent || false}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            publication_settings: {
                              ...prev.publication_settings,
                              require_privacy_consent: !!checked
                            }
                          }))}
                        />
                        <Label htmlFor="require-consent" className="text-sm font-medium">
                          Exigir Consentimento e Mostrar Política de Privacidade
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        Quando ativado, os usuários precisarão aceitar a política de privacidade antes de preencher o formulário.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {(config.status === 'published_external' || config.status === 'published_mixed') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Consentimento Obrigatório
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Para formulários externos e mistos, o consentimento de privacidade é obrigatório e será exibido automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delivery Channel Selector Modal */}
      {showDeliverySelector && savedFormId && config.external_contact_ids && (
        <DeliveryChannelSelector
          isOpen={showDeliverySelector}
          onClose={() => {
            setShowDeliverySelector(false);
            // Fechar também o modal de configuração quando cancelar
            onClose();
          }}
          contacts={contacts.filter(c => config.external_contact_ids?.includes(c.id))}
          formId={savedFormId}
          formTitle={config.title}
          formDescription={form?.description}
          estimatedMinutes={config.estimated_fill_minutes || undefined}
          deadline={config.publication_settings?.response_deadline || config.deadline || undefined}
          creatorName={user?.email?.split('@')[0] || 'Sistema'}
          onSendComplete={(success) => {
            setShowDeliverySelector(false);
            if (success) {
              toast.success('Convites enviados com sucesso!');
              onClose();
            } else {
              // Se falhou, fechar também
              onClose();
            }
          }}
        />
      )}
    </div>
  );
};
