import { z } from "zod";
import { 
  Users, 
  FileSignature, 
  FileText, 
  Eye, 
  CheckSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Upload, 
  RefreshCw, 
  Package, 
  Workflow 
} from "lucide-react";

// Schemas Zod para validação
export const approvalRequired = z.object({
  data_source: z.enum(["file", "form", "text"]),
}).and(
  z.discriminatedUnion("data_source", [
    z.object({
      data_source: z.literal("file"),
      file_id: z.string().uuid(),
    }),
    z.object({
      data_source: z.literal("form"),
      form_response_id: z.string().uuid(),
    }),
    z.object({
      data_source: z.literal("text"),
      text_content: z.string().min(1),
    }),
  ])
);

export const approvalOptional = z.object({
  expires_at: z.string().datetime().optional(),
  require_justification: z.boolean().optional(),
  escalation: z.object({
    after_hours: z.number().int().positive(),
    to_user_ids: z.array(z.string().uuid()).min(1)
  }).optional(),
  notify_on_assignment: z.boolean().optional(),
});

export const signatureRequired = z.object({
  signers: z.array(z.string().uuid()).min(1),
  document_id: z.string(), // aceitar ref externa
});

export const signatureOptional = z.object({
  signing_deadline: z.string().datetime().optional(),
  signature_order: z.enum(["parallel","sequential"]).optional(),
});

export const formRequired = z.object({ 
  form_id: z.string().uuid() 
});

export const formOptional = z.object({
  recipient: z.string().uuid().optional(),
  require_all_fields: z.boolean().optional(),
  auto_submit_on_complete: z.boolean().optional(),
});

export const reviewRequired = z.object({
  reviewers: z.array(z.string().uuid()).min(1),
  target_id: z.string(),
});

export const reviewOptional = z.object({
  review_criteria: z.array(z.string()).optional(),
  require_changes_summary: z.boolean().optional(),
});

export const simpleRequired = z.object({});

export const simpleOptional = z.object({ 
  checklist: z.array(z.string()).optional() 
});

export const callRequired = z.object({
  phone: z.string().min(5),
  contact_name: z.string().optional(),
  contact_id: z.string().uuid().optional(),
}).refine(d => !!(d.contact_name || d.contact_id), { message: "Informe contact_name ou contact_id" });

export const callOptional = z.object({
  call_purpose: z.string().optional(),
  call_duration_estimated_min: z.number().positive().optional(),
});

export const emailRequired = z.object({
  to: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
});

export const emailOptional = z.object({
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  template_id: z.string().uuid().optional(),
  attachments: z.array(z.any()).optional(),
});

export const meetingRequired = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  attendees: z.array(z.string()).min(1),
});

export const meetingOptional = z.object({
  location: z.string().optional(),
  conferencing_link: z.string().optional(),
  agenda: z.string().optional(),
});

export const importRequired = z.object({
  destination: z.string().min(1),
  file_type: z.string().min(1),
});

export const importOptional = z.object({
  required_columns: z.array(z.string()).optional(),
  delimiter: z.string().optional(),
  header_row: z.boolean().optional(),
});

export const updateRequired = z.object({
  target_file_id: z.string(),
  update_reason: z.string().min(1),
});

export const updateOptional = z.object({
  keep_previous_version: z.boolean().optional(),
});

export const docDeliveryRequired = z.object({
  recipient: z.string().min(1), // uuid ou e-mail
  document_description: z.string().min(1),
});

export const docDeliveryOptional = z.object({
  delivery_method: z.string().optional(),
  confirmation_required: z.boolean().optional(),
});

export const workflowRequired = z.object({ 
  workflow_id: z.string().uuid() 
});

export const workflowOptional = z.object({
  input_params: z.record(z.any()).optional(),
  auto_start: z.boolean().optional(),
});

