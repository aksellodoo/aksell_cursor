import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Database, Settings, Eye, CheckCircle } from 'lucide-react';
import { useProtheusTables } from '@/hooks/useProtheusTables';
import { ExtraFieldsModal } from '@/components/ExtraFieldsModal';
import { useProtheusTableExtraFields } from '@/hooks/useProtheusTableExtraFields';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SyncTypeSelector } from '@/components/sync-config/SyncTypeSelector';
import { IntervalSyncConfig } from '@/components/sync-config/IntervalSyncConfig';
import { ScheduleSyncConfig } from '@/components/sync-config/ScheduleSyncConfig';
import { CronSyncConfig } from '@/components/sync-config/CronSyncConfig';
import { NextSyncPreview } from '@/components/sync-config/NextSyncPreview';

interface CreateProtheusTableModalProps {
  table?: any;
  isEdit?: boolean;
  hasSupabaseTable?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const CreateProtheusTableModal = ({ 
  table, 
  isEdit = false, 
  hasSupabaseTable = false,
  onClose,
  onSuccess 
}: CreateProtheusTableModalProps) => {
  // Draft persistence
  const getDraftKey = () => isEdit ? `protheus-table-draft-${table?.id}` : 'protheus-table-draft-new';
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtraFieldsModalOpen, setIsExtraFieldsModalOpen] = useState(false);
  const [tempExtraFields, setTempExtraFields] = useState<Array<{
    field_name: string;
    field_type: string;
    is_required: boolean;
    default_value: string | null;
  }>>([]);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const { createTable, updateTable, updateSupabaseTableStructure } = useProtheusTables();
  const { fields } = useProtheusTableExtraFields(table?.id);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    table_name: table?.table_name || '',
    description: table?.description || '',
    key_fields: table?.key_fields || '',
    query_interval_value: table?.query_interval_value || 60,
    query_interval_unit: table?.query_interval_unit || 'minutes',
    fetch_all_fields: table?.fetch_all_fields ?? true,
    create_supabase_table: table?.create_supabase_table ?? false,
    extra_database_fields: table?.extra_database_fields ?? false,
    enable_sha256_hash: table?.enable_sha256_hash ?? false,
    log_hash_changes: table?.log_hash_changes ?? false,
    detect_new_records: table?.detect_new_records ?? false,
    detect_deleted_records: table?.detect_deleted_records ?? false,
    selected_fields: (table?.selected_fields as string[] | undefined) ?? [],
    sync_type: table?.sync_type || 'interval',
    sync_schedule: (table?.sync_schedule as string[] | undefined) ?? [],
    cron_expression: table?.cron_expression || ''
  });

  const [selectedFields, setSelectedFields] = useState<string[]>(
    (table?.selected_fields as string[] | undefined) ?? []
  );

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(getDraftKey());
    if (draft && !isEdit) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft.formData || formData);
        setSelectedFields(parsedDraft.selectedFields || []);
        setTempExtraFields(parsedDraft.tempExtraFields || []);
        setHasDraft(true);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    } else if (isEdit) {
      setIsOpen(true);
    }
  }, []);

  // Debounced auto-save
  const saveDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const draftData = {
        formData,
        selectedFields,
        tempExtraFields,
        isOpen,
        timestamp: Date.now()
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    }, 500);
  }, [formData, selectedFields, tempExtraFields, isOpen]);

  // Auto-save on data changes
  useEffect(() => {
    if (isOpen && !isEdit) {
      saveDraft();
    }
  }, [formData, selectedFields, tempExtraFields, isOpen, saveDraft, isEdit]);

  // Save on visibility change and page unload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isOpen && !isEdit) {
        const draftData = {
          formData,
          selectedFields,
          tempExtraFields,
          isOpen,
          timestamp: Date.now()
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
      }
    };

    const handleBeforeUnload = () => {
      if (isOpen && !isEdit) {
        const draftData = {
          formData,
          selectedFields,
          tempExtraFields,
          isOpen,
          timestamp: Date.now()
        };
        localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [formData, selectedFields, tempExtraFields, isOpen, isEdit]);

  // Clear draft on cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const clearDraft = () => {
    localStorage.removeItem(getDraftKey());
    setHasDraft(false);
  };

  const discardDraft = () => {
    clearDraft();
    setIsOpen(false);
    if (onClose) onClose();
    toast({
      title: "Rascunho descartado",
      description: "Os dados não salvos foram removidos."
    });
  };

  const handleCSVChange = (file: File | null) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = Array.isArray(results.data) ? (results.data as any[]) : [];
          let names: string[] = [];

          if (rows.length > 0) {
            // Tenta coluna "field_name", senão usa a primeira coluna
            if ('field_name' in rows[0]) {
              names = rows
                .map((r) => (r.field_name ?? '').toString().trim().toUpperCase())
                .filter((v) => v.length > 0);
            } else {
              const firstKey = Object.keys(rows[0])[0];
              names = rows
                .map((r) => (r[firstKey] ?? '').toString().trim().toUpperCase())
                .filter((v) => v.length > 0);
            }
          }

          // Deduplicar e manter apenas formato válido A-Z, 0-9 e _
          const uniqueValid = Array.from(
            new Set(
              names
                .map((n) => n.replace(/\s+/g, '').toUpperCase())
                .filter((n) => /^[A-Z0-9_]+$/.test(n))
            )
          );

          if (uniqueValid.length === 0) {
            toast({
              title: 'CSV inválido',
              description: 'Nenhum campo válido foi encontrado. Use uma coluna com os nomes dos campos (ex: A1_FILIAL) ou cabeçalho "field_name".',
              variant: 'destructive',
            });
            return;
          }

          setSelectedFields(uniqueValid);
          setFormData((prev) => ({ ...prev, selected_fields: uniqueValid }));

          toast({
            title: 'Campos carregados',
            description: `${uniqueValid.length} campo(s) importado(s) do CSV.`,
          });
        } catch (err) {
          console.error('Erro ao processar CSV:', err);
          toast({
            title: 'Erro',
            description: 'Falha ao processar o CSV. Verifique o formato.',
            variant: 'destructive',
          });
        }
      },
      error: (err) => {
        console.error('Erro Papa.parse:', err);
        toast({
          title: 'Erro',
          description: 'Falha ao ler o arquivo CSV.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.table_name.trim() || !formData.description.trim()) {
      return;
    }

    // Validações quando não buscar todos os campos
    if (!formData.fetch_all_fields) {
      if (!selectedFields || selectedFields.length === 0) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Importe um CSV com os campos desejados antes de continuar.',
          variant: 'destructive',
        });
        return;
      }

      // Validar se key_fields estão dentro dos selecionados
      const keys = (formData.key_fields || '')
        .split('+')
        .map((k) => k.trim().toUpperCase())
        .filter((k) => k.length > 0);

      const missingKeys = keys.filter((k) => !selectedFields.includes(k));
      if (missingKeys.length > 0) {
        toast({
          title: 'Campos chave ausentes',
          description: `Inclua no CSV os campos chave: ${missingKeys.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsLoading(true);
      
      if (isEdit && table) {
        await updateTable(table.id, { 
          ...formData, 
          selected_fields: formData.fetch_all_fields ? [] : selectedFields 
        });
      } else {
        await createTable(
          { 
            ...formData, 
            selected_fields: formData.fetch_all_fields ? [] : selectedFields 
          }, 
          tempExtraFields
        );
      }

      // Clear draft and reset form on success
      clearDraft();
      
      if (!isEdit) {
        setFormData({
          table_name: '',
          description: '',
          key_fields: '',
          query_interval_value: 60,
          query_interval_unit: 'minutes',
          fetch_all_fields: true,
          create_supabase_table: false,
          extra_database_fields: false,
          enable_sha256_hash: false,
          log_hash_changes: false,
          detect_new_records: false,
          detect_deleted_records: false,
          selected_fields: [],
          sync_type: 'interval',
          sync_schedule: [],
          cron_expression: ''
        });
        setTempExtraFields([]);
        setSelectedFields([]);
      }

      setIsOpen(false);
      if (onClose) onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsLoading(false);
    }
  };

  const intervalUnits = [
    { value: 'seconds', label: 'Segundos' },
    { value: 'minutes', label: 'Minutos' },
    { value: 'hours', label: 'Horas' },
    { value: 'days', label: 'Dias' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!isEdit) {
        // Merge and persist current draft with the updated isOpen flag
        try {
          const prev = JSON.parse(localStorage.getItem(getDraftKey()) || '{}');
          const draftData = {
            ...prev,
            formData,
            selectedFields,
            tempExtraFields,
            isOpen: open,
            timestamp: Date.now(),
          };
          localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
        } catch {}
      }
      if (!open && onClose) onClose();
    }}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Nova Tabela
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {isEdit && hasSupabaseTable 
              ? 'Editar Campos Extras - Tabela Protheus'
              : isEdit 
              ? 'Editar Tabela Protheus' 
              : 'Cadastrar Nova Tabela Protheus'
            }
          </DialogTitle>
          <DialogDescription>
            {hasDraft && !isEdit 
              ? "Rascunho restaurado. Os dados são salvos automaticamente enquanto você digita."
              : "Os dados são salvos automaticamente como rascunho conforme você preenche o formulário."
            }
          </DialogDescription>
        </DialogHeader>

        {isEdit && hasSupabaseTable && (
          <Alert>
            <AlertDescription>
              <strong>⚠️ Modo Restrito:</strong> Esta tabela possui uma base de dados Supabase vinculada.
              Apenas a adição de novos campos extras é permitida. Para aplicar as mudanças na estrutura da tabela Supabase, use o botão "Atualizar Tabela Supabase".
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos Extras - Modo Restrito */}
          {isEdit && hasSupabaseTable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campos Extras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="ml-1 p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Gerenciar Campos Extras</p>
                      <p className="text-xs text-muted-foreground">
                        {fields.length > 0 ? `${fields.length} campo(s) existente(s)` : 'Nenhum campo extra criado ainda'}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsExtraFieldsModalOpen(true)}>
                      <Settings className="h-4 w-4 mr-1" />
                      Adicionar Campos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações Básicas */}
          {!(isEdit && hasSupabaseTable) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table_name">Nome da Tabela Protheus *</Label>
                  <Input
                    id="table_name"
                    value={formData.table_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, table_name: e.target.value.toUpperCase() }))}
                    placeholder="Ex: SA1010, SB1010, etc."
                    required
                    className="uppercase"
                    disabled={isEdit && hasSupabaseTable}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição da Tabela *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o propósito e conteúdo desta tabela..."
                    required
                    rows={3}
                    disabled={isEdit && hasSupabaseTable}
                  />
                </div>

                {/* Campos Chave */}
                <div className="space-y-2">
                  <Label htmlFor="key_fields">Campos Chave da Tabela *</Label>
                  <Input
                    id="key_fields"
                    type="text"
                    placeholder="A1_FILIAL+A1_COD+A1_LOJA"
                    value={formData.key_fields}
                    onChange={(e) => setFormData(prev => ({ ...prev, key_fields: e.target.value }))}
                    required
                    disabled={isEdit && hasSupabaseTable}
                  />
                  <p className="text-sm text-muted-foreground">
                    Campos que formam a chave única da tabela, separados por + (exemplo: A1_FILIAL+A1_COD+A1_LOJA)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configurações de Sincronização */}
          {!(isEdit && hasSupabaseTable) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações de Sincronização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SyncTypeSelector
                  value={formData.sync_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, sync_type: value }))}
                  disabled={isEdit && hasSupabaseTable}
                />

                {formData.sync_type === 'interval' && (
                  <IntervalSyncConfig
                    value={formData.query_interval_value}
                    unit={formData.query_interval_unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, query_interval_value: value }))}
                    onUnitChange={(unit) => setFormData(prev => ({ ...prev, query_interval_unit: unit }))}
                    disabled={isEdit && hasSupabaseTable}
                  />
                )}

                {formData.sync_type === 'schedule' && (
                  <ScheduleSyncConfig
                    schedule={formData.sync_schedule}
                    onChange={(schedule) => setFormData(prev => ({ ...prev, sync_schedule: schedule }))}
                    disabled={isEdit && hasSupabaseTable}
                  />
                )}

                {formData.sync_type === 'cron' && (
                  <CronSyncConfig
                    expression={formData.cron_expression}
                    onChange={(expression) => setFormData(prev => ({ ...prev, cron_expression: expression }))}
                    disabled={isEdit && hasSupabaseTable}
                  />
                )}

                <NextSyncPreview
                  syncType={formData.sync_type}
                  intervalValue={formData.query_interval_value}
                  intervalUnit={formData.query_interval_unit}
                  schedule={formData.sync_schedule}
                  cronExpression={formData.cron_expression}
                />
              </CardContent>
            </Card>
          )}

          {/* Configurações Avançadas */}
          {!(isEdit && hasSupabaseTable) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buscar todos os campos */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fetch_all_fields" className="text-base">
                      Buscar Todos os Campos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Incluir todos os campos da tabela nas consultas
                    </p>
                  </div>
                  <Switch
                    id="fetch_all_fields"
                    checked={formData.fetch_all_fields}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        fetch_all_fields: checked 
                      }));
                      if (checked) {
                        setSelectedFields([]);
                        setFormData(prev => ({ ...prev, selected_fields: [] }));
                      }
                    }}
                    disabled={isEdit && hasSupabaseTable}
                  />
                </div>

                {/* Importação de CSV quando NÃO buscar todos os campos */}
                {!formData.fetch_all_fields && (
                  <div className="ml-6 p-3 border border-border rounded-lg bg-muted/20 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Campos desejados (CSV) *</Label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCSVChange(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Formato: uma coluna com os nomes dos campos (ex: A1_FILIAL) ou cabeçalho "field_name".
                      </p>
                    </div>

                    {selectedFields.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {selectedFields.length} campo(s) selecionado(s) para criação da tabela e cálculo de hash
                        </p>
                        <ScrollArea className="h-24 rounded border border-border p-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedFields.map((f) => (
                              <Badge key={f} variant="secondary" className="uppercase">{f}</Badge>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}

                {/* Criar Tabela no Supabase */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="create_supabase_table" className="text-base">
                      Criar Tabela no Supabase
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Criar uma tabela permanente no Supabase para armazenar os dados
                    </p>
                  </div>
                  <Switch
                    id="create_supabase_table"
                    checked={formData.create_supabase_table}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      create_supabase_table: checked 
                    }))}
                    disabled={isEdit && hasSupabaseTable}
                  />
                </div>

                {/* Campos extras */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="extra_database_fields" className="text-base">
                      Campos Extras na Base de Dados
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isEdit && hasSupabaseTable 
                        ? "Adicione novos campos extras que serão aplicados à tabela Supabase"
                        : "Adicionar campos adicionais para controle e auditoria"
                      }
                    </p>
                  </div>
                  <Switch
                    id="extra_database_fields"
                    checked={formData.extra_database_fields}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      extra_database_fields: checked 
                    }))}
                  />
                </div>

                {/* Botão para configurar campos extras */}
                {formData.extra_database_fields && (
                  <div className="ml-6 p-3 border border-border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Configurar Campos Extras</p>
                        <p className="text-xs text-muted-foreground">
                          {isEdit && fields.length > 0 
                            ? `${fields.length} campos configurados`
                            : tempExtraFields.length > 0
                            ? `${tempExtraFields.length} campo(s) temporário(s) configurado(s)`
                            : 'Configure os campos extras que serão criados na tabela'
                          }
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExtraFieldsModalOpen(true)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        {isEdit && hasSupabaseTable ? 'Adicionar Campos' : 'Configurar'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Controle de Alterações por Hash */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <h4 className="text-base font-medium">Controle de Alterações por Hash</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure o monitoramento de alterações utilizando hash SHA256
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable_sha256_hash" className="text-base">
                        Hash SHA256 por linha de registro
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Gerar hash SHA256 para cada linha para detectar alterações
                      </p>
                    </div>
                    <Switch
                      id="enable_sha256_hash"
                      checked={formData.enable_sha256_hash}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          enable_sha256_hash: checked,
                          // Reset dependent fields when hash is disabled
                          log_hash_changes: checked ? prev.log_hash_changes : false,
                          detect_new_records: checked ? prev.detect_new_records : false,
                          detect_deleted_records: checked ? prev.detect_deleted_records : false,
                        }));
                      }}
                      disabled={isEdit && hasSupabaseTable}
                    />
                  </div>

                  {formData.enable_sha256_hash && (
                    <div className="ml-6 space-y-4 border-l-2 border-muted pl-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="log_hash_changes" className="text-sm">
                            Log de alteração de registro por análise de Hash SHA256
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Registrar log quando detectar alterações via hash
                          </p>
                        </div>
                        <Switch
                          id="log_hash_changes"
                          checked={formData.log_hash_changes}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            log_hash_changes: checked 
                          }))}
                          disabled={isEdit && hasSupabaseTable}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="detect_new_records" className="text-sm">
                            Detectar novos registros por HASH novo
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Identificar novos registros através de hashes inexistentes
                          </p>
                        </div>
                        <Switch
                          id="detect_new_records"
                          checked={formData.detect_new_records}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            detect_new_records: checked 
                          }))}
                          disabled={isEdit && hasSupabaseTable}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="detect_deleted_records" className="text-sm">
                            Detectar registros apagados por Hash que sumiu
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Identificar registros excluídos quando hash desaparece
                          </p>
                        </div>
                        <Switch
                          id="detect_deleted_records"
                          checked={formData.detect_deleted_records}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            detect_deleted_records: checked 
                          }))}
                          disabled={isEdit && hasSupabaseTable}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de Validação */}
          {!isEdit && formData.table_name && (
            <Card>
              <CardContent className="pt-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Melhorias Implementadas:</strong>
                    <br />• Descoberta automática de estrutura da tabela
                    <br />• Mapeamento dinâmico baseado em metadados
                    <br />• Todos os campos criados como TEXT para máxima compatibilidade
                    <br />• Validação de qualidade de dados integrada
                    <br />• Sistema corrige automaticamente problemas de mapeamento
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            {!isEdit && hasDraft && (
              <Button 
                type="button" 
                variant="destructive"
                size="sm"
                onClick={discardDraft}
              >
                Descartar rascunho
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }}
            >
              Cancelar
            </Button>
            {isEdit && hasSupabaseTable && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={async () => {
                  if (!table?.id) return;
                  const result = await updateSupabaseTableStructure(table.id);
                  if (result?.success) {
                    setIsOpen(false);
                    if (onSuccess) onSuccess();
                  }
                }}
                disabled={isLoading}
              >
                Atualizar Tabela Supabase
              </Button>
            )}
            {!(isEdit && hasSupabaseTable) && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
              </Button>
            )}
          </div>
        </form>

        {/* Modal de Campos Extras */}
        <ExtraFieldsModal
          isOpen={isExtraFieldsModalOpen}
          onClose={() => setIsExtraFieldsModalOpen(false)}
          tableId={isEdit ? table?.id : undefined}
          tableName={formData.table_name || 'Nova Tabela'}
          tempFields={tempExtraFields}
          onTempFieldsChange={setTempExtraFields}
          restrictedMode={isEdit && hasSupabaseTable}
        />
      </DialogContent>
    </Dialog>
  );
};
