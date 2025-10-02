/**
 * Field Formatting Utilities
 * Funções para formatação de campos de formulário
 */

import { FormattingOptions, NumberSubtype, FIELD_MASKS, NUMBER_FORMATS, CURRENCY_FORMATS, CurrencyType } from '@/types/formField';

/**
 * Formata um valor baseado nas opções de formatação
 */
export function formatValue(
  value: any,
  fieldType: string,
  subtype?: string,
  formatting?: FormattingOptions
): string {
  if (!value && value !== 0) return '';

  let formatted = String(value);

  // Formatação por tipo de campo
  switch (fieldType) {
    case 'number':
      formatted = formatNumber(value, subtype as NumberSubtype, formatting);
      break;
    case 'tel':
      formatted = formatPhone(value);
      break;
    case 'text':
    case 'textarea':
      formatted = formatText(value, formatting);
      break;
  }

  // Aplicar transformações gerais
  if (formatting?.transform) {
    formatted = applyTextTransform(formatted, formatting.transform);
  }

  // Adicionar prefixo/sufixo
  if (formatting?.prefix) {
    formatted = formatting.prefix + formatted;
  }
  if (formatting?.suffix) {
    formatted = formatted + formatting.suffix;
  }

  return formatted;
}

/**
 * Formata números baseado no subtipo
 */
export function formatNumber(
  value: any,
  subtype?: NumberSubtype,
  formatting?: FormattingOptions
): string {
  // Remove caracteres não numéricos se configurado
  let cleanValue = String(value);
  if (formatting?.stripNonNumeric) {
    cleanValue = cleanValue.replace(/[^\d.-]/g, '');
  }

  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return cleanValue;

  // Formatação por subtipo
  switch (subtype) {
    case 'cpf':
      return formatCPF(cleanValue);
    case 'cnpj':
      return formatCNPJ(cleanValue);
    case 'cep':
      return formatCEP(cleanValue);
    case 'currency':
      return formatCurrency(numValue, formatting);
    case 'percentage':
      return formatPercentage(numValue, formatting);
    case 'integer':
      return formatInteger(numValue, formatting);
    case 'decimal':
      return formatDecimal(numValue, formatting);
    default:
      return formatDecimal(numValue, formatting);
  }
}

/**
 * Formata moeda baseado no tipo de moeda selecionado
 */
function formatCurrency(value: number, formatting?: FormattingOptions): string {
  // Obter tipo de moeda (padrão: BRL)
  const currencyType = formatting?.currencyType || 'BRL';
  const currencyConfig = CURRENCY_FORMATS[currencyType];

  // Criar opções de formatação usando a config da moeda
  const format: FormattingOptions = {
    decimals: currencyConfig.decimals,
    thousandsSeparator: currencyConfig.thousandsSeparator,
    decimalSeparator: currencyConfig.decimalSeparator,
    ...formatting, // Permitir sobrescrever configurações
  };

  const formatted = formatDecimal(value, format);

  // Aplicar símbolo da moeda
  if (currencyConfig.symbolPosition === 'before') {
    return `${currencyConfig.symbol} ${formatted}`;
  } else {
    return `${formatted} ${currencyConfig.symbol}`;
  }
}

/**
 * Formata porcentagem
 */
function formatPercentage(value: number, formatting?: FormattingOptions): string {
  const format = { ...NUMBER_FORMATS.percentage, ...formatting };

  const formatted = formatDecimal(value, format);
  return `${formatted}${format.suffix || '%'}`;
}

/**
 * Formata número inteiro
 */
function formatInteger(value: number, formatting?: FormattingOptions): string {
  const format = { ...NUMBER_FORMATS.integer, ...formatting };
  const intValue = Math.floor(value);

  return formatDecimal(intValue, { ...format, decimals: 0 });
}

/**
 * Formata número decimal
 */
function formatDecimal(value: number, formatting?: FormattingOptions): string {
  const format = { ...NUMBER_FORMATS.decimal, ...formatting };

  // Arredondar para o número de decimais
  const decimals = format.decimals ?? 2;
  const rounded = Number(value.toFixed(decimals));

  // Separar parte inteira e decimal
  const [intPart, decPart] = rounded.toFixed(decimals).split('.');

  // Adicionar separador de milhares
  const intFormatted = intPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    format.thousandsSeparator || '.'
  );

  // Combinar com parte decimal
  if (decimals > 0 && decPart) {
    return `${intFormatted}${format.decimalSeparator || ','}${decPart}`;
  }

  return intFormatted;
}

/**
 * Formata CPF
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CEP
 */
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formata telefone brasileiro
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 11) {
    // Celular: (11) 99999-9999
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length === 10) {
    // Fixo: (11) 9999-9999
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return value;
}

/**
 * Formata texto
 */
function formatText(value: string, formatting?: FormattingOptions): string {
  let formatted = value;

  // Aplicar máscara se especificada
  if (formatting?.mask) {
    formatted = applyMask(value, formatting.mask);
  }

  return formatted;
}

/**
 * Aplica máscara a um valor
 */
export function applyMask(value: string, mask: string): string {
  if (!mask) return value;

  const digits = value.replace(/\D/g, '');
  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '9') {
      result += digits[digitIndex];
      digitIndex++;
    } else if (mask[i] === 'A') {
      const char = value[digitIndex];
      if (char && /[A-Za-z]/.test(char)) {
        result += char;
        digitIndex++;
      } else {
        break;
      }
    } else {
      result += mask[i];
    }
  }

  return result;
}

/**
 * Aplica transformação de texto
 */
function applyTextTransform(
  value: string,
  transform: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
): string {
  switch (transform) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    default:
      return value;
  }
}

/**
 * Remove formatação de um valor
 */
export function unformatValue(
  value: string,
  fieldType: string,
  subtype?: string
): string | number {
  if (!value) return '';

  switch (fieldType) {
    case 'number':
      return unformatNumber(value, subtype as NumberSubtype);
    case 'tel':
      return value.replace(/\D/g, '');
    default:
      return value;
  }
}

/**
 * Remove formatação de números
 */
function unformatNumber(value: string, subtype?: NumberSubtype): number | string {
  // Para CPF, CNPJ, CEP, retornar apenas dígitos como string
  if (['cpf', 'cnpj', 'cep', 'phone'].includes(subtype || '')) {
    return value.replace(/\D/g, '');
  }

  // Para números, remover formatação e converter para number
  const cleaned = value.replace(/[^\d.,-]/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');

  return parseFloat(normalized) || 0;
}

/**
 * Obtém máscara padrão baseada no subtipo
 */
export function getDefaultMask(subtype?: string): string | undefined {
  switch (subtype) {
    case 'cpf':
      return FIELD_MASKS.cpf;
    case 'cnpj':
      return FIELD_MASKS.cnpj;
    case 'cep':
      return FIELD_MASKS.cep;
    case 'phone':
      return FIELD_MASKS.phone;
    default:
      return undefined;
  }
}

/**
 * Obtém opções de formatação padrão baseadas no subtipo
 */
export function getDefaultFormatting(subtype?: NumberSubtype, currencyType?: CurrencyType): FormattingOptions | undefined {
  switch (subtype) {
    case 'currency':
      return getCurrencyFormatting(currencyType || 'BRL');
    case 'percentage':
      return NUMBER_FORMATS.percentage;
    case 'decimal':
      return NUMBER_FORMATS.decimal;
    case 'integer':
      return NUMBER_FORMATS.integer;
    default:
      return undefined;
  }
}

/**
 * Obtém opções de formatação para um tipo de moeda específico
 */
export function getCurrencyFormatting(currencyType: CurrencyType): FormattingOptions {
  const config = CURRENCY_FORMATS[currencyType];
  return {
    currencyType,
    decimals: config.decimals,
    thousandsSeparator: config.thousandsSeparator,
    decimalSeparator: config.decimalSeparator,
    prefix: config.symbolPosition === 'before' ? `${config.symbol} ` : undefined,
    suffix: config.symbolPosition === 'after' ? ` ${config.symbol}` : undefined,
  };
}
