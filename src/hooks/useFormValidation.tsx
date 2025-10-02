import { useMemo } from 'react';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'warning';
  tab: 'publication' | 'recipients' | 'settings';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorsByTab: Record<string, ValidationError[]>;
  criticalErrors: ValidationError[];
  warningErrors: ValidationError[];
  completionPercentage: number;
}

export const useFormValidation = (config: any) => {
  return useMemo(() => {
    const errors: ValidationError[] = [];

    // Publication tab validations
    const isDraft = !config.status || config.status === 'draft';
    
    if (!config.status) {
      errors.push({
        field: 'status',
        message: 'Status de publicação é obrigatório',
        severity: 'critical',
        tab: 'publication'
      });
    }

    if (!config.confidentiality_level) {
      errors.push({
        field: 'confidentiality_level',
        message: 'Nível de confidencialidade é obrigatório',
        severity: isDraft ? 'warning' : 'critical',
        tab: 'publication'
      });
    }

    // Recipients tab validations
    const isInternal = config.status === 'published_internal' || config.status === 'published_mixed';
    const isExternal = config.status === 'published_external' || config.status === 'published_mixed';
    const isTaskUsage = config.status === 'task_usage';

    // Pular validação de destinatários para formulários de uso em tarefas
    if (isInternal && !isTaskUsage) {
      const hasInternalRecipients = 
        (config.internal_recipients?.users?.length > 0) ||
        (config.internal_recipients?.departments?.length > 0) ||
        (config.internal_recipients?.roles?.length > 0);

      if (!hasInternalRecipients) {
        errors.push({
          field: 'internal_recipients',
          message: 'Selecione pelo menos um destinatário interno',
          severity: 'critical',
          tab: 'recipients'
        });
      }
    }

    if (isExternal && !isTaskUsage) {
      const hasExternalAccess =
        config.allows_anonymous_responses ||
        (config.external_recipients?.length > 0) ||
        (config.external_contact_ids?.length > 0);

      if (!hasExternalAccess) {
        errors.push({
          field: 'external_recipients',
          message: 'Adicione usuários externos ou permita respostas anônimas',
          severity: 'critical',
          tab: 'recipients'
        });
      }
    }

    // Settings tab validations
    const estimatedFillMinutes = config.estimated_fill_minutes || config.publication_settings?.estimated_fill_minutes;
    if (!estimatedFillMinutes) {
      errors.push({
        field: 'estimated_fill_minutes',
        message: 'Tempo estimado de preenchimento é obrigatório',
        severity: 'critical',
        tab: 'settings'
      });
    }

    const responseLimit = config.response_limit || config.publication_settings?.max_responses_per_user;
    if (responseLimit && responseLimit < 1) {
      errors.push({
        field: 'response_limit',
        message: 'Limite de respostas deve ser maior que zero',
        severity: 'warning',
        tab: 'settings'
      });
    }

    const deadline = config.deadline || config.publication_settings?.response_deadline;
    if (deadline && new Date(deadline) <= new Date()) {
      errors.push({
        field: 'deadline',
        message: 'Data limite deve ser no futuro',
        severity: 'warning',
        tab: 'settings'
      });
    }

    // Group errors by tab
    const errorsByTab = errors.reduce((acc, error) => {
      if (!acc[error.tab]) acc[error.tab] = [];
      acc[error.tab].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);

    // Separate by severity
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const warningErrors = errors.filter(e => e.severity === 'warning');

    // Calculate completion percentage
    let totalFields, completedFields = 0;
    
    if (isDraft) {
      // For drafts, count all filled fields regardless of publication requirements
      totalFields = 7;
      if (config.status) completedFields++;
      if (config.confidentiality_level) completedFields++;
      if ((config.internal_recipients?.users?.length > 0) || 
          (config.internal_recipients?.departments?.length > 0) || 
          (config.internal_recipients?.roles?.length > 0)) completedFields++;
      if (config.allows_anonymous_responses || config.external_recipients?.length > 0 || config.external_contact_ids?.length > 0) completedFields++;
      if (config.response_limit && config.response_limit >= 1) completedFields++;
      if (config.deadline && new Date(config.deadline) > new Date()) completedFields++;
      if (config.estimated_fill_minutes) completedFields++;
    } else {
      // For published forms, only count required fields
      if (isTaskUsage) {
        // Para formulários de uso em tarefas, só precisamos de status, confidencialidade e tempo estimado
        totalFields = 3;
        if (config.status && config.status !== 'draft') completedFields++;
        if (config.confidentiality_level) completedFields++;
        if (config.estimated_fill_minutes) completedFields++;
      } else {
        totalFields = (isInternal && isExternal ? 4 : 3) + 1; // status, confidentiality, recipients (internal/external/both) + estimated_fill_minutes
        if (config.status && config.status !== 'draft') completedFields++;
        if (config.confidentiality_level) completedFields++;
        if (config.estimated_fill_minutes) completedFields++;
        if (isInternal && ((config.internal_recipients?.users?.length > 0) || 
                           (config.internal_recipients?.departments?.length > 0) || 
                           (config.internal_recipients?.roles?.length > 0))) completedFields++;
        if (isExternal && (config.allows_anonymous_responses || config.external_recipients?.length > 0 || config.external_contact_ids?.length > 0)) completedFields++;
      }
    }

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      isValid: criticalErrors.length === 0,
      errors,
      errorsByTab,
      criticalErrors,
      warningErrors,
      completionPercentage
    };
  }, [config]);
};