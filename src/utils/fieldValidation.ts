/**
 * Field Validation Utilities
 * Funções para validação de campos de formulário
 */

import { ValidationRules, ValidationResult, FormFieldExtended } from '@/types/formField';

/**
 * Valida um campo de formulário baseado em suas regras
 */
export function validateField(
  value: any,
  field: FormFieldExtended
): ValidationResult {
  const errors: string[] = [];

  // Campo obrigatório
  if (field.required && !value) {
    errors.push(field.validation?.errorMessage || `${field.label} é obrigatório`);
    return { valid: false, errors };
  }

  // Se não tem valor e não é obrigatório, não precisa validar
  if (!value) {
    return { valid: true, errors: [] };
  }

  const validation = field.validation;
  if (!validation) {
    return { valid: true, errors: [] };
  }

  // Validações por tipo de campo
  switch (field.type) {
    case 'email':
      validateEmail(value, validation, errors);
      break;
    case 'number':
      validateNumber(value, validation, field.subtype, errors);
      break;
    case 'text':
    case 'textarea':
      validateText(value, validation, errors);
      break;
    case 'tel':
      validatePhone(value, validation, errors);
      break;
    case 'url':
      validateURL(value, validation, errors);
      break;
    case 'file':
      validateFile(value, validation, errors);
      break;
    case 'date':
    case 'datetime-local':
      validateDate(value, validation, errors);
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validação de e-mail
 */
function validateEmail(
  value: string,
  validation: ValidationRules,
  errors: string[]
): void {
  // Regex básico de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    errors.push(validation.errorMessage || 'E-mail inválido');
    return;
  }

  // Validar domínios permitidos
  if (validation.allowedDomains && validation.allowedDomains.length > 0) {
    const domain = value.substring(value.indexOf('@'));
    const isAllowed = validation.allowedDomains.some(d =>
      domain.toLowerCase().endsWith(d.toLowerCase())
    );

    if (!isAllowed) {
      errors.push(
        validation.errorMessage ||
        `E-mail deve ser de um dos domínios: ${validation.allowedDomains.join(', ')}`
      );
    }
  }

  // Validar domínios bloqueados
  if (validation.blockedDomains && validation.blockedDomains.length > 0) {
    const domain = value.substring(value.indexOf('@'));
    const isBlocked = validation.blockedDomains.some(d =>
      domain.toLowerCase().endsWith(d.toLowerCase())
    );

    if (isBlocked) {
      errors.push(
        validation.errorMessage ||
        `E-mails de ${domain} não são permitidos`
      );
    }
  }
}

/**
 * Validação de número
 */
function validateNumber(
  value: any,
  validation: ValidationRules,
  subtype: string | undefined,
  errors: string[]
): void {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;

  if (isNaN(numValue)) {
    errors.push(validation.errorMessage || 'Valor numérico inválido');
    return;
  }

  // Validações específicas por subtipo
  if (subtype === 'cpf') {
    if (!validateCPF(value)) {
      errors.push(validation.errorMessage || 'CPF inválido');
    }
    return;
  }

  if (subtype === 'cnpj') {
    if (!validateCNPJ(value)) {
      errors.push(validation.errorMessage || 'CNPJ inválido');
    }
    return;
  }

  if (subtype === 'cep') {
    if (!validateCEP(value)) {
      errors.push(validation.errorMessage || 'CEP inválido');
    }
    return;
  }

  if (subtype === 'integer' && !Number.isInteger(numValue)) {
    errors.push(validation.errorMessage || 'O valor deve ser um número inteiro');
  }

  if (subtype === 'percentage') {
    if (numValue < 0 || numValue > 100) {
      errors.push(validation.errorMessage || 'A porcentagem deve estar entre 0 e 100');
    }
  }

  // Min/Max
  if (validation.min !== undefined && numValue < validation.min) {
    errors.push(validation.errorMessage || `Valor mínimo: ${validation.min}`);
  }

  if (validation.max !== undefined && numValue > validation.max) {
    errors.push(validation.errorMessage || `Valor máximo: ${validation.max}`);
  }
}

/**
 * Validação de texto
 */
function validateText(
  value: string,
  validation: ValidationRules,
  errors: string[]
): void {
  // Min/Max length
  if (validation.minLength && value.length < validation.minLength) {
    errors.push(
      validation.errorMessage ||
      `Mínimo de ${validation.minLength} caracteres`
    );
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    errors.push(
      validation.errorMessage ||
      `Máximo de ${validation.maxLength} caracteres`
    );
  }

  // Regex personalizado
  if (validation.customRegex) {
    try {
      const regex = new RegExp(validation.customRegex);
      if (!regex.test(value)) {
        errors.push(validation.errorMessage || 'Formato inválido');
      }
    } catch (e) {
      console.error('Invalid regex pattern:', validation.customRegex);
    }
  }

  // Pattern predefinido
  if (validation.pattern) {
    const regex = typeof validation.pattern === 'string'
      ? new RegExp(validation.pattern)
      : validation.pattern;

    if (!regex.test(value)) {
      errors.push(validation.errorMessage || 'Formato inválido');
    }
  }
}

/**
 * Validação de telefone
 */
function validatePhone(
  value: string,
  validation: ValidationRules,
  errors: string[]
): void {
  // Remove caracteres não numéricos
  const digits = value.replace(/\D/g, '');

  // Telefone brasileiro: 10 ou 11 dígitos
  if (digits.length < 10 || digits.length > 11) {
    errors.push(validation.errorMessage || 'Telefone inválido');
    return;
  }

  // Validar DDD (códigos válidos do Brasil)
  const ddd = parseInt(digits.substring(0, 2));
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99, // MA
  ];

  if (!validDDDs.includes(ddd)) {
    errors.push(validation.errorMessage || 'DDD inválido');
  }
}

/**
 * Validação de URL
 */
function validateURL(
  value: string,
  validation: ValidationRules,
  errors: string[]
): void {
  try {
    const url = new URL(value);

    // Validar protocolos permitidos (padrão: http e https)
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(url.protocol)) {
      errors.push(validation.errorMessage || 'Protocolo não permitido');
    }
  } catch {
    errors.push(validation.errorMessage || 'URL inválida');
  }
}

/**
 * Validação de arquivo
 */
function validateFile(
  value: any,
  validation: ValidationRules,
  errors: string[]
): void {
  if (!value || !value.length) return;

  const files = Array.isArray(value) ? value : [value];

  // Validar número de arquivos
  if (validation.maxFiles && files.length > validation.maxFiles) {
    errors.push(
      validation.errorMessage ||
      `Máximo de ${validation.maxFiles} arquivo(s)`
    );
  }

  files.forEach((file: File) => {
    // Validar tipo de arquivo
    if (validation.allowedFileTypes && validation.allowedFileTypes.length > 0) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isAllowed = validation.allowedFileTypes.some(type =>
        type.toLowerCase() === `.${fileExt}` ||
        type.toLowerCase() === fileExt
      );

      if (!isAllowed) {
        errors.push(
          validation.errorMessage ||
          `Tipo de arquivo não permitido. Permitidos: ${validation.allowedFileTypes.join(', ')}`
        );
      }
    }

    // Validar tamanho
    if (validation.maxFileSize) {
      const maxSizeBytes = validation.maxFileSize * 1024 * 1024; // MB to bytes
      if (file.size > maxSizeBytes) {
        errors.push(
          validation.errorMessage ||
          `Arquivo muito grande. Tamanho máximo: ${validation.maxFileSize}MB`
        );
      }
    }
  });
}

/**
 * Validação de data
 */
function validateDate(
  value: string,
  validation: ValidationRules,
  errors: string[]
): void {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    errors.push(validation.errorMessage || 'Data inválida');
    return;
  }

  // Min date
  if (validation.min) {
    const minDate = new Date(validation.min);
    if (date < minDate) {
      errors.push(
        validation.errorMessage ||
        `Data mínima: ${minDate.toLocaleDateString('pt-BR')}`
      );
    }
  }

  // Max date
  if (validation.max) {
    const maxDate = new Date(validation.max);
    if (date > maxDate) {
      errors.push(
        validation.errorMessage ||
        `Data máxima: ${maxDate.toLocaleDateString('pt-BR')}`
      );
    }
  }
}

/**
 * Validação de CPF
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;

  return true;
}

/**
 * Validação de CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Valida primeiro dígito verificador
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Valida segundo dígito verificador
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Validação de CEP
 */
export function validateCEP(cep: string): boolean {
  cep = cep.replace(/[^\d]/g, '');
  return cep.length === 8 && /^\d{8}$/.test(cep);
}
