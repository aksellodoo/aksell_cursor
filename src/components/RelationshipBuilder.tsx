import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullscreenDialogContent } from "@/components/ui/fullscreen-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeftRight, X, Save, RotateCcw, Loader2, Check, ChevronsUpDown, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Type assertion to avoid infinite type issues
const supabaseClient = supabase as any;

interface ProtheusTable {
  id: string;
  table_name: string;
  description: string;
  selected_fields?: string[];
  key_fields?: string;
}

interface JoinField {
  sourceField: string;
  targetField: string;
}

interface RelationshipData {
  sourceTable: string;
  targetTable: string;
  joinFields: JoinField[];
  type: '1:N' | 'N:1' | 'N:N';
  notes: string;
}

interface RelationshipBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  tables: ProtheusTable[];
  onSave: (relationship: RelationshipData) => void;
}

export const RelationshipBuilder = ({ isOpen, onClose, tables, onSave }: RelationshipBuilderProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<RelationshipData>({
    sourceTable: '',
    targetTable: '',
    joinFields: [{ sourceField: '', targetField: '' }],
    type: '1:N',
    notes: ''
  });

  const [connectionFieldsCount, setConnectionFieldsCount] = useState(1);

  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [targetFields, setTargetFields] = useState<string[]>([]);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [loadingSourceFields, setLoadingSourceFields] = useState(false);
  const [loadingTargetFields, setLoadingTargetFields] = useState(false);
  const [fieldsCache, setFieldsCache] = useState<Record<string, string[]>>({});
  const [fieldPairOpenStates, setFieldPairOpenStates] = useState<Record<string, boolean>>({});

  // Load draft from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('relationship_draft');
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          // Ensure joinFields is always an array
          const safeDraft = {
            ...parsedDraft,
            joinFields: Array.isArray(parsedDraft.joinFields) 
              ? parsedDraft.joinFields 
              : [{ sourceField: '', targetField: '' }]
          };
          setFormData(safeDraft);
          if (parsedDraft.connectionFieldsCount) {
            setConnectionFieldsCount(parsedDraft.connectionFieldsCount);
          }
          setIsDraftSaved(true);
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
  }, [isOpen]);

  // Save draft to localStorage when form changes
  useEffect(() => {
    if (isOpen && (formData.sourceTable || formData.targetTable || formData.notes)) {
      localStorage.setItem('relationship_draft', JSON.stringify({ ...formData, connectionFieldsCount }));
      setIsDraftSaved(true);
    }
  }, [formData, connectionFieldsCount, isOpen]);

  // Function to load fields from protheus_dynamic_tables
  const loadFieldsForTable = async (tableName: string): Promise<string[]> => {
    if (fieldsCache[tableName]) {
      return fieldsCache[tableName];
    }

    try {
      // First, find the table ID from the tables array
      const tableInfo = tables.find(t => t.table_name === tableName);
      if (!tableInfo) {
        throw new Error(`Tabela ${tableName} não encontrada`);
      }

      // Query protheus_dynamic_tables using protheus_table_id
      const response = await supabaseClient
        .from('protheus_dynamic_tables')
        .select('table_structure')
        .eq('protheus_table_id', tableInfo.id)
        .maybeSingle();

      if (response.error) throw response.error;

      let fields: string[] = [];

      // Try to extract fields from dynamic table structure
      if (response.data?.table_structure && typeof response.data.table_structure === 'object') {
        const tableStructure = response.data.table_structure as any;
        
        // Support different formats: fields, field_mappings, columns (legacy)
        if (tableStructure.fields && Array.isArray(tableStructure.fields)) {
          fields = tableStructure.fields.map((f: any) => typeof f === 'string' ? f : f.name || f.field_name).filter(Boolean);
        } else if (tableStructure.field_mappings && typeof tableStructure.field_mappings === 'object') {
          fields = Object.keys(tableStructure.field_mappings);
        } else if (tableStructure.columns && typeof tableStructure.columns === 'object') {
          fields = Object.keys(tableStructure.columns);
        }
      }

      // Fallback to selected_fields from protheus_tables if no dynamic mapping
      if (fields.length === 0 && tableInfo.selected_fields?.length) {
        fields = tableInfo.selected_fields;
      }

      if (fields.length === 0) {
        toast({
          title: "Campos não encontrados",
          description: `A tabela ${tableName} não possui mapeamento de campos. Considere criar/atualizar a tabela Supabase correspondente.`,
          variant: "destructive"
        });
      } else {
        setFieldsCache(prev => ({ ...prev, [tableName]: fields }));
      }

      return fields;
    } catch (error) {
      console.error('Error loading fields:', error);
      toast({
        title: "Erro ao carregar campos",
        description: `Não foi possível carregar os campos da tabela ${tableName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
      return [];
    }
  };

  // Load fields when source table changes
  useEffect(() => {
    if (isOpen && formData.sourceTable && tables.length > 0) {
      setLoadingSourceFields(true);
      loadFieldsForTable(formData.sourceTable)
        .then(fields => {
          setSourceFields(fields);
        })
        .finally(() => {
          setLoadingSourceFields(false);
        });
    } else {
      setSourceFields([]);
    }
  }, [formData.sourceTable, isOpen, tables]);

  // Load fields when target table changes
  useEffect(() => {
    if (isOpen && formData.targetTable && tables.length > 0) {
      setLoadingTargetFields(true);
      loadFieldsForTable(formData.targetTable)
        .then(fields => {
          setTargetFields(fields);
        })
        .finally(() => {
          setLoadingTargetFields(false);
        });
    } else {
      setTargetFields([]);
    }
  }, [formData.targetTable, isOpen, tables]);

  const handleClose = () => {
    // Clear draft when closing
    localStorage.removeItem('relationship_draft');
    setFormData({
      sourceTable: '',
      targetTable: '',
      joinFields: [{ sourceField: '', targetField: '' }],
      type: '1:N',
      notes: ''
    });
    setConnectionFieldsCount(1);
    setIsDraftSaved(false);
    onClose();
  };

  const handleInvertSides = () => {
    setFormData(prev => ({
      ...prev,
      sourceTable: prev.targetTable,
      targetTable: prev.sourceTable,
      joinFields: prev.joinFields.map(field => ({
        sourceField: field.targetField,
        targetField: field.sourceField
      })),
      type: prev.type === '1:N' ? 'N:1' : prev.type === 'N:1' ? '1:N' : prev.type
    }));
  };

  const handleClearDraft = () => {
    localStorage.removeItem('relationship_draft');
    setFormData({
      sourceTable: '',
      targetTable: '',
      joinFields: [{ sourceField: '', targetField: '' }],
      type: '1:N',
      notes: ''
    });
    setConnectionFieldsCount(1);
    setIsDraftSaved(false);
    toast({
      title: "Rascunho limpo",
      description: "Os dados do formulário foram limpos."
    });
  };

  const handleSave = () => {
    // Validation
    if (!formData.sourceTable || !formData.targetTable) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, selecione as tabelas.",
        variant: "destructive"
      });
      return;
    }

    if (formData.sourceTable === formData.targetTable) {
      toast({
        title: "Tabelas iguais",
        description: "A tabela de origem deve ser diferente da tabela de destino.",
        variant: "destructive"
      });
      return;
    }

    // Validate all join fields are filled
    const hasEmptyFields = formData.joinFields.some(field => !field.sourceField || !field.targetField);
    if (hasEmptyFields) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os pares de campo.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate field pairs
    const fieldPairs = formData.joinFields.map(f => `${f.sourceField}-${f.targetField}`);
    const uniquePairs = new Set(fieldPairs);
    if (fieldPairs.length !== uniquePairs.size) {
      toast({
        title: "Campos duplicados",
        description: "Não é possível ter pares de campo duplicados.",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
    handleClose();
    toast({
      title: "Relacionamento criado",
      description: "O relacionamento foi criado com sucesso."
    });
  };

  const isFormValid = formData.sourceTable && formData.targetTable && 
    formData.joinFields.every(field => field.sourceField && field.targetField);

  // Handle connection fields count change
  const handleConnectionFieldsCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(10, newCount)); // Limit between 1 and 10
    setConnectionFieldsCount(count);
    
    setFormData(prev => {
      // Ensure joinFields is always an array before spreading
      const prevJoinFields = Array.isArray(prev.joinFields) ? prev.joinFields : [{ sourceField: '', targetField: '' }];
      const newJoinFields = [...prevJoinFields];
      
      if (count > newJoinFields.length) {
        // Add new empty pairs
        while (newJoinFields.length < count) {
          newJoinFields.push({ sourceField: '', targetField: '' });
        }
      } else if (count < newJoinFields.length) {
        // Remove extra pairs
        newJoinFields.splice(count);
      }
      
      return { ...prev, joinFields: newJoinFields };
    });
  };

  // Update specific join field
  const updateJoinField = (index: number, field: 'sourceField' | 'targetField', value: string) => {
    setFormData(prev => ({
      ...prev,
      joinFields: prev.joinFields.map((joinField, i) => 
        i === index ? { ...joinField, [field]: value } : joinField
      )
    }));
  };

  // Reusable FieldCombobox component
  const FieldCombobox = ({ 
    value, 
    onValueChange, 
    fields, 
    loading, 
    disabled, 
    placeholder, 
    open, 
    onOpenChange 
  }: {
    value: string;
    onValueChange: (value: string) => void;
    fields: string[];
    loading: boolean;
    disabled: boolean;
    placeholder: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? value : placeholder}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Buscar campo..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhum campo encontrado.</CommandEmpty>
            <CommandGroup>
              {fields.map((field) => (
                <CommandItem
                  key={field}
                  value={field}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    onOpenChange(false);
                  }}
                >
                  {field}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === field ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <FullscreenDialogContent
      open={isOpen}
      onOpenChange={handleClose}
      persistent={true}
      className="bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-muted/30">
        <div>
          <h1 className="text-2xl font-semibold">Criar Relacionamento</h1>
          <p className="text-sm text-muted-foreground">
            Configure o relacionamento entre campos de tabelas Protheus
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDraftSaved && (
            <Badge variant="secondary" className="text-xs">
              Rascunho salvo
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearDraft}
            disabled={!isDraftSaved}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Automatic Name Preview */}
          {formData.sourceTable && formData.targetTable && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Nome do Relacionamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-xl font-bold text-primary">
                  {formData.sourceTable.toUpperCase()}_{formData.targetTable.toUpperCase()}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Este nome será gerado automaticamente baseado nas tabelas selecionadas.
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Source Table Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabela de Origem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sourceTable">Tabela Protheus</Label>
                <Select
                  value={formData.sourceTable}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    sourceTable: value, 
                    joinFields: Array.isArray(prev.joinFields) 
                      ? prev.joinFields.map(f => ({ ...f, sourceField: '' }))
                      : [{ sourceField: '', targetField: '' }]
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a tabela de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.id} value={table.table_name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{table.table_name}</span>
                          <span className="text-xs text-muted-foreground">{table.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Connection Fields Count */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Qtd. de Chaves de Conexão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="connectionCount">Número de campos para conexão:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectionFieldsCountChange(connectionFieldsCount - 1)}
                    disabled={connectionFieldsCount <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{connectionFieldsCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectionFieldsCountChange(connectionFieldsCount + 1)}
                    disabled={connectionFieldsCount >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relationship Direction */}
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                {formData.sourceTable || 'Origem'}
              </Badge>
              <div className="flex items-center gap-2">
                <Select
                  value={formData.type}
                  onValueChange={(value: '1:N' | 'N:1' | 'N:N') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:N">1:N</SelectItem>
                    <SelectItem value="N:1">N:1</SelectItem>
                    <SelectItem value="N:N">N:N</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInvertSides}
                  disabled={!formData.sourceTable || !formData.targetTable}
                  title="Inverter lados"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {formData.targetTable || 'Destino'}
              </Badge>
            </div>
          </div>

          {/* Target Table Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabela de Destino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetTable">Tabela Protheus</Label>
                <Select
                  value={formData.targetTable}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    targetTable: value, 
                    joinFields: Array.isArray(prev.joinFields) 
                      ? prev.joinFields.map(f => ({ ...f, targetField: '' }))
                      : [{ sourceField: '', targetField: '' }]
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a tabela de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables
                      .filter(table => table.table_name !== formData.sourceTable)
                      .map(table => (
                        <SelectItem key={table.id} value={table.table_name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{table.table_name}</span>
                            <span className="text-xs text-muted-foreground">{table.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Field Mapping */}
          {formData.sourceTable && formData.targetTable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mapa de Chaves</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.joinFields.map((joinField, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor={`sourceField-${index}`}>Campo Origem ({formData.sourceTable})</Label>
                      <FieldCombobox
                        value={joinField.sourceField}
                        onValueChange={(value) => updateJoinField(index, 'sourceField', value)}
                        fields={sourceFields}
                        loading={loadingSourceFields}
                        disabled={!formData.sourceTable || loadingSourceFields}
                        placeholder={loadingSourceFields ? "Carregando campos..." : "Selecione o campo"}
                        open={fieldPairOpenStates[`source-${index}`] || false}
                        onOpenChange={(open) => setFieldPairOpenStates(prev => ({ ...prev, [`source-${index}`]: open }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`targetField-${index}`}>Campo Destino ({formData.targetTable})</Label>
                      <FieldCombobox
                        value={joinField.targetField}
                        onValueChange={(value) => updateJoinField(index, 'targetField', value)}
                        fields={targetFields}
                        loading={loadingTargetFields}
                        disabled={!formData.targetTable || loadingTargetFields}
                        placeholder={loadingTargetFields ? "Carregando campos..." : "Selecione o campo"}
                        open={fieldPairOpenStates[`target-${index}`] || false}
                        onOpenChange={(open) => setFieldPairOpenStates(prev => ({ ...prev, [`target-${index}`]: open }))}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* JOIN Preview */}
          {isFormValid && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview do JOIN</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                  <code>
                    SELECT * FROM {formData.sourceTable} src<br />
                    JOIN {formData.targetTable} tgt ON {formData.joinFields.map((field, index) => (
                      <span key={index}>
                        {index > 0 && <span> AND </span>}
                        src.{field.sourceField} = tgt.{field.targetField}
                      </span>
                    ))}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Adicione observações sobre este relacionamento (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t bg-muted/30">
        <div className="text-sm text-muted-foreground">
          {isFormValid ? (
            <span className="text-green-600 font-medium">✓ Relacionamento válido</span>
          ) : (
            "Preencha todos os campos obrigatórios"
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isFormValid}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Relacionamento
          </Button>
        </div>
      </div>
    </FullscreenDialogContent>
  );
};