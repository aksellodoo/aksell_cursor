/**
 * Types and interfaces for Form Builder Field Validation and Formatting
 */

// Validation rule types
export interface ValidationRules {
  // Numeric validations
  min?: number;
  max?: number;

  // String validations
  minLength?: number;
  maxLength?: number;
  pattern?: string | RegExp;
  customRegex?: string;

  // Email specific
  allowedDomains?: string[];
  blockedDomains?: string[];

  // File specific
  allowedFileTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;

  // General
  unique?: boolean;
  errorMessage?: string;
  allowedValues?: string[];
  blockedValues?: string[];
}

// Currency types
export type CurrencyType = 'BRL' | 'USD' | 'EUR' | 'GBP';

// Formatting options
export interface FormattingOptions {
  mask?: string;
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  stripNonNumeric?: boolean;
  currencyType?: CurrencyType;
}

// Conditional logic
export interface ConditionalLogic {
  show?: FieldCondition;
  enable?: FieldCondition;
  required?: FieldCondition;
}

export interface FieldCondition {
  fieldId: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains';
  value: any;
}

// Help/documentation
export interface FieldHelp {
  tooltip?: string;
  videoUrl?: string;
  exampleValue?: string;
  externalLink?: string;
}

// Number field subtypes
export type NumberSubtype =
  | 'integer'      // Números inteiros
  | 'decimal'      // Números decimais
  | 'currency'     // Moeda (R$)
  | 'percentage'   // Porcentagem (%)
  | 'cpf'          // CPF brasileiro
  | 'cnpj'         // CNPJ brasileiro
  | 'cep'          // CEP brasileiro
  | 'phone';       // Telefone brasileiro

// Email field subtypes
export type EmailSubtype =
  | 'standard'     // E-mail padrão
  | 'corporate'    // E-mail corporativo (domínios específicos)
  | 'personal';    // E-mail pessoal

// Date field subtypes
export type DateSubtype =
  | 'any'          // Qualquer data
  | 'future'       // Apenas datas futuras
  | 'past'         // Apenas datas passadas
  | 'businessDays' // Apenas dias úteis
  | 'weekends';    // Apenas finais de semana

// Extended form field interface
export interface FormFieldExtended {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  tabId?: string;
  width?: 'quarter' | 'half' | 'full';

  // New properties
  subtype?: NumberSubtype | EmailSubtype | DateSubtype | string;
  validation?: ValidationRules;
  formatting?: FormattingOptions;
  conditional?: ConditionalLogic;
  help?: FieldHelp;

  // Legacy properties
  observacao?: string;
  options?: string[];
  aiAssistEnabled?: boolean;
  aiAssistPrompt?: string;
  aiConfig?: any;
  downloads?: any[];

  // Additional properties
  [key: string]: any;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Field masks presets
export const FIELD_MASKS = {
  cpf: '999.999.999-99',
  cnpj: '99.999.999/9999-99',
  cep: '99999-999',
  phone: '(99) 99999-9999',
  date: '99/99/9999',
  time: '99:99',
  creditCard: '9999 9999 9999 9999',
  cvv: '999',
} as const;

// Currency configuration interface
export interface CurrencyConfig {
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  flag: string;
  name: string;
}

// Currency formats
export const CURRENCY_FORMATS: Record<CurrencyType, CurrencyConfig> = {
  BRL: {
    symbol: 'R$',
    symbolPosition: 'before',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    flag: '🇧🇷',
    name: 'Real Brasileiro',
  },
  USD: {
    symbol: '$',
    symbolPosition: 'before',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇺🇸',
    name: 'Dólar Americano',
  },
  EUR: {
    symbol: '€',
    symbolPosition: 'before',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    flag: '🇪🇺',
    name: 'Euro',
  },
  GBP: {
    symbol: '£',
    symbolPosition: 'before',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    flag: '🇬🇧',
    name: 'Libra Esterlina',
  },
};

// Number formatting presets
export const NUMBER_FORMATS = {
  currency: {
    prefix: 'R$ ',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    currencyType: 'BRL' as CurrencyType,
  },
  percentage: {
    suffix: '%',
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  decimal: {
    decimals: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  integer: {
    decimals: 0,
    thousandsSeparator: '.',
  },
} as const;
