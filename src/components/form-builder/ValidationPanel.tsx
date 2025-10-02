/**
 * Validation Panel Component
 * Painel de configuração de regras de validação para campos de formulário
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Shield } from 'lucide-react';
import { FormFieldExtended, ValidationRules, CurrencyType } from '@/types/formField';
import { CurrencySelector } from './CurrencySelector';
import { getCurrencyFormatting } from '@/utils/fieldFormatting';

interface ValidationPanelProps {
  field: FormFieldExtended;
  onUpdate: (updates: Partial<FormFieldExtended>) => void;
}

export const ValidationPanel = ({ field, onUpdate }: ValidationPanelProps) => {
  const validation = field.validation || {};

  const updateValidation = (updates: Partial<ValidationRules>) => {
    onUpdate({
      validation: {
        ...validation,
        ...updates,
      },
    });
  };

  const addDomain = (type: 'allowed' | 'blocked', domain: string) => {
    if (!domain.trim()) return;

    const key = type === 'allowed' ? 'allowedDomains' : 'blockedDomains';
    const current = validation[key] || [];

    updateValidation({
      [key]: [...current, domain.trim()],
    });
  };

  const removeDomain = (type: 'allowed' | 'blocked', index: number) => {
    const key = type === 'allowed' ? 'allowedDomains' : 'blockedDomains';
    const current = validation[key] || [];

    updateValidation({
      [key]: current.filter((_, i) => i !== index),
    });
  };

  const addFileType = (fileType: string) => {
    if (!fileType.trim()) return;

    const current = validation.allowedFileTypes || [];
    updateValidation({
      allowedFileTypes: [...current, fileType.trim()],
    });
  };

  const removeFileType = (index: number) => {
    const current = validation.allowedFileTypes || [];
    updateValidation({
      allowedFileTypes: current.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-blue-600" />
        <Label className="text-sm font-semibold text-blue-900">Validação</Label>
      </div>

      {/* Validações para E-mail */}
      {field.type === 'email' && (
        <div className="space-y-4">
          {/* Domínios Permitidos */}
          <div>
            <Label className="text-sm font-medium">Domínios Permitidos</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Apenas e-mails destes domínios serão aceitos
            </p>
            <div className="space-y-2">
              {validation.allowedDomains?.map((domain, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1">
                    {domain}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDomain('allowed', index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="@empresa.com"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addDomain('allowed', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    addDomain('allowed', input.value);
                    input.value = '';
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Domínios Bloqueados */}
          <div>
            <Label className="text-sm font-medium">Domínios Bloqueados</Label>
            <p className="text-xs text-muted-foreground mb-2">
              E-mails destes domínios serão rejeitados
            </p>
            <div className="space-y-2">
              {validation.blockedDomains?.map((domain, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="destructive" className="flex-1">
                    {domain}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDomain('blocked', index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="@gmail.com"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addDomain('blocked', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    addDomain('blocked', input.value);
                    input.value = '';
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* E-mail Único */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={validation.unique || false}
              onCheckedChange={(checked) => updateValidation({ unique: !!checked })}
            />
            <Label className="text-sm">E-mail único (evitar duplicatas)</Label>
          </div>
        </div>
      )}

      {/* Validações para Número */}
      {field.type === 'number' && (
        <div className="space-y-4">
          {/* Seletor de Moeda - apenas quando subtipo é 'currency' */}
          {field.subtype === 'currency' && (
            <CurrencySelector
              value={field.formatting?.currencyType}
              onChange={(currencyType: CurrencyType) => {
                const newFormatting = getCurrencyFormatting(currencyType);
                onUpdate({
                  formatting: {
                    ...field.formatting,
                    ...newFormatting,
                  },
                });
              }}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Valor Mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={validation.min ?? ''}
                onChange={(e) =>
                  updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Valor Máximo</Label>
              <Input
                type="number"
                placeholder="100"
                value={validation.max ?? ''}
                onChange={(e) =>
                  updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Validações para Texto */}
      {(field.type === 'text' || field.type === 'textarea') && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Mínimo de Caracteres</Label>
              <Input
                type="number"
                placeholder="0"
                value={validation.minLength ?? ''}
                onChange={(e) =>
                  updateValidation({
                    minLength: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Máximo de Caracteres</Label>
              <Input
                type="number"
                placeholder="1000"
                value={validation.maxLength ?? ''}
                onChange={(e) =>
                  updateValidation({
                    maxLength: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>

          {/* Regex Personalizado */}
          <div>
            <Label className="text-sm font-medium">Expressão Regular (Regex)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Padrão personalizado para validação
            </p>
            <Input
              placeholder="^[A-Z][a-z]+$"
              value={validation.customRegex ?? ''}
              onChange={(e) => updateValidation({ customRegex: e.target.value })}
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* Validações para Arquivo */}
      {field.type === 'file' && (
        <div className="space-y-4">
          {/* Tipos de Arquivo Permitidos */}
          <div>
            <Label className="text-sm font-medium">Tipos de Arquivo Permitidos</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Ex: .pdf, .jpg, .png, .docx
            </p>
            <div className="space-y-2">
              {validation.allowedFileTypes?.map((type, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1">
                    {type}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => removeFileType(index)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder=".pdf"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addFileType(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    addFileType(input.value);
                    input.value = '';
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tamanho Máximo */}
          <div>
            <Label className="text-sm font-medium">Tamanho Máximo (MB)</Label>
            <Input
              type="number"
              placeholder="5"
              value={validation.maxFileSize ?? ''}
              onChange={(e) =>
                updateValidation({
                  maxFileSize: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>

          {/* Número Máximo de Arquivos */}
          <div>
            <Label className="text-sm font-medium">Número Máximo de Arquivos</Label>
            <Input
              type="number"
              placeholder="1"
              value={validation.maxFiles ?? ''}
              onChange={(e) =>
                updateValidation({
                  maxFiles: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Validações para Data */}
      {(field.type === 'date' || field.type === 'datetime-local') && (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Data Mínima</Label>
            <Input
              type="date"
              value={validation.min ?? ''}
              onChange={(e) => updateValidation({ min: e.target.value ? Number(new Date(e.target.value)) : undefined })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Data Máxima</Label>
            <Input
              type="date"
              value={validation.max ?? ''}
              onChange={(e) => updateValidation({ max: e.target.value ? Number(new Date(e.target.value)) : undefined })}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Mensagem de Erro Personalizada */}
      <div>
        <Label className="text-sm font-medium">Mensagem de Erro Personalizada</Label>
        <Textarea
          placeholder="Digite uma mensagem de erro personalizada..."
          value={validation.errorMessage ?? ''}
          onChange={(e) => updateValidation({ errorMessage: e.target.value })}
          className="mt-2 rounded-xl"
          rows={2}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Mensagem mostrada quando a validação falhar
        </p>
      </div>
    </div>
  );
};