export const SCHEMAS = {
  approval: { required: approvalRequired, optional: approvalOptional },
  signature: { required: signatureRequired, optional: signatureOptional },
  form: { required: formRequired, optional: formOptional },
  review: { required: reviewRequired, optional: reviewOptional },
  simple_task: { required: simpleRequired, optional: simpleOptional },
  call: { required: callRequired, optional: callOptional },
  email: { required: emailRequired, optional: emailOptional },
  meeting: { required: meetingRequired, optional: meetingOptional },
  import_file: { required: importRequired, optional: importOptional },
  update_file: { required: updateRequired, optional: updateOptional },
  document_delivery: { required: docDeliveryRequired, optional: docDeliveryOptional },
  workflow: { required: workflowRequired, optional: workflowOptional },
} as const;

export type FixedTaskType = keyof typeof SCHEMAS;

// Definições dos tipos com visual e metadados
export const TASK_TYPES: Record<FixedTaskType, {
  label: string;
  icon: any;
  color: string;
  description: string;
}> = {
  approval: {
    label: "Aprovação",
    icon: Users,
    color: "hsl(var(--chart-3))",
    description: "Solicitar aprovação de usuários específicos"
  },
  signature: {
    label: "Assinatura",
    icon: FileSignature,
    color: "hsl(var(--chart-1))",
    description: "Obter assinaturas em documentos"
  },
  form: {
    label: "Formulário",
    icon: FileText,
    color: "hsl(var(--chart-2))",
    description: "Preenchimento de formulário específico"
  },
  review: {
    label: "Revisão",
    icon: Eye,
    color: "hsl(var(--chart-4))",
    description: "Revisão de conteúdo ou documento"
  },
  simple_task: {
    label: "Tarefa simples",
    icon: CheckSquare,
    color: "hsl(var(--chart-5))",
    description: "Tarefa geral sem campos específicos"
  },
  call: {
    label: "Ligação",
    icon: Phone,
    color: "hsl(var(--primary))",
    description: "Realizar ligação telefônica"
  },
  email: {
    label: "E-mail",
    icon: Mail,
    color: "hsl(var(--secondary))",
    description: "Enviar e-mail para destinatários"
  },
  meeting: {
    label: "Agendar reunião",
    icon: Calendar,
    color: "hsl(var(--accent))",
    description: "Agendar reunião com participantes"
  },
  import_file: {
    label: "Importar arquivo",
    icon: Upload,
    color: "hsl(var(--muted-foreground))",
    description: "Importar arquivo para o sistema"
  },
  update_file: {
    label: "Atualizar arquivo",
    icon: RefreshCw,
    color: "hsl(var(--destructive))",
    description: "Atualizar arquivo existente"
  },
  document_delivery: {
    label: "Entrega de documento",
    icon: Package,
    color: "hsl(var(--warning))",
    description: "Entregar documento a destinatário"
  },
  workflow: {
    label: "Workflow",
    icon: Workflow,
    color: "hsl(var(--success))",
    description: "Executar workflow automatizado"
  }
};

// Helper para validar payload de tarefa
export const validateTaskPayload = (fixedType: FixedTaskType, payload: any) => {
  const schema = SCHEMAS[fixedType];
  const requiredResult = schema.required.safeParse(payload);
  
  if (!requiredResult.success) {
    return {
      success: false,
      errors: requiredResult.error.errors,
      type: 'required' as const
    };
  }
  
  if (schema.optional) {
    const optionalResult = schema.optional.safeParse(payload);
    if (!optionalResult.success) {
      return {
        success: false,
        errors: optionalResult.error.errors,
        type: 'optional' as const
      };
    }
  }
  
  return { success: true };
};

// Helper para obter campos obrigatórios de um tipo
export const getRequiredFields = (fixedType: FixedTaskType): string[] => {
  const schema = SCHEMAS[fixedType].required;
  
  // Handle different schema types
  if ('shape' in schema._def) {
    return Object.keys(schema._def.shape());
  }
  
  // For refined schemas (like call), get the base schema
  if ('schema' in schema._def) {
    const baseSchema = schema._def.schema;
    if ('shape' in baseSchema._def) {
      return Object.keys(baseSchema._def.shape());
    }
  }
  
  return [];
};

// Helper para obter campos opcionais de um tipo
export const getOptionalFields = (fixedType: FixedTaskType): string[] => {
  const schema = SCHEMAS[fixedType].optional;
  if (!schema) return [];
  
  if ('shape' in schema._def) {
    return Object.keys(schema._def.shape());
  }
  
  return [];
};