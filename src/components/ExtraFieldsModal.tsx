import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useProtheusTableExtraFields, 
  SUPABASE_FIELD_TYPES,
  type CreateProtheusTableExtraFieldData,
  type ProtheusTableExtraField
} from '@/hooks/useProtheusTableExtraFields';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ExtraFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId?: string;
  tableName?: string;
  tempFields?: Array<{
    field_name: string;
    field_type: string;
    is_required: boolean;
    default_value: string | null;
    compute_mode?: string;
    compute_expression?: string | null;
    compute_separator?: string | null;
    compute_options?: any;
  }>;
  onTempFieldsChange?: (fields: Array<{
    field_name: string;
    field_type: string;
    is_required: boolean;
    default_value: string | null;
    compute_mode?: string;
    compute_expression?: string | null;
    compute_separator?: string | null;
    compute_options?: any;
  }>) => void;
  restrictedMode?: boolean;
}

interface EditingField {
  id?: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  default_value: string;
  compute_mode: string;
  compute_expression: string;
  compute_separator: string;
  compute_options?: any;
}

export const ExtraFieldsModal: React.FC<ExtraFieldsModalProps> = ({
  isOpen,
  onClose,
  tableId,
  tableName,
  tempFields = [],
  onTempFieldsChange,
  restrictedMode = false
}) => {
  const { fields, loading, fetchExtraFields, createExtraField, updateExtraField, deleteExtraField } = useProtheusTableExtraFields(tableId);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Modo temporário quando não há tableId
  const isTemporaryMode = !tableId;
  const displayFields = isTemporaryMode ? tempFields : fields;

  useEffect(() => {
    if (isOpen && tableId) {
      fetchExtraFields(tableId);
    }
  }, [isOpen, tableId]);

  const handleSave = async () => {
    if (!editingField) return;

    try {
      const fieldData: CreateProtheusTableExtraFieldData = {
        field_name: editingField.field_name,
        field_type: editingField.field_type,
        is_required: editingField.is_required,
        default_value: editingField.default_value || null,
        compute_mode: editingField.compute_mode,
        compute_expression: editingField.compute_expression || undefined,
        compute_separator: editingField.compute_separator || undefined,
      };

      if (isTemporaryMode) {
        // Modo temporário - atualizar o estado local
        if (onTempFieldsChange) {
          const tempPayload = {
            field_name: editingField.field_name,
            field_type: editingField.field_type,
            is_required: editingField.is_required,
            default_value: editingField.default_value || '',
            compute_mode: editingField.compute_mode,
            compute_expression: editingField.compute_expression || '',
            compute_separator: editingField.compute_separator || '',
            compute_options: editingField.compute_options || {}
          };

          if (editingField.id) {
            // Editando campo existente
            const index = tempFields.findIndex((_, idx) => idx.toString() === editingField.id);
            if (index !== -1) {
              const newFields = [...tempFields];
              newFields[index] = tempPayload;
              onTempFieldsChange(newFields);
            }
          } else {
            // Adicionando novo campo
            onTempFieldsChange([...tempFields, tempPayload]);
          }
        }
      } else {
        // Modo persistido - salvar no banco
        if (editingField.id) {
          await updateExtraField(editingField.id, fieldData);
        } else {
          await createExtraField(tableId!, fieldData);
        }
      }
      
      setEditingField(null);
      setIsCreating(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleEdit = (field: any, index?: number) => {
    setEditingField({
      id: isTemporaryMode ? index?.toString() : field.id,
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required,
      default_value: field.default_value || '',
      compute_mode: field.compute_mode || 'none',
      compute_expression: field.compute_expression || '',
      compute_separator: field.compute_separator || '',
      compute_options: field.compute_options || {}
    });
  };

  const handleDelete = async (id: string, index?: number) => {
    if (confirm('Tem certeza que deseja remover este campo extra?')) {
      if (isTemporaryMode && onTempFieldsChange && index !== undefined) {
        const newFields = tempFields.filter((_, idx) => idx !== index);
        onTempFieldsChange(newFields);
      } else {
        await deleteExtraField(id);
      }
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setIsCreating(false);
  };

  const startCreating = () => {
    setEditingField({
      field_name: '',
      field_type: 'text',
      is_required: false,
      default_value: '',
      compute_mode: 'none',
      compute_expression: '',
      compute_separator: ''
    });
    setIsCreating(true);
  };

  const getFieldTypeLabel = (type: string) => {
    return SUPABASE_FIELD_TYPES.find(t => t.value === type)?.label || type;
  };

  const isValidFieldName = (name: string) => {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Campos Extras - {tableName || 'Tabela Protheus'}
            {isTemporaryMode && (
              <span className="text-sm text-muted-foreground font-normal ml-2">
                (Configuração Temporária)
              </span>
            )}
            {restrictedMode && (
              <span className="text-sm text-warning font-normal ml-2">
                (Apenas Novos Campos)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {restrictedMode && (
          <Alert>
            <AlertDescription>
              <strong>⚠️ Modo Restrito:</strong> Apenas novos campos podem ser adicionados. 
              Campos existentes não podem ser editados ou removidos.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Form de criação/edição */}
          {editingField && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="field_name">Nome do Campo</Label>
                    <Input
                      id="field_name"
                      value={editingField.field_name}
                      onChange={(e) => setEditingField(prev => 
                        prev ? { ...prev, field_name: e.target.value } : null
                      )}
                      placeholder="nome_do_campo"
                    />
                    {editingField.field_name && !isValidFieldName(editingField.field_name) && (
                      <p className="text-destructive text-sm mt-1">
                        Use apenas letras, números e underscore. Deve começar com letra.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="field_type">Tipo do Campo</Label>
                    <Select
                      value={editingField.field_type}
                      onValueChange={(value) => setEditingField(prev => 
                        prev ? { ...prev, field_type: value } : null
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPABASE_FIELD_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="default_value">Valor Padrão</Label>
                    <Input
                      id="default_value"
                      value={editingField.default_value}
                      onChange={(e) => setEditingField(prev => 
                        prev ? { ...prev, default_value: e.target.value } : null
                      )}
                      placeholder="(opcional)"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_required"
                      checked={editingField.is_required}
                      onCheckedChange={(checked) => setEditingField(prev => 
                        prev ? { ...prev, is_required: checked } : null
                      )}
                    />
                    <Label htmlFor="is_required">Obrigatório</Label>
                  </div>
                  </div>

                  {/* Configuração de preenchimento automático */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label htmlFor="compute_mode">Preenchimento Automático</Label>
                      <Select
                        value={editingField.compute_mode}
                        onValueChange={(value) => setEditingField(prev => 
                          prev ? { ...prev, compute_mode: value } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="concat">Juntar Campos (+)</SelectItem>
                          <SelectItem value="formula">Fórmula (soma)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="compute_expression">Expressão</Label>
                      <Input
                        id="compute_expression"
                        value={editingField.compute_expression}
                        onChange={(e) => setEditingField(prev => 
                          prev ? { ...prev, compute_expression: e.target.value } : null
                        )}
                        placeholder="Ex: A1_FILIAL+A1_COD (+ para concatenar ou somar)"
                      />
                    </div>

                    {editingField.compute_mode === 'concat' && (
                      <div>
                        <Label htmlFor="compute_separator">Separador (concatenação)</Label>
                        <Input
                          id="compute_separator"
                          value={editingField.compute_separator}
                          onChange={(e) => setEditingField(prev => 
                            prev ? { ...prev, compute_separator: e.target.value } : null
                          )}
                          placeholder="Ex: - ou /" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleSave}
                      disabled={!editingField.field_name || !isValidFieldName(editingField.field_name)}
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {isCreating ? 'Criar' : 'Salvar'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Botão para adicionar novo campo */}
          {!editingField && (
            <Button onClick={startCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo Extra
            </Button>
          )}

          {/* Tabela de campos */}
          {loading && !isTemporaryMode ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Campo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Obrigatório</TableHead>
                    <TableHead>Valor Padrão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayFields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum campo extra configurado
                      </TableCell>
                    </TableRow>
                  ) : (
                     displayFields.map((field, index) => {
                       const fieldKey = isTemporaryMode ? index : (field as ProtheusTableExtraField).id;
                       const fieldId = isTemporaryMode ? '' : (field as ProtheusTableExtraField).id;
                       
                       return (
                         <TableRow key={fieldKey}>
                           <TableCell className="font-mono">{field.field_name}</TableCell>
                           <TableCell>{getFieldTypeLabel(field.field_type)}</TableCell>
                           <TableCell>
                             {field.is_required ? (
                               <span className="text-destructive font-medium">Sim</span>
                             ) : (
                               <span className="text-muted-foreground">Não</span>
                             )}
                           </TableCell>
                           <TableCell className="font-mono">
                             {field.default_value || <span className="text-muted-foreground">-</span>}
                           </TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(field, index)}
                                  disabled={restrictedMode && !isTemporaryMode}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(fieldId, index)}
                                  disabled={restrictedMode && !isTemporaryMode}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       );
                     })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Informações sobre os campos */}
          {displayFields.length > 0 && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Total de campos extras:</strong> {displayFields.length}
              {isTemporaryMode && (
                <>
                  <br />
                  <strong>⚠️ Temporário:</strong> Estes campos serão criados quando você salvar a tabela.
                </>
              )}
              {!isTemporaryMode && (
                <>
                  <br />
                  <strong>Dica:</strong> {restrictedMode 
                    ? "Use o botão 'Atualizar Tabela Supabase' para aplicar novos campos." 
                    : "Estes campos serão criados na tabela Supabase quando a sincronização for ativada."
                  }
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};