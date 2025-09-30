import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus, Edit, Search, X, Settings } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { CustomFullscreenModal } from "@/components/ui/custom-fullscreen-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useContactEntities, type CreateContactEntityData, type ContactEntity } from '@/hooks/useContactEntities';
import { entityTypeOptions, getEntityTypeLabel } from '@/utils/entityTypeUtils';
import { usePublicOrgDetails, type PublicOrgDetails } from '@/hooks/usePublicOrgDetails';
import { useAssociationDetails } from '@/hooks/useAssociationDetails';
import { useExternalPartnerDetails } from '@/hooks/useExternalPartnerDetails';
import { usePartnerProjects } from '@/hooks/usePartnerProjects';
import { getSupabaseErrorMessage } from '@/utils/supabaseErrors';
import { CitySelector } from '@/components/CitySelector';
import { useDepartments } from '@/hooks/useDepartments';
import { useProfiles } from '@/hooks/useProfiles';
import { TagInput } from "@/components/TagInput";
import { TagsManager } from "@/components/TagsManager";
import { useContactEntityTags } from "@/hooks/useContactEntityTags";
import { EmailTag } from "@/hooks/useEmailTags";
import { Checkbox } from "@/components/ui/checkbox";
import { EntityStatusBadge } from "@/components/contacts/EntityStatusBadge";

const baseEntityFormSchema = z.object({
  type: z.string().min(1, 'Tipo da entidade é obrigatório'),
  name: z.string().optional(), // Name will be auto-derived
  notes: z.string().optional(),
});

const publicOrgFormSchema = z.object({
  // Base fields
  type: z.string().min(1, 'Tipo da entidade é obrigatório'),
  name: z.string().optional(), // Name will be auto-derived
  notes: z.string().optional(),
  
  // Public org specific fields
  official_name: z.string().min(1, 'Nome oficial é obrigatório'),
  acronym: z.string().optional(),
  governmental_sphere: z.enum(['municipal', 'estadual', 'federal', 'internacional']),
  organ_type: z.enum(['regulador', 'fiscalizador', 'policia', 'ministerio', 'prefeitura', 'outro']),
  activity_areas: z.string().optional(),
  cnpj: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  city_id: z.string().optional(),
  cep: z.string().optional(),
  website: z.string().optional(),
  regional_unit: z.string().optional(),
  relation_type: z.enum(['fiscalizacao', 'registro_certificacao', 'autorizacao', 'licenciamento', 'outros']),
  relation_detail: z.string().optional(),
  responsible_type: z.enum(['user', 'department']).optional(),
  responsible_user_id: z.string().optional(),
  responsible_department_id: z.string().optional(),
  status: z.enum(['regular', 'pendente', 'em_fiscalizacao', 'em_auditoria', 'outro']).default('regular'),
});

const associationFormSchema = z.object({
  // Base fields
  type: z.string().min(1, 'Tipo da entidade é obrigatório'),
  name: z.string().optional(), // Name will be auto-derived
  notes: z.string().optional(),
  
  // Association specific fields
  official_name: z.string().min(1, 'Nome oficial é obrigatório'),
  acronym: z.string().optional(),
  association_type: z.string().optional(),
  activity_area: z.string().optional(),
  cnpj: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  city_id: z.string().optional(),
  cep: z.string().optional(),
  website: z.string().optional(),
  regional_unit: z.string().optional(),
  company_relationship_types: z.string().optional(),
  participation_level: z.string().optional(),
  responsible_type: z.enum(['user', 'department']).optional(),
  responsible_user_id: z.string().optional(),
  responsible_department_id: z.string().optional(),
  current_status: z.string().optional(),
  interaction_history: z.string().optional(),
  has_financial_contributions: z.boolean().optional(),
  contribution_amount: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) || val === '' || val === null ? undefined : num;
  }, z.number().optional()),
  contribution_frequency: z.string().optional(),
  affiliation_date: z.string().optional(),
  association_validity_date: z.string().optional(),
});

const externalPartnerFormSchema = z.object({
  // Base fields
  type: z.string().min(1, 'Tipo da entidade é obrigatório'),
  name: z.string().optional(), // Name will be auto-derived
  notes: z.string().optional(),
  
  // Identification
  official_name: z.string().min(1, "Nome oficial é obrigatório"),
  trade_name: z.string().optional(),
  cnpj: z.string().optional(),
  partner_type: z.enum(['ong', 'universidade', 'instituto_pesquisa', 'camara_comercio', 'embaixada', 'midia', 'evento', 'incubadora', 'escola_tecnica', 'comunidade_oss', 'outro']),
  interest_areas: z.array(z.string()).optional(),
  website: z.string().optional(),
  official_profiles: z.array(z.string()).optional(),
  
  // Framework & Compliance
  relationship_nature: z.array(z.enum(['institucional', 'projeto', 'patrocinio_nao_comercial', 'doacao', 'voluntariado', 'divulgacao', 'mentoria', 'outro'])).min(1, "Selecione pelo menos uma natureza do relacionamento"),
  relationship_nature_other: z.string().optional(),
  risk_level: z.enum(['baixo', 'medio', 'alto']).optional(),
  nda_mou_term: z.boolean().optional(),
  nda_mou_number: z.string().optional(),
  nda_mou_url: z.string().optional(),
  nda_mou_validity: z.string().optional(),
  conflict_of_interest: z.boolean().optional(),
  conflict_observation: z.string().optional(),
  lgpd_basis: z.enum(['consentimento', 'legitimo_interesse', 'cumprimento_obrigacao_legal', 'protecao_vida', 'exercicio_poder_publico', 'interesse_legitimo']).optional(),
  
  // Scope & Interactions
  relationship_objective: z.string().optional(),
  kpis: z.string().optional(),
  counterparts: z.string().optional(),
  
  // Internal Relationship
  responsible_user_id: z.string().optional(),
  responsible_department_id: z.string().optional(),
  internal_areas: z.array(z.string()).optional(),
  relevance: z.enum(['estrategico', 'tatico', 'ocasional']).optional(),
  status: z.enum(['ativo', 'pausado', 'encerrado', 'avaliando']).optional(),
  
  // Address & Channels
  city_id: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  cep: z.string().optional(),
  generic_email: z.string().optional(),
  phone: z.string().optional(),
  contact_form_url: z.string().optional(),
  media_kit_url: z.string().optional(),
  drive_link: z.string().optional(),
});

// Combined schema with all possible fields  
const entityFormSchema = z.object({
  type: z.string().min(1, 'Tipo da entidade é obrigatório'),
  name: z.string().optional(), // Name will be auto-derived
  notes: z.string().optional(),
  
  // Public org fields
  official_name: z.string().optional(),
  acronym: z.string().optional(),
  governmental_sphere: z.enum(['municipal', 'estadual', 'federal', 'internacional']).optional(),
  organ_type: z.enum(['regulador', 'fiscalizador', 'policia', 'ministerio', 'prefeitura', 'outro']).optional(),
  activity_areas: z.string().optional(),
  cnpj: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  city_id: z.string().optional(),
  cep: z.string().optional(),
  website: z.string().optional(),
  regional_unit: z.string().optional(),
  relation_type: z.enum(['fiscalizacao', 'registro_certificacao', 'autorizacao', 'licenciamento', 'outros']).optional(),
  relation_detail: z.string().optional(),
  responsible_type: z.enum(['user', 'department']).optional(),
  responsible_user_id: z.string().optional(),
  responsible_department_id: z.string().optional(),
  status: z.enum(['regular', 'pendente', 'em_fiscalizacao', 'em_auditoria', 'outro']).optional(),
  
  // Association fields
  association_type: z.string().optional(),
  activity_area: z.string().optional(),
  company_relationship_types: z.string().optional(),
  participation_level: z.string().optional(),
  current_status: z.string().optional(),
  interaction_history: z.string().optional(),
  has_financial_contributions: z.boolean().optional(),
  contribution_amount: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) || val === '' || val === null ? undefined : num;
  }, z.number().optional()),
  contribution_frequency: z.string().optional(),
  affiliation_date: z.string().optional(),
  association_validity_date: z.string().optional(),
  
  // External partner fields
  partner_type: z.enum(['ong', 'universidade', 'instituto_pesquisa', 'camara_comercio', 'embaixada', 'midia', 'evento', 'incubadora', 'escola_tecnica', 'comunidade_oss', 'outro']).optional(),
  trade_name: z.string().optional(),
  interest_areas: z.array(z.string()).optional(),
  official_profiles: z.array(z.string()).optional(),
  relationship_nature: z.array(z.enum(['institucional', 'projeto', 'patrocinio_nao_comercial', 'doacao', 'voluntariado', 'divulgacao', 'mentoria', 'outro'])).optional(),
  relationship_nature_other: z.string().optional(),
  risk_level: z.enum(['baixo', 'medio', 'alto']).optional(),
  nda_mou_term: z.boolean().optional(),
  nda_mou_number: z.string().optional(),
  nda_mou_url: z.string().optional(),
  nda_mou_validity: z.string().optional(),
  conflict_of_interest: z.boolean().optional(),
  conflict_observation: z.string().optional(),
  lgpd_basis: z.enum(['consentimento', 'legitimo_interesse', 'cumprimento_obrigacao_legal', 'protecao_vida', 'exercicio_poder_publico', 'interesse_legitimo']).optional(),
  relationship_objective: z.string().optional(),
  kpis: z.string().optional(),
  counterparts: z.string().optional(),
  internal_areas: z.array(z.string()).optional(),
  relevance: z.enum(['estrategico', 'tatico', 'ocasional']).optional(),
  generic_email: z.string().optional(),
  phone: z.string().optional(),
  contact_form_url: z.string().optional(),
  media_kit_url: z.string().optional(),
  drive_link: z.string().optional(),
});

type EntityFormData = z.infer<typeof entityFormSchema>;

