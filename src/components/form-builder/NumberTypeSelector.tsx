/**
 * Number Type Selector Component
 * Seletor visual para tipos de campos numéricos
 */

import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { DollarSign, Percent, Hash, CreditCard, Building, MapPin, Phone } from 'lucide-react';
import { NumberSubtype } from '@/types/formField';
import { cn } from '@/lib/utils';

interface NumberTypeSelectorProps {
  value?: NumberSubtype;
  onChange: (value: NumberSubtype) => void;
}

const NUMBER_TYPES = [
  {
    value: 'currency' as NumberSubtype,
    label: 'Moeda',
    icon: DollarSign,
    description: 'R$ 1.234,56',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    value: 'decimal' as NumberSubtype,
    label: 'Decimal',
    icon: Hash,
    description: '123,45',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    value: 'percentage' as NumberSubtype,
    label: 'Porcentagem',
    icon: Percent,
    description: '25%',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    value: 'integer' as NumberSubtype,
    label: 'Inteiro',
    icon: Hash,
    description: '123',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  {
    value: 'cpf' as NumberSubtype,
    label: 'CPF',
    icon: CreditCard,
    description: '000.000.000-00',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    value: 'cnpj' as NumberSubtype,
    label: 'CNPJ',
    icon: Building,
    description: '00.000.000/0000-00',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    value: 'cep' as NumberSubtype,
    label: 'CEP',
    icon: MapPin,
    description: '00000-000',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  {
    value: 'phone' as NumberSubtype,
    label: 'Telefone',
    icon: Phone,
    description: '(11) 99999-9999',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
];

export const NumberTypeSelector = ({ value, onChange }: NumberTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold text-foreground">Tipo de Número</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha como o número será formatado e validado
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {NUMBER_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;

          return (
            <Card
              key={type.value}
              className={cn(
                'p-3 cursor-pointer transition-all duration-200 hover:shadow-md',
                'border-2',
                isSelected
                  ? `${type.borderColor} ${type.bgColor} shadow-sm`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
              onClick={() => onChange(type.value)}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isSelected ? type.bgColor : 'bg-gray-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isSelected ? type.color : 'text-gray-500'
                    )}
                  />
                </div>
                <div>
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? type.color : 'text-gray-700'
                    )}
                  >
                    {type.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {type.description}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {value && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-900 mb-1">Preview</div>
          <div className="text-sm text-blue-700 font-mono">
            {NUMBER_TYPES.find(t => t.value === value)?.description}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {value === 'cpf' || value === 'cnpj' || value === 'cep'
              ? '✅ Validação automática ativada'
              : 'Formatação será aplicada automaticamente'}
          </div>
        </div>
      )}
    </div>
  );
};
