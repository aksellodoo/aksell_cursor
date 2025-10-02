/**
 * Currency Selector Component
 * Seletor visual para tipos de moeda
 */

import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CurrencyType, CURRENCY_FORMATS } from '@/types/formField';
import { cn } from '@/lib/utils';
import { formatValue } from '@/utils/fieldFormatting';

interface CurrencySelectorProps {
  value?: CurrencyType;
  onChange: (value: CurrencyType) => void;
}

const CURRENCY_OPTIONS: Array<{
  type: CurrencyType;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    type: 'BRL',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    type: 'USD',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    type: 'EUR',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    type: 'GBP',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
];

export const CurrencySelector = ({ value, onChange }: CurrencySelectorProps) => {
  const selectedCurrency = value || 'BRL';

  // Função para formatar exemplo com base no tipo de moeda
  const getFormattedExample = (currencyType: CurrencyType): string => {
    const config = CURRENCY_FORMATS[currencyType];
    const exampleValue = 1234.56;

    // Formatar número
    const [intPart, decPart] = exampleValue.toFixed(config.decimals).split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    const formatted = `${intFormatted}${config.decimalSeparator}${decPart}`;

    // Adicionar símbolo
    if (config.symbolPosition === 'before') {
      return `${config.symbol} ${formatted}`;
    } else {
      return `${formatted} ${config.symbol}`;
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold text-foreground">Tipo de Moeda</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha a moeda para formatação automática
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CURRENCY_OPTIONS.map((option) => {
          const config = CURRENCY_FORMATS[option.type];
          const isSelected = selectedCurrency === option.type;

          return (
            <Card
              key={option.type}
              className={cn(
                'p-3 cursor-pointer transition-all duration-200 hover:shadow-md',
                'border-2',
                isSelected
                  ? `${option.borderColor} ${option.bgColor} shadow-sm`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
              onClick={() => onChange(option.type)}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                {/* Flag/Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-2xl',
                    isSelected ? option.bgColor : 'bg-gray-100'
                  )}
                >
                  {config.flag}
                </div>

                {/* Currency Name */}
                <div>
                  <div
                    className={cn(
                      'text-sm font-semibold',
                      isSelected ? option.color : 'text-gray-700'
                    )}
                  >
                    {config.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.type}
                  </div>
                </div>

                {/* Example Format */}
                <div className="text-xs font-mono bg-white/50 px-2 py-1 rounded border border-gray-200">
                  {getFormattedExample(option.type)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Preview Section */}
      {selectedCurrency && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-900 mb-1">Preview Selecionado</div>
          <div className="text-sm text-blue-700 font-mono font-semibold">
            {getFormattedExample(selectedCurrency)}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {CURRENCY_FORMATS[selectedCurrency].name} será aplicado automaticamente
          </div>
        </div>
      )}
    </div>
  );
};