export default function ContactEntities() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<ContactEntity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<EmailTag[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(0);
  const [hasAssociationDetails, setHasAssociationDetails] = useState(false);

  const {
    entities,
    isLoading,
    createEntity,
    updateEntity,
    deleteEntity,
    isCreating,
    isUpdating
  } = useContactEntities();

  const publicOrgDetails = usePublicOrgDetails();
  const associationDetails = useAssociationDetails();
  const externalPartnerDetails = useExternalPartnerDetails();
  const { getByPartnerId, create: createProject, update: updateProject, deleteProject } = usePartnerProjects();
  const { departments } = useDepartments();
  const { profiles } = useProfiles();
  const { getTags, setTags, loading: tagsLoading } = useContactEntityTags();

  const {
    register,
    handleSubmit,
    formState,
    reset,
    setValue,
    watch,
    trigger
  } = useForm<EntityFormData>({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      type: 'orgaos_publicos_controle' as const,
      name: '',
      notes: '',
      official_name: '',
      governmental_sphere: 'federal' as const,
      organ_type: 'regulador' as const,
      relation_type: 'fiscalizacao' as const,
      status: 'regular' as const,
      responsible_type: 'user' as const
    }
  });

  // Check URL parameters for auto-opening modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modal') === 'create') {
      const entityType = urlParams.get('type');
      if (entityType) {
        setValue('type', entityType as any);
        setIsModalOpen(true);
      }
    }
  }, [setValue]);

  // Auto-derive name from specific entity fields (only when not editing)
  useEffect(() => {
    if (isEditing) return; // Don't auto-derive when editing existing entities
    
    const currentType = watch('type');
    const officialName = watch('official_name');
    const tradeName = watch('trade_name');
    
    if (currentType === 'parceiros_externos') {
      // For external partners, use official_name or trade_name
      const derivedName = officialName || tradeName || '';
      setValue('name', derivedName);
    } else if (currentType === 'orgaos_publicos_controle' || currentType === 'associacoes_sindicatos') {
      // For public orgs and associations, use official_name
      setValue('name', officialName || '');
    }
  }, [watch('type'), watch('official_name'), watch('trade_name'), setValue, isEditing]);

  const filteredEntities = useMemo(() => {
    if (!searchTerm) return entities;
    
    const term = searchTerm.toLowerCase();
    return entities.filter(entity => 
      entity.name.toLowerCase().includes(term) ||
      getEntityTypeLabel(entity.type).toLowerCase().includes(term)
    );
  }, [entities, searchTerm]);

  const handleOpenModal = async (entity?: ContactEntity) => {
    if (entity) {
      setIsEditing(true);
      setEditingEntity(entity);
      setValue('type', entity.type as any);
      setValue('name', entity.name);
      setValue('notes', entity.notes || '');
      
      // Load tags for the entity
      const entityTags = await getTags(entity.id);
      setSelectedTags(entityTags);
      
      // If it's a public org, load the details
      if (entity.type === 'orgaos_publicos_controle') {
        const details = await publicOrgDetails.getByEntityId(entity.id);
        if (details) {
          setValue('official_name', details.official_name);
          setValue('acronym', details.acronym || '');
          setValue('governmental_sphere', details.governmental_sphere || 'federal');
          setValue('organ_type', details.organ_type || 'regulador');
          setValue('activity_areas', details.activity_areas?.join(', ') || '');
          setValue('cnpj', details.cnpj || '');
          setValue('address_street', details.address_street || '');
          setValue('address_number', details.address_number || '');
          setValue('address_complement', details.address_complement || '');
          setValue('address_neighborhood', details.address_neighborhood || '');
          setValue('city_id', details.city_id || '');
          setValue('cep', details.cep || '');
          setValue('website', details.website || '');
          setValue('regional_unit', details.regional_unit || '');
          setValue('relation_type', details.relation_type || 'fiscalizacao');
          setValue('relation_detail', details.relation_detail || '');
          setValue('responsible_user_id', details.responsible_user_id || '');
          setValue('responsible_department_id', details.responsible_department_id || '');
          setValue('responsible_type', details.responsible_user_id ? 'user' : 'department');
          setValue('status', details.status || 'regular');
        } else {
          // Pre-fill with entity name for public orgs without details
          setValue('official_name', entity.name);
          setValue('governmental_sphere', 'federal');
          setValue('organ_type', 'regulador');
          setValue('relation_type', 'fiscalizacao');
          setValue('status', 'regular');
          setValue('responsible_type', 'user');
          toast.warning('Detalhes do órgão público não encontrados. Os campos foram preenchidos com dados básicos.');
        }
      } else if (entity.type === 'associacoes_sindicatos') {
        const details = await associationDetails.getByEntityId(entity.id);
        if (details) {
          setHasAssociationDetails(true);
          setValue('official_name', details.official_name);
          setValue('acronym', details.acronym || '');
          setValue('association_type', details.association_type || '');
          setValue('activity_area', details.activity_area || '');
          setValue('cnpj', details.cnpj || '');
          setValue('address_street', details.address_street || '');
          setValue('address_number', details.address_number || '');
          setValue('address_complement', details.address_complement || '');
          setValue('address_neighborhood', details.address_neighborhood || '');
          setValue('city_id', details.city_id || '');
          setValue('cep', details.cep || '');
          setValue('website', details.website || '');
          setValue('regional_unit', details.regional_unit || '');
          setValue('company_relationship_types', details.company_relationship_types?.join(', ') || '');
          setValue('participation_level', details.participation_level || '');
          setValue('responsible_user_id', details.responsible_user_id || '');
          setValue('responsible_department_id', details.responsible_department_id || '');
          setValue('responsible_type', details.responsible_user_id ? 'user' : 'department');
          setValue('current_status', details.current_status || '');
          setValue('interaction_history', details.interaction_history || '');
          setValue('has_financial_contributions', details.has_financial_contributions || false);
          setValue('contribution_amount', details.contribution_amount);
          setValue('contribution_frequency', details.contribution_frequency || '');
          setValue('affiliation_date', details.affiliation_date || '');
          setValue('association_validity_date', details.association_validity_date || '');
        } else {
          setHasAssociationDetails(false);
          // Don't pre-fill official_name for associations without details
          setValue('official_name', '');
          setValue('responsible_type', 'user');
          toast.warning('Detalhes da associação não encontrados. Os campos foram preenchidos com dados básicos.');
        }
      } else if (entity.type === 'parceiros_externos') {
        const details = await externalPartnerDetails.getByEntityId(entity.id);
        if (details) {
          setValue('official_name', details.official_name);
          setValue('trade_name', details.trade_name || '');
          setValue('cnpj', details.cnpj || '');
          setValue('partner_type', details.partner_type);
          setValue('interest_areas', details.interest_areas || []);
          setValue('website', details.website || '');
          setValue('official_profiles', details.official_profiles || []);
          setValue('relationship_nature', details.relationship_nature || []);
          setValue('relationship_nature_other', details.relationship_nature_other || '');
          setValue('risk_level', details.risk_level || 'baixo');
          setValue('nda_mou_term', details.nda_mou_term || false);
          setValue('nda_mou_number', details.nda_mou_number || '');
          setValue('nda_mou_url', details.nda_mou_url || '');
          setValue('nda_mou_validity', details.nda_mou_validity || '');
          setValue('conflict_of_interest', details.conflict_of_interest || false);
          setValue('conflict_observation', details.conflict_observation || '');
          setValue('lgpd_basis', details.lgpd_basis);
          setValue('relationship_objective', details.relationship_objective || '');
          setValue('kpis', details.kpis || '');
          setValue('counterparts', details.counterparts || '');
          setValue('responsible_user_id', details.responsible_user_id || '');
          setValue('responsible_department_id', details.responsible_department_id || '');
          setValue('internal_areas', details.internal_areas || []);
          setValue('relevance', details.relevance || 'tatico');
          setValue('city_id', details.city_id || '');
          setValue('address_street', details.address_street || '');
          setValue('address_number', details.address_number || '');
          setValue('address_complement', details.address_complement || '');
          setValue('address_neighborhood', details.address_neighborhood || '');
          setValue('cep', details.cep || '');
          setValue('generic_email', details.generic_email || '');
          setValue('phone', details.phone || '');
          setValue('contact_form_url', details.contact_form_url || '');
          setValue('media_kit_url', details.media_kit_url || '');
          setValue('drive_link', details.drive_link || '');
          // External partners have their own status field in details
        } else {
          // Pre-fill with entity name and default values including required fields
          setValue('official_name', entity.name);
          setValue('partner_type', 'outro');
          setValue('relationship_nature', ['institucional']); // Set default required value
          setValue('relevance', 'tatico');
          toast.warning('Detalhes do parceiro não encontrados. Os campos foram preenchidos com dados básicos.');
        }
      }
    } else {
      setEditingEntity(null);
      setSelectedTags([]);
      setHasAssociationDetails(false);
      reset();
    }
    setIsModalOpen(true);
  };

  // Helper function to check if association details are provided
  const isAssociationDetailsProvided = (data: EntityFormData): boolean => {
    return !!(
      data.official_name?.trim() ||
      data.acronym?.trim() ||
      data.association_type?.trim() ||
      data.activity_area?.trim() ||
      data.cnpj?.trim() ||
      data.address_street?.trim() ||
      data.address_number?.trim() ||
      data.address_complement?.trim() ||
      data.address_neighborhood?.trim() ||
      data.city_id?.trim() ||
      data.cep?.trim() ||
      data.website?.trim() ||
      data.regional_unit?.trim() ||
      data.company_relationship_types?.trim() ||
      data.participation_level?.trim() ||
      data.responsible_user_id?.trim() ||
      data.responsible_department_id?.trim() ||
      data.current_status?.trim() ||
      data.interaction_history?.trim() ||
      data.has_financial_contributions ||
      data.contribution_amount ||
      data.contribution_frequency?.trim() ||
      data.affiliation_date?.trim() ||
      data.association_validity_date?.trim()
    );
  };

  const handleCloseModal = () => {
    // Notify parent window if in iframe mode
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'close-modal'
      }, '*');
    }
    
    setIsModalOpen(false);
    setEditingEntity(null);
    setIsEditing(false);
    setSelectedTags([]);
    setHasAssociationDetails(false);
    reset();
  };

  const onInvalid = (errors: any) => {
    console.log('❌ Form validation failed:', errors);
    const firstError = Object.values(errors)[0] as any;
    const errorMessage = firstError?.message || 'Erro de validação';
    toast.error(`Erro de validação: ${errorMessage}`);
    
    // Auto-scroll to first invalid field
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (element as HTMLElement).focus();
    }
  };

  const onSubmit = async (data: EntityFormData) => {
    console.log('🚀 onSubmit called with data:', data);
    console.log('🔍 Current state - isSaving:', isSaving, 'isCreating:', isCreating, 'isUpdating:', isUpdating);
    
    // Prevent double submission
    if (isSaving || isCreating || isUpdating) {
      console.log('⚠️ Submission blocked - already in progress');
      return;
    }
    
    setIsSaving(true);
    console.log('✅ Starting save process for entity type:', data.type);
    
    try {
      // Validate specific requirements for external partners
      if (data.type === 'parceiros_externos') {
        if (!data.official_name?.trim()) {
          toast.error('Nome oficial é obrigatório para parceiros externos');
          return;
        }
        if (!data.partner_type) {
          toast.error('Tipo de parceiro é obrigatório');
          return;
        }
        if (!data.relationship_nature || data.relationship_nature.length === 0) {
          toast.error('Natureza do relacionamento é obrigatória');
          return;
        }
      }

      // Validate specific requirements for associations
      if (data.type === 'associacoes_sindicatos') {
        if (!data.official_name?.trim()) {
          console.log('❌ Validation failed: Nome oficial é obrigatório para associações');
          toast.error('Nome oficial é obrigatório para associações e sindicatos');
          return;
        }
      }

      let entityId: string;
      
      // Auto-derive name based on entity type, with fallback to existing name in edit mode
      let derivedName = data.name;
      if (!derivedName || derivedName.trim() === '') {
        if (editingEntity) {
          // In edit mode, use existing entity name as fallback
          derivedName = editingEntity.name;
        } else {
          // In create mode, derive from fields
          if (data.type === 'parceiros_externos') {
            derivedName = data.official_name || data.trade_name || 'Nome não informado';
          } else if (data.type === 'orgaos_publicos_controle' || data.type === 'associacoes_sindicatos') {
            derivedName = data.official_name || 'Nome não informado';
          } else {
            derivedName = 'Nome não informado';
          }
        }
      }
      
      // Create or update the main entity
      const entityData: CreateContactEntityData = {
        type: data.type,
        name: derivedName,
        notes: data.notes
      };
      
      if (editingEntity) {
        // Only update entity if main fields changed
        const hasEntityChanges = 
          editingEntity.type !== entityData.type ||
          editingEntity.name !== entityData.name ||
          editingEntity.notes !== entityData.notes;
          
        if (hasEntityChanges) {
          await updateEntity(editingEntity.id, entityData);
        }
        entityId = editingEntity.id;
      } else {
        const newEntity = await createEntity(entityData);
        entityId = newEntity.id;
      }
      
      // Save tags with improved error handling
      console.log('Debug: Starting tag save for entity:', entityId, 'Tags count:', selectedTags.length);
      try {
        const tagsSuccess = await setTags(entityId, selectedTags);
        if (!tagsSuccess && selectedTags.length > 0) {
          console.error('Tags save failed');
          toast.error('Erro ao salvar tags. Tente novamente.');
          return;
        }
        console.log('Tags saved successfully');
      } catch (tagError) {
        console.error('Error saving tags:', tagError);
        toast.error('Erro ao salvar tags. Tente novamente.');
        return;
      }
      
      // If it's a public org, save the details
      if (data.type === 'orgaos_publicos_controle') {
        const publicOrgData: Omit<PublicOrgDetails, 'id' | 'created_at' | 'updated_at'> = {
          contact_entity_id: entityId,
          official_name: data.official_name!,
          acronym: data.acronym,
          governmental_sphere: data.governmental_sphere,
          organ_type: data.organ_type,
          activity_areas: data.activity_areas ? data.activity_areas.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          cnpj: data.cnpj,
          address_street: data.address_street,
          address_number: data.address_number,
          address_complement: data.address_complement,
          address_neighborhood: data.address_neighborhood,
          city_id: data.city_id || undefined,
          cep: data.cep,
          website: data.website,
          regional_unit: data.regional_unit,
          relation_type: data.relation_type,
          relation_detail: data.relation_detail,
          responsible_user_id: data.responsible_type === 'user' ? (data.responsible_user_id || undefined) : undefined,
          responsible_department_id: data.responsible_type === 'department' ? (data.responsible_department_id || undefined) : undefined,
          status: data.status
        };
        
        try {
          await publicOrgDetails.upsert(publicOrgData);
        } catch (detailError) {
          console.error('Erro ao salvar detalhes do órgão público:', detailError);
          // If details save fails for a new entity, mark it as deleted
          if (!editingEntity) {
            await deleteEntity(entityId);
          }
          const errorMessage = getSupabaseErrorMessage(detailError);
          toast.error(errorMessage);
          return;
        }
      } else if (data.type === 'associacoes_sindicatos') {
        console.log('Debug: Processing association details', { 
          hasAssociationDetails, 
          isAssociationDetailsProvided: isAssociationDetailsProvided(data),
          entityType: data.type 
        });
        
        // Only upsert details if there are existing details OR new details are provided
        const shouldSaveDetails = hasAssociationDetails || isAssociationDetailsProvided(data);
        console.log('Debug: Should save association details:', shouldSaveDetails);
        
        if (shouldSaveDetails) {
          const associationData = {
            contact_entity_id: entityId,
            official_name: (data as any).official_name!,
            acronym: (data as any).acronym,
            association_type: (data as any).association_type,
            activity_area: (data as any).activity_area,
            cnpj: (data as any).cnpj,
            address_street: (data as any).address_street,
            address_number: (data as any).address_number,
            address_complement: (data as any).address_complement,
            address_neighborhood: (data as any).address_neighborhood,
            city_id: (data as any).city_id || undefined,
            cep: (data as any).cep,
            website: (data as any).website,
            regional_unit: (data as any).regional_unit,
            company_relationship_types: (data as any).company_relationship_types ? 
              (data as any).company_relationship_types.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
            participation_level: (data as any).participation_level,
            responsible_user_id: (data as any).responsible_type === 'user' ? ((data as any).responsible_user_id || undefined) : undefined,
            responsible_department_id: (data as any).responsible_type === 'department' ? ((data as any).responsible_department_id || undefined) : undefined,
            current_status: (data as any).current_status,
            interaction_history: (data as any).interaction_history,
            has_financial_contributions: (data as any).has_financial_contributions,
            contribution_amount: (data as any).contribution_amount,
            contribution_frequency: (data as any).contribution_frequency,
            // Sanitize dates - convert empty strings to undefined
            affiliation_date: (data as any).affiliation_date === '' ? undefined : (data as any).affiliation_date,
            association_validity_date: (data as any).association_validity_date === '' ? undefined : (data as any).association_validity_date,
          };
          
          try {
            await associationDetails.upsert(associationData);
          } catch (detailError) {
            console.error('Erro ao salvar detalhes da associação:', detailError);
            // If details save fails for a new entity, mark it as deleted
            if (!editingEntity) {
              await deleteEntity(entityId);
            }
            const errorMessage = getSupabaseErrorMessage(detailError);
            toast.error(errorMessage);
            return;
          }
        } else {
          console.log('Debug: Skipping association details upsert - no details provided');
        }
      } else if (data.type === 'parceiros_externos') {
        // Ensure relationship_nature has a default value
        let relationshipNature = (data as any).relationship_nature;
        if (!relationshipNature || relationshipNature.length === 0) {
          relationshipNature = ['institucional'];
          toast.error('Natureza do relacionamento é obrigatória e foi preenchida com valor padrão');
        }

        const partnerData = {
          contact_entity_id: entityId,
          official_name: (data as any).official_name!,
          trade_name: (data as any).trade_name,
          cnpj: (data as any).cnpj,
          partner_type: (data as any).partner_type!,
          interest_areas: (data as any).interest_areas || [],
          website: (data as any).website,
          official_profiles: (data as any).official_profiles || [],
          relationship_nature: relationshipNature,
          relationship_nature_other: (data as any).relationship_nature_other,
          risk_level: (data as any).risk_level || 'baixo',
          nda_mou_term: (data as any).nda_mou_term || false,
          // Sanitize NDA fields - convert empty strings to undefined for dates
          nda_mou_number: (data as any).nda_mou_term ? (data as any).nda_mou_number : undefined,
          nda_mou_url: (data as any).nda_mou_term ? (data as any).nda_mou_url : undefined,
          nda_mou_validity: (data as any).nda_mou_term ? 
            ((data as any).nda_mou_validity === '' ? undefined : (data as any).nda_mou_validity) : undefined,
          conflict_of_interest: (data as any).conflict_of_interest || false,
          conflict_observation: (data as any).conflict_observation,
          lgpd_basis: (data as any).lgpd_basis,
          relationship_objective: (data as any).relationship_objective,
          kpis: (data as any).kpis,
          counterparts: (data as any).counterparts,
          responsible_user_id: (data as any).responsible_user_id || undefined,
          responsible_department_id: (data as any).responsible_department_id || undefined,
          internal_areas: (data as any).internal_areas || [],
          relevance: (data as any).relevance || 'tatico',
          status: 'ativo' as 'ativo' | 'pausado' | 'encerrado' | 'avaliando',
          city_id: (data as any).city_id || undefined,
          address_street: (data as any).address_street,
          address_number: (data as any).address_number,
          address_complement: (data as any).address_complement,
          address_neighborhood: (data as any).address_neighborhood,
          cep: (data as any).cep,
          generic_email: (data as any).generic_email,
          phone: (data as any).phone,
          contact_form_url: (data as any).contact_form_url,
          media_kit_url: (data as any).media_kit_url,
          drive_link: (data as any).drive_link,
        };
        
        try {
          await externalPartnerDetails.upsert(partnerData);
        } catch (detailError) {
          console.error('Erro ao salvar detalhes do parceiro externo:', detailError);
          // If details save fails for a new entity, mark it as deleted
          if (!editingEntity) {
            await deleteEntity(entityId);
          }
          const errorMessage = getSupabaseErrorMessage(detailError);
          toast.error(errorMessage);
          return;
        }
      }
      
      console.log('✅ Entity save completed successfully');
      toast.success(editingEntity ? 'Entidade atualizada com sucesso!' : 'Entidade criada com sucesso!');
      
      // Force badge refresh after saving details
      setDetailsRefreshKey(prev => prev + 1);
      
      // Notify parent window if in iframe mode
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'entity-created',
          entityId: entityId
        }, '*');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('❌ Erro ao salvar entidade:', error);
      const errorMessage = getSupabaseErrorMessage(error);
      toast.error(`Erro ao salvar entidade: ${errorMessage}`);
    } finally {
      console.log('🏁 Setting isSaving to false');
      setIsSaving(false);
    }
  };

  const handleDelete = async (entity: ContactEntity) => {
    if (window.confirm(`Tem certeza que deseja excluir a entidade "${entity.name}"?`)) {
      try {
        await deleteEntity(entity.id);
      } catch (error) {
        console.error('Erro ao excluir entidade:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando entidades...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Entidades</h1>
            <p className="text-muted-foreground">
              Gerencie consultorias, parceiros, instituições e outras entidades
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Nova Entidade
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar entidades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm 
                        ? 'Nenhuma entidade encontrada com os critérios de busca.' 
                        : 'Nenhuma entidade cadastrada. Clique em "Criar Nova Entidade" para começar.'
                      }
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{entity.name}</span>
                        <EntityStatusBadge key={`${entity.id}-${detailsRefreshKey}`} entity={entity} />
                      </div>
                    </TableCell>
                    <TableCell>{getEntityTypeLabel(entity.type)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {entity.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(entity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entity)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <CustomFullscreenModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="bg-background"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-card">
            <div>
              <h1 className="text-2xl font-bold">
                {editingEntity ? "Editar Entidade" : "Criar Nova Entidade"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {editingEntity ? "Atualize as informações da entidade" : "Preencha os dados para criar uma nova entidade"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseModal}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <form id="contact-entity-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo da Entidade *</Label>
                <Select 
                  value={watch('type')} 
                  onValueChange={(value) => setValue('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo da entidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {entityTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.type && (
                  <p className="text-sm text-destructive">{formState.errors.type.message}</p>
                )}
              </div>


              {/* Conditional Public Org Fields */}
              {watch('type') === 'orgaos_publicos_controle' && (
                <>
                  {/* Identification Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Identificação</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="official_name">Nome Oficial do Órgão *</Label>
                      <Input
                        id="official_name"
                        {...register('official_name')}
                        placeholder="Ex: ANVISA, MAPA, Receita Federal"
                      />
                      {formState.errors.official_name && (
                        <p className="text-sm text-destructive">{formState.errors.official_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="acronym">Sigla (se existir)</Label>
                      <Input
                        id="acronym"
                        {...register('acronym')}
                        placeholder="Ex: ANVISA, MAPA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="governmental_sphere">Esfera Governamental *</Label>
                        <Select 
                          value={watch('governmental_sphere')} 
                          onValueChange={(value) => setValue('governmental_sphere', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="municipal">Municipal</SelectItem>
                            <SelectItem value="estadual">Estadual</SelectItem>
                            <SelectItem value="federal">Federal</SelectItem>
                            <SelectItem value="internacional">Internacional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organ_type">Tipo de Órgão *</Label>
                        <Select 
                          value={watch('organ_type')} 
                          onValueChange={(value) => setValue('organ_type', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regulador">Regulador</SelectItem>
                            <SelectItem value="fiscalizador">Fiscalizador</SelectItem>
                            <SelectItem value="policia">Polícia</SelectItem>
                            <SelectItem value="ministerio">Ministério</SelectItem>
                            <SelectItem value="prefeitura">Prefeitura</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity_areas">Área de Atuação</Label>
                      <Input
                        id="activity_areas"
                        {...register('activity_areas')}
                        placeholder="Ex: Saúde, Meio Ambiente, Tributação (separar por vírgula)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ / Identificação Fiscal (opcional)</Label>
                      <Input
                        id="cnpj"
                        {...register('cnpj')}
                        placeholder="Ex: 00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Endereço & Localização</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="address_street">Logradouro</Label>
                        <Input
                          id="address_street"
                          {...register('address_street')}
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_number">Número</Label>
                        <Input
                          id="address_number"
                          {...register('address_number')}
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address_complement">Complemento</Label>
                        <Input
                          id="address_complement"
                          {...register('address_complement')}
                          placeholder="Sala, Andar, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_neighborhood">Bairro</Label>
                        <Input
                          id="address_neighborhood"
                          {...register('address_neighborhood')}
                          placeholder="Nome do bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city_id">Cidade</Label>
                        <CitySelector
                          value={watch('city_id')}
                          onValueChange={(value) => setValue('city_id', value)}
                          placeholder="Selecione a cidade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          {...register('cep')}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website Oficial</Label>
                      <Input
                        id="website"
                        {...register('website')}
                        placeholder="https://exemplo.gov.br"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regional_unit">Unidade / Regional</Label>
                      <Input
                        id="regional_unit"
                        {...register('regional_unit')}
                        placeholder="Ex: MAPA - Superintendência Campinas/SP"
                      />
                    </div>
                  </div>

                  {/* Relationship Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Relacionamento</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="relation_type">Tipo de Relação com a Empresa *</Label>
                      <Select 
                        value={watch('relation_type')} 
                        onValueChange={(value) => setValue('relation_type', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiscalizacao">Fiscalização</SelectItem>
                          <SelectItem value="registro_certificacao">Registro/Certificação</SelectItem>
                          <SelectItem value="autorizacao">Autorização</SelectItem>
                          <SelectItem value="licenciamento">Licenciamento</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {watch('relation_type') === 'outros' && (
                      <div className="space-y-2">
                        <Label htmlFor="relation_detail">Detalhar Relação</Label>
                        <Input
                          id="relation_detail"
                          {...register('relation_detail')}
                          placeholder="Especifique o tipo de relação"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Responsável Interno</Label>
                      <RadioGroup 
                        value={watch('responsible_type')} 
                        onValueChange={(value) => setValue('responsible_type', value as any)}
                        className="flex flex-row space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="user" id="resp-user" />
                          <Label htmlFor="resp-user">Usuário</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="department" id="resp-dept" />
                          <Label htmlFor="resp-dept">Departamento</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {watch('responsible_type') === 'user' && (
                      <div className="space-y-2">
                        <Label htmlFor="responsible_user_id">Usuário Responsável</Label>
                        <Select 
                          value={watch('responsible_user_id')} 
                          onValueChange={(value) => setValue('responsible_user_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles?.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.name || profile.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {watch('responsible_type') === 'department' && (
                      <div className="space-y-2">
                        <Label htmlFor="responsible_department_id">Departamento Responsável</Label>
                        <Select 
                          value={watch('responsible_department_id')} 
                          onValueChange={(value) => setValue('responsible_department_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="status">Status Atual *</Label>
                      <Select 
                        value={watch('status')} 
                        onValueChange={(value) => setValue('status', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_fiscalizacao">Em Fiscalização</SelectItem>
                          <SelectItem value="em_auditoria">Em Auditoria</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Association/Syndicate Fields */}
              {watch('type') === 'associacoes_sindicatos' && (
                <>
                  {/* Identification Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Identificação</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="official_name">Nome Oficial da Entidade *</Label>
                      <Input
                        id="official_name"
                        {...register('official_name')}
                        placeholder="Ex.: ABIPLA, ABIQUIM, Sindicato da Indústria Química de SP"
                      />
                      {formState.errors.official_name && (
                        <p className="text-sm text-destructive">{formState.errors.official_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="acronym">Sigla (se existir)</Label>
                      <Input
                        id="acronym"
                        {...register('acronym')}
                        placeholder="Ex: ABIPLA, FIESP"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="association_type">Tipo</Label>
                        <Select 
                          value={watch('association_type') || ''} 
                          onValueChange={(value) => setValue('association_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="associacao">Associação</SelectItem>
                            <SelectItem value="sindicato">Sindicato</SelectItem>
                            <SelectItem value="federacao">Federação</SelectItem>
                            <SelectItem value="confederacao">Confederação</SelectItem>
                            <SelectItem value="camara_comercio">Câmara de Comércio</SelectItem>
                            <SelectItem value="ong">ONG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activity_area">Área de Atuação / Setor Representado</Label>
                        <Input
                          id="activity_area"
                          {...register('activity_area')}
                          placeholder="Ex.: Química, Alimentos, Logística, Trabalhista"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ (ou equivalente legal)</Label>
                      <Input
                        id="cnpj"
                        {...register('cnpj')}
                        placeholder="Ex: 00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Endereço & Localização</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="address_street">Logradouro</Label>
                        <Input
                          id="address_street"
                          {...register('address_street')}
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_number">Número</Label>
                        <Input
                          id="address_number"
                          {...register('address_number')}
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address_complement">Complemento</Label>
                        <Input
                          id="address_complement"
                          {...register('address_complement')}
                          placeholder="Sala, Andar, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_neighborhood">Bairro</Label>
                        <Input
                          id="address_neighborhood"
                          {...register('address_neighborhood')}
                          placeholder="Nome do bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city_id">Cidade</Label>
                        <CitySelector
                          value={watch('city_id')}
                          onValueChange={(value) => setValue('city_id', value)}
                          placeholder="Selecione a cidade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          {...register('cep')}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website Oficial</Label>
                      <Input
                        id="website"
                        {...register('website')}
                        placeholder="https://exemplo.org.br"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regional_unit">Regional / Seccional</Label>
                      <Input
                        id="regional_unit"
                        {...register('regional_unit')}
                        placeholder="Ex.: FIESP – Regional Campinas"
                      />
                    </div>
                  </div>

                  {/* Relationship Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Relacionamento</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company_relationship_types">Tipo de Vínculo com a Empresa</Label>
                      <Input
                        id="company_relationship_types"
                        {...register('company_relationship_types')}
                        placeholder="Ex.: Associado/Filiado, Parceiro Institucional, Participante em Comitês (separar por vírgula)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="participation_level">Nível de Participação</Label>
                      <Select 
                        value={watch('participation_level') || ''} 
                        onValueChange={(value) => setValue('participation_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membro_ativo">Membro ativo</SelectItem>
                          <SelectItem value="membro_passivo">Membro passivo</SelectItem>
                          <SelectItem value="sem_vinculo_formal">Sem vínculo formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Responsável Interno</Label>
                      <RadioGroup 
                        value={watch('responsible_type')} 
                        onValueChange={(value) => setValue('responsible_type', value as any)}
                        className="flex flex-row space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="user" id="resp-user-assoc" />
                          <Label htmlFor="resp-user-assoc">Usuário</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="department" id="resp-dept-assoc" />
                          <Label htmlFor="resp-dept-assoc">Departamento</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {watch('responsible_type') === 'user' && (
                      <div className="space-y-2">
                        <Label htmlFor="responsible_user_id">Usuário Responsável</Label>
                        <Select 
                          value={watch('responsible_user_id')} 
                          onValueChange={(value) => setValue('responsible_user_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles?.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.name || profile.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {watch('responsible_type') === 'department' && (
                      <div className="space-y-2">
                        <Label htmlFor="responsible_department_id">Departamento Responsável</Label>
                        <Select 
                          value={watch('responsible_department_id')} 
                          onValueChange={(value) => setValue('responsible_department_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="current_status">Status Atual</Label>
                      <Select 
                        value={watch('current_status') || ''} 
                        onValueChange={(value) => setValue('current_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adimplente">Adimplente</SelectItem>
                          <SelectItem value="inadimplente">Inadimplente</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interaction_history">Histórico de Interações</Label>
                      <Textarea
                        id="interaction_history"
                        {...register('interaction_history')}
                        placeholder="Assembleias, reuniões, participação em projetos, negociações coletivas, etc."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-lg font-semibold">Financeiro / Contribuições</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_financial_contributions"
                        checked={watch('has_financial_contributions') || false}
                        onCheckedChange={(checked) => {
                          setValue('has_financial_contributions', checked as boolean);
                          if (!checked) {
                            setValue('contribution_amount', undefined);
                            setValue('contribution_frequency', '');
                          }
                        }}
                      />
                      <Label htmlFor="has_financial_contributions">Possui contribuições financeiras</Label>
                    </div>

                    {watch('has_financial_contributions') && (
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="contribution_amount">Valor da Contribuição (R$)</Label>
                          <Input
                            id="contribution_amount"
                            type="number"
                            step="0.01"
                            {...register('contribution_amount', {
                              setValueAs: (value) => {
                                const num = parseFloat(value);
                                return isNaN(num) || value === '' ? undefined : num;
                              }
                            })}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contribution_frequency">Periodicidade</Label>
                          <Select 
                            value={watch('contribution_frequency') || ''} 
                            onValueChange={(value) => setValue('contribution_frequency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a periodicidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="trimestral">Trimestral</SelectItem>
                              <SelectItem value="semestral">Semestral</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="affiliation_date">Data de Filiação / Adesão</Label>
                        <Input
                          id="affiliation_date"
                          type="date"
                          {...register('affiliation_date')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="association_validity_date">Validade da Associação</Label>
                        <Input
                          id="association_validity_date"
                          type="date"
                          {...register('association_validity_date')}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Campos específicos para Parceiros Externos */}
              {watch('type') === 'parceiros_externos' && (
                <>
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Detalhes do Parceiro Externo</h3>
                    
                    {/* Identificação */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Identificação</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="official_name">Nome Oficial *</Label>
                          <Input
                            id="official_name"
                            {...register('official_name', { required: true })}
                            placeholder="Nome oficial da organização"
                          />
                          {formState.errors.official_name && (
                            <p className="text-sm text-destructive">Nome oficial é obrigatório</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="trade_name">Nome Fantasia</Label>
                          <Input
                            id="trade_name"
                            {...register('trade_name')}
                            placeholder="Nome fantasia ou marca"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                          <Input
                            id="cnpj"
                            {...register('cnpj')}
                            placeholder="00.000.000/0000-00"
                          />
                          <p className="text-xs text-muted-foreground">Para ONGs ou coletivos pode não existir</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="partner_type">Tipo de Parceiro *</Label>
                          <Select 
                            value={watch('partner_type') || ''} 
                            onValueChange={(value) => setValue('partner_type', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ong">ONG</SelectItem>
                              <SelectItem value="universidade">Universidade</SelectItem>
                              <SelectItem value="instituto_pesquisa">Instituto de Pesquisa</SelectItem>
                              <SelectItem value="camara_comercio">Câmara/Embaixada</SelectItem>
                              <SelectItem value="midia">Mídia/Imprensa</SelectItem>
                              <SelectItem value="evento">Comunidade/Evento</SelectItem>
                              <SelectItem value="incubadora">Incubadora/Aceleradora</SelectItem>
                              <SelectItem value="escola_tecnica">Escola Técnica</SelectItem>
                              <SelectItem value="comunidade_oss">Comunidade Open-Source</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            {...register('website')}
                            placeholder="https://exemplo.org"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="interest_areas">Áreas de Interesse</Label>
                          <Input
                            id="interest_areas"
                            placeholder="ESG, P&D, Comunidade, Educação..."
                            value={Array.isArray(watch('interest_areas')) ? watch('interest_areas')?.join(', ') : ''}
                            onChange={(e) => setValue('interest_areas', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          />
                          <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="official_profiles">Perfis Oficiais</Label>
                        <Textarea
                          id="official_profiles"
                          placeholder="LinkedIn, Instagram, Twitter, etc."
                          value={Array.isArray(watch('official_profiles')) ? watch('official_profiles')?.join('\n') : ''}
                          onChange={(e) => setValue('official_profiles', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                        />
                        <p className="text-xs text-muted-foreground">Um link por linha</p>
                      </div>
                    </div>

                    {/* Enquadramento & Compliance */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-md font-medium">Enquadramento & Compliance</h4>
                      
                      <div className="space-y-2">
                        <Label>Natureza do Relacionamento *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {[
                            { value: 'institucional', label: 'Institucional' },
                            { value: 'projeto', label: 'Co-criação de projeto' },
                            { value: 'patrocinio_nao_comercial', label: 'Patrocínio não comercial' },
                            { value: 'doacao', label: 'Doação' },
                            { value: 'voluntariado', label: 'Voluntariado' },
                            { value: 'divulgacao', label: 'Divulgação' },
                            { value: 'mentoria', label: 'Mentoria' },
                            { value: 'outro', label: 'Outro' }
                          ].map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`relationship_nature_${option.value}`}
                                checked={watch('relationship_nature')?.includes(option.value as any) || false}
                                onCheckedChange={(checked) => {
                                  const current = watch('relationship_nature') || [];
                                  if (checked) {
                                    setValue('relationship_nature', [...current, option.value as any]);
                                  } else {
                                    setValue('relationship_nature', current.filter((v: string) => v !== option.value));
                                  }
                                }}
                              />
                              <Label htmlFor={`relationship_nature_${option.value}`} className="text-sm font-normal">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {watch('relationship_nature')?.includes('outro' as any) && (
                        <div className="space-y-2">
                          <Label htmlFor="relationship_nature_other">Especificar Outro</Label>
                          <Input
                            id="relationship_nature_other"
                            {...register('relationship_nature_other')}
                            placeholder="Especifique a natureza do relacionamento"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="risk_level">Risco/Compliance</Label>
                          <Select 
                            value={watch('risk_level') || ''} 
                            onValueChange={(value) => setValue('risk_level', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o risco" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixo">Baixo</SelectItem>
                              <SelectItem value="medio">Médio</SelectItem>
                              <SelectItem value="alto">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lgpd_basis">Base Legal LGPD</Label>
                          <Select 
                            value={watch('lgpd_basis') || ''} 
                            onValueChange={(value) => setValue('lgpd_basis', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a base" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="consentimento">Consentimento</SelectItem>
                              <SelectItem value="legitimo_interesse">Legítimo Interesse</SelectItem>
                              <SelectItem value="cumprimento_obrigacao_legal">Cumprimento de Obrigação Legal</SelectItem>
                              <SelectItem value="protecao_vida">Proteção da Vida</SelectItem>
                              <SelectItem value="exercicio_poder_publico">Exercício do Poder Público</SelectItem>
                              <SelectItem value="interesse_legitimo">Interesse Legítimo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-6">
                          <Checkbox
                            id="nda_mou_term"
                            checked={watch('nda_mou_term') || false}
                            onCheckedChange={(checked) => setValue('nda_mou_term', checked as boolean)}
                          />
                          <Label htmlFor="nda_mou_term">NDA/MOU/Termo de Cooperação</Label>
                        </div>
                      </div>

                      {watch('nda_mou_term') && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nda_mou_number">Número do Documento</Label>
                            <Input
                              id="nda_mou_number"
                              {...register('nda_mou_number')}
                              placeholder="Ex: NDA-2024-001"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="nda_mou_url">URL do Documento</Label>
                            <Input
                              id="nda_mou_url"
                              {...register('nda_mou_url')}
                              placeholder="https://drive.google.com/..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="nda_mou_validity">Validade</Label>
                            <Input
                              id="nda_mou_validity"
                              type="date"
                              {...register('nda_mou_validity')}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="conflict_of_interest"
                          checked={watch('conflict_of_interest') || false}
                          onCheckedChange={(checked) => setValue('conflict_of_interest', checked as boolean)}
                        />
                        <Label htmlFor="conflict_of_interest">Conflito de Interesses declarado</Label>
                      </div>

                      {watch('conflict_of_interest') && (
                        <div className="space-y-2">
                          <Label htmlFor="conflict_observation">Observação sobre Conflito</Label>
                          <Textarea
                            id="conflict_observation"
                            {...register('conflict_observation')}
                            placeholder="Descreva o conflito de interesses..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Escopo & Interações */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-md font-medium">Escopo & Interações</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="relationship_objective">Objetivo do Relacionamento</Label>
                        <Textarea
                          id="relationship_objective"
                          {...register('relationship_objective')}
                          placeholder="Descreva o objetivo da parceria..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="kpis">KPIs do Relacionamento</Label>
                          <Textarea
                            id="kpis"
                            {...register('kpis')}
                            placeholder="Ex: alcance, nº de eventos, nº de alunos impactados..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="counterparts">Contrapartidas</Label>
                          <Textarea
                            id="counterparts"
                            {...register('counterparts')}
                            placeholder="Ex: uso de marca, cota de palestra, acesso a laboratório..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Relacionamento Interno */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-md font-medium">Relacionamento Interno</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="responsible_user_id">Responsável Interno</Label>
                          <Select 
                            value={watch('responsible_user_id') || ''} 
                            onValueChange={(value) => setValue('responsible_user_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles?.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="responsible_department_id">Departamento Responsável</Label>
                          <Select 
                            value={watch('responsible_department_id') || ''} 
                            onValueChange={(value) => setValue('responsible_department_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o departamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments?.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="internal_areas">Áreas Internas Envolvidas</Label>
                          <Input
                            id="internal_areas"
                            placeholder="ESG, P&D, Marketing, RH..."
                            value={Array.isArray(watch('internal_areas')) ? watch('internal_areas')?.join(', ') : ''}
                            onChange={(e) => setValue('internal_areas', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          />
                          <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="relevance">Prioridade/Relevância</Label>
                          <Select 
                            value={watch('relevance') || ''} 
                            onValueChange={(value) => setValue('relevance', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a relevância" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="estrategico">Estratégico</SelectItem>
                              <SelectItem value="tatico">Tático</SelectItem>
                              <SelectItem value="ocasional">Ocasional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="partner_status">Status</Label>
                          <Select 
                            value={watch('status') || ''} 
                            onValueChange={(value) => setValue('status', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="pausado">Pausado</SelectItem>
                              <SelectItem value="encerrado">Encerrado</SelectItem>
                              <SelectItem value="avaliando">Avaliando</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Endereço & Canais */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-md font-medium">Endereço & Canais</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <CitySelector
                            value={watch('city_id') || ''}
                            onValueChange={(value) => setValue('city_id', value)}
                            placeholder="Selecione a cidade"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP</Label>
                          <Input
                            id="cep"
                            {...register('cep')}
                            placeholder="00000-000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address_street">Logradouro</Label>
                        <Input
                          id="address_street"
                          {...register('address_street')}
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address_number">Número</Label>
                          <Input
                            id="address_number"
                            {...register('address_number')}
                            placeholder="123"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address_complement">Complemento</Label>
                          <Input
                            id="address_complement"
                            {...register('address_complement')}
                            placeholder="Sala, Andar, etc."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address_neighborhood">Bairro</Label>
                          <Input
                            id="address_neighborhood"
                            {...register('address_neighborhood')}
                            placeholder="Nome do bairro"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="generic_email">E-mail Genérico</Label>
                          <Input
                            id="generic_email"
                            {...register('generic_email')}
                            placeholder="contato@parceiro.org"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            {...register('phone')}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact_form_url">Formulário de Contato</Label>
                          <Input
                            id="contact_form_url"
                            {...register('contact_form_url')}
                            placeholder="https://parceiro.org/contato"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="media_kit_url">Media Kit/Linktree</Label>
                          <Input
                            id="media_kit_url"
                            {...register('media_kit_url')}
                            placeholder="https://linktr.ee/parceiro"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documentos & Evidências */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-md font-medium">Documentos & Evidências</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="drive_link">Link para Drive</Label>
                        <Input
                          id="drive_link"
                          {...register('drive_link')}
                          placeholder="https://drive.google.com/..."
                        />
                        <p className="text-xs text-muted-foreground">Link para pasta com documentos, MOUs, termos, fotos, etc.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Common sections for all entity types - moved to end */}
              <div className="space-y-4 border-t pt-4">
                {/* Tags Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Tags</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTagsManagerOpen(true)}
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <TagInput
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    placeholder="Digite uma tag e pressione Enter"
                  />
                </div>

                {/* Observações Section */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Observações adicionais (opcional)"
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-6 border-t bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSaving || isCreating || isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                console.log('🔥 Save button clicked');
                const isValid = await trigger();
                console.log('🔍 Form validation result:', isValid);
                
                if (!isValid) {
                  const errors = formState.errors;
                  console.log('❌ Validation errors:', errors);
                  onInvalid(errors);
                  return;
                }
                
                console.log('✅ Form is valid, calling onSubmit');
                handleSubmit(onSubmit, onInvalid)();
              }}
              type="button" 
              disabled={isSaving || isCreating || isUpdating}
              data-testid="save-entity-button"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </CustomFullscreenModal>

      {/* Tags Manager Modal */}
      <TagsManager
        isOpen={isTagsManagerOpen}
        onClose={() => setIsTagsManagerOpen(false)}
      />
    </div>
  );
}