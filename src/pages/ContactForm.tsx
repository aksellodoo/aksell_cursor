import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatGreeting } from '@/utils/contactUtils';
import { useContacts, useContact, useContactLinks, type CreateContactData, type UpdateContactData, type Contact } from '@/hooks/useContacts';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { ContactLinkModal } from '@/components/contacts/ContactLinkModal';
import { CitySelector } from '@/components/CitySelector';
import { useEnrichedContactLinks } from '@/hooks/useEnrichedContactLinks';
import { useFriendsFamilyLinks, CreateFriendFamilyLinkData } from '@/hooks/useFriendsFamilyLinks';
import { useEmployees } from '@/hooks/useEmployees';
import { useEffect, useState } from 'react';
import { Plus, X, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';
import { Alert, AlertDescription } from '@/components/ui/alert';

const contactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  treatment_type: z.enum(['sr', 'sra', 'direct', 'custom']).default('direct'),
  custom_treatment: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  email_primary: z.string().email('E-mail inválido').optional().or(z.literal('')),
  mobile_phone: z.string().optional(),
  landline_phone: z.string().optional(),
  messaging_phone: z.string().optional(),
  messaging_whatsapp: z.boolean().default(false),
  messaging_telegram: z.boolean().default(false),
  linkedin_url: z.string().url('URL inválida').optional().or(z.literal('')),
  decision_level: z.enum(['estrategico', 'tatico', 'operacional']).optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  cep: z.string().optional(),
  city_id: z.string().optional(),
  responsible_user_id: z.string().optional(),
  responsible_department_id: z.string().optional(),
}).refine((data) => {
  // Se treatment_type é 'custom', custom_treatment é obrigatório
  if (data.treatment_type === 'custom') {
    return data.custom_treatment && data.custom_treatment.trim() !== '';
  }
  return true;
}, {
  message: 'Tratamento personalizado é obrigatório quando tipo de tratamento é "Personalizado"',
  path: ['custom_treatment'],
}).refine((data) => {
  // Pelo menos um campo de contato deve estar preenchido: email, celular ou telefone fixo
  const hasEmail = data.email_primary && data.email_primary.trim() !== '';
  const hasMobile = data.mobile_phone && data.mobile_phone.trim() !== '';
  const hasLandline = data.landline_phone && data.landline_phone.trim() !== '';
  
  return hasEmail || hasMobile || hasLandline;
}, {
  message: 'É obrigatório preencher pelo menos um: E-mail, Telefone Celular ou Telefone Fixo',
  path: ['email_primary'],
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { createContact, updateContact, isCreating, isUpdating } = useContacts();
  const { data: contact, isLoading: isLoadingContact } = useContact(id);
  const { data: existingLinks } = useContactLinks(id);
  const { profiles } = useProfiles();
  const { departments } = useDepartments();
  const { links: friendsFamilyLinks, createLink: createFriendsFamily, deleteLink: deleteFriendsFamily } = useFriendsFamilyLinks(id);
  const { employees } = useEmployees();

  const [contactLinks, setContactLinks] = useState<Array<{ link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade'; target_id: string; target_kind?: string }>>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [nameWarning, setNameWarning] = useState<{ exists: boolean; contacts?: Contact[] }>({ exists: false });
  const [emailError, setEmailError] = useState<{ exists: boolean; contact?: Contact }>({ exists: false });

  const { enrichedLinks, loading: loadingEnrichedLinks } = useEnrichedContactLinks(contactLinks);
  const { toast } = useToast();

  // Handle cancel navigation - check if returning from ContactsPickerModal context
  const handleCancel = () => {
    try {
      const savedState = sessionStorage.getItem('formExternalContactsPickerState');
      if (savedState) {
        const { returnToFormConfig } = JSON.parse(savedState);
        if (returnToFormConfig) {
          sessionStorage.removeItem('formExternalContactsPickerState');
          navigate(-1); // Go back to previous page (ContactsPickerModal)
          return;
        }
      }
    } catch (error) {
      console.error('Error parsing sessionStorage state:', error);
    }
    // Default behavior: navigate to contacts list
    navigate('/gestao/contatos');
  };

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      treatment_type: 'direct',
      custom_treatment: '',
      job_title: '',
      department: '',
      email_primary: '',
      mobile_phone: '',
      landline_phone: '',
      messaging_phone: '',
      messaging_whatsapp: false,
      messaging_telegram: false,
      linkedin_url: '',
      decision_level: undefined,
      address_street: '',
      address_number: '',
      address_complement: '',
      address_neighborhood: '',
      cep: '',
      city_id: '',
      responsible_user_id: '',
      responsible_department_id: '',
    },
  });

  const treatmentType = form.watch('treatment_type');
  const name = form.watch('name');
  const customTreatment = form.watch('custom_treatment');

  // Watch form values for real-time validation
  const watchedName = form.watch('name');
  const watchedEmail = form.watch('email_primary');
  
  // Debounce the watched values
  const debouncedName = useDebounce(watchedName, 500);
  const debouncedEmail = useDebounce(watchedEmail, 500);

  // Generate greeting preview
  const generateGreetingPreview = () => {
    if (!name) return '';
    
    const mockContact = {
      name,
      treatment_type: treatmentType,
      custom_treatment: customTreatment
    };
    return formatGreeting(mockContact as any);
  };

  // Populate form with contact data when editing
  useEffect(() => {
    if (contact && isEditing) {
      const formData = {
        name: contact.name || '',
        treatment_type: contact.treatment_type || 'direct' as const,
        custom_treatment: contact.custom_treatment || '',
        job_title: contact.job_title || '',
        department: contact.department || '',
        email_primary: contact.email_primary || '',
        mobile_phone: contact.mobile_phone || '',
        landline_phone: contact.landline_phone || '',
        messaging_phone: contact.mobile_phone || '',
        messaging_whatsapp: contact.messaging_whatsapp || false,
        messaging_telegram: contact.messaging_telegram || false,
        linkedin_url: contact.linkedin_url || '',
        decision_level: contact.decision_level,
        address_street: contact.address_street || '',
        address_number: contact.address_number || '',
        address_complement: contact.address_complement || '',
        address_neighborhood: contact.address_neighborhood || '',
        cep: contact.cep || '',
        city_id: contact.city_id || '',
        responsible_user_id: contact.responsible_user_id || '',
        responsible_department_id: contact.responsible_department_id || '',
      };
      
      form.reset(formData);
    }
  }, [contact, isEditing, form]);

  // Load existing links when editing
  useEffect(() => {
    if (existingLinks && isEditing) {
      setContactLinks(existingLinks.map(link => ({
        link_type: link.link_type,
        target_id: link.target_id,
        target_kind: link.target_kind || 'unified_customer',
      })));
    }
  }, [existingLinks, isEditing]);

  // Real-time name duplicate check
  useEffect(() => {
    const checkNameDuplicates = async () => {
      if (!debouncedName || debouncedName.trim().length < 2) {
        setNameWarning({ exists: false });
        return;
      }

      try {
        const { data: existingContacts, error } = await supabase
          .from('contacts')
          .select('id, name, email_primary')
          .ilike('name', `%${debouncedName.trim()}%`)
          .neq('id', id || ''); // Exclude current contact when editing

        if (error) throw error;

        if (existingContacts && existingContacts.length > 0) {
          setNameWarning({ exists: true, contacts: existingContacts as Contact[] });
        } else {
          setNameWarning({ exists: false });
        }
      } catch (error) {
        console.error('Error checking name duplicates:', error);
      }
    };

    checkNameDuplicates();
  }, [debouncedName, id]);

  // Real-time email duplicate check
  useEffect(() => {
    const checkEmailDuplicates = async () => {
      if (!debouncedEmail || debouncedEmail.trim().length === 0) {
        setEmailError({ exists: false });
        return;
      }

      try {
        const { data: existingContacts, error } = await supabase
          .from('contacts')
          .select('id, name, email_primary')
          .eq('email_primary', debouncedEmail.trim())
          .neq('id', id || ''); // Exclude current contact when editing

        if (error) throw error;

        if (existingContacts && existingContacts.length > 0) {
          setEmailError({ exists: true, contact: existingContacts[0] as Contact });
        } else {
          setEmailError({ exists: false });
        }
      } catch (error) {
        console.error('Error checking email duplicates:', error);
      }
    };

    checkEmailDuplicates();
  }, [debouncedEmail, id]);

  const onSubmit = async (data: ContactFormData) => {
    console.log('🔥 onSubmit called');
    
    // Validate that at least one link exists
    if (contactLinks.length === 0) {
      toast({
        title: "Vínculos obrigatórios",
        description: "É obrigatório adicionar pelo menos um vínculo para salvar o contato.",
        variant: "destructive"
      });
      setActiveTab('vinculos');
      return;
    }

    // Check for email duplicates
    if (emailError.exists) {
      toast({
        title: "E-mail já cadastrado",
        description: `Este e-mail já está cadastrado para: ${emailError.contact?.name}`,
        variant: "destructive"
      });
      setActiveTab('dados');
      return;
    }

    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }

    // Normalize form data - convert empty strings to null for UUID fields
    const normalizedData = {
      ...data,
      city_id: data.city_id || null,
      responsible_department_id: data.responsible_department_id || null,
      responsible_user_id: data.responsible_user_id || null,
      email_primary: data.email_primary === '' ? undefined : data.email_primary,
      linkedin_url: data.linkedin_url === '' ? undefined : data.linkedin_url,
      custom_treatment: data.treatment_type === 'custom' ? data.custom_treatment : undefined,
      messaging_phone: data.mobile_phone, // Use mobile_phone for messaging
      links: contactLinks,
      created_by: user.id, // Add this for RLS policy
    };

    if (isEditing && id) {
      updateContact(
        { id, data: normalizedData as UpdateContactData },
        {
          onSuccess: () => {
            navigate('/gestao/contatos');
          },
        }
      );
    } else {
      createContact(normalizedData as CreateContactData, {
        onSuccess: () => {
          navigate('/gestao/contatos');
        },
      });
    }
  };

  const onInvalid = (errors: any) => {
    console.log('🔥 Form validation errors:', errors);
    
    // Switch to dados tab if there are validation errors
    setActiveTab('dados');
    
    // Find the first error and show a toast
    const firstErrorKey = Object.keys(errors)[0];
    const firstError = errors[firstErrorKey];
    
    if (firstError?.message) {
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive"
      });
    }
    
    // Scroll to first error field
    setTimeout(() => {
      const firstErrorElement = document.querySelector('[data-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleAddLink = (links: { link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade'; target_id: string; target_kind?: string }[]) => {
    setContactLinks(prev => [...prev, ...links.map(link => ({ ...link, target_kind: link.target_kind || 'unified_customer' }))]);
  };

  const handleRemoveLink = (index: number) => {
    setContactLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateFriendsFamily = async (data: CreateFriendFamilyLinkData) => {
    if (!id) return;
    await createFriendsFamily(id, data);
  };

  const getLinkTypeLabel = (type: string, targetKind?: string) => {
    const labels = {
      cliente: 'Cliente',
      fornecedor: 'Fornecedor',
      representante: 'Representante Comercial',
      entidade: 'Entidade',
    };
    
    // Special case for transportadoras
    if (type === 'entidade' && targetKind === 'carrier') {
      return 'Transportadora';
    }
    
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoadingContact && isEditing) {
    return (
      <CustomFullscreenModal isOpen={true} onClose={handleCancel}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </CustomFullscreenModal>
    );
  }

  return (
    <CustomFullscreenModal isOpen={true} onClose={handleCancel}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{isEditing ? 'Editar Contato' : 'Novo Contato'}</h2>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dados" className="flex items-center gap-2">
                      Dados
                      {(form.formState.errors.name || form.formState.errors.email_primary || form.formState.errors.mobile_phone || form.formState.errors.landline_phone || form.formState.errors.custom_treatment || emailError.exists) && (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="portal" className="flex items-center gap-2">
                      Portal e Comunicação
                    </TabsTrigger>
                    <TabsTrigger value="vinculos" className="flex items-center gap-2">
                      Vínculos
                      <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] rounded-full text-xs">
                        {contactLinks.length}
                      </Badge>
                      {contactLinks.length === 0 && (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dados" className="space-y-4 mt-6">

                {/* Tipo de Tratamento */}
                <FormField
                  control={form.control}
                  name="treatment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Tratamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de tratamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sr">Sr.</SelectItem>
                          <SelectItem value="sra">Sra.</SelectItem>
                          <SelectItem value="direct">Nome direto</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tratamento Personalizado */}
                {treatmentType === 'custom' && (
                  <FormField
                    control={form.control}
                    name="custom_treatment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tratamento Personalizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dr., Dra., Prof." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Nome */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome completo" 
                          {...field} 
                          data-invalid={!!form.formState.errors.name}
                          onBlur={async (e) => {
                            field.onBlur();
                            const nameValue = e.target.value.trim();
                            
                            if (nameValue.length >= 2) {
                              try {
                                const { data: existingContacts, error } = await supabase
                                  .from('contacts')
                                  .select('id, name, email_primary')
                                  .ilike('name', `%${nameValue}%`)
                                  .neq('id', id || ''); // Exclude current contact when editing

                                if (error) throw error;

                                if (existingContacts && existingContacts.length > 0) {
                                  // Prioritize exact matches
                                  const exactMatches = existingContacts.filter(c => 
                                    c.name.toLowerCase() === nameValue.toLowerCase()
                                  );
                                  const contactsToShow = exactMatches.length > 0 ? exactMatches : existingContacts;
                                  
                                  setNameWarning({ 
                                    exists: true, 
                                    contacts: contactsToShow.slice(0, 5) as Contact[] 
                                  });
                                } else {
                                  setNameWarning({ exists: false });
                                }
                              } catch (error) {
                                console.error('Error checking name duplicates:', error);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {nameWarning.exists && nameWarning.contacts && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div aria-live="polite">
                              <strong>Atenção:</strong> Já existem contatos com nomes similares:
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                {nameWarning.contacts.map((contact) => (
                                  <li key={contact.id} className="text-sm">
                                    <strong>{contact.name}</strong>
                                    {contact.email_primary && ` - ${contact.email_primary}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />

                {/* Preview da Saudação */}
                {name && (
                  <div className="bg-muted p-4 rounded-lg">
                    <FormLabel className="text-sm font-medium text-muted-foreground">Preview da Saudação</FormLabel>
                    <p className="mt-1 text-foreground font-medium">{generateGreetingPreview()}</p>
                  </div>
                )}

                {/* Cargo/Função */}
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Função</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Digite o cargo / função" {...field} className="flex-1" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue('job_title', 'Não declarado')}
                        >
                          Não declarado
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Departamento/Setor */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento / Setor</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Digite o departamento / setor" {...field} className="flex-1" />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue('department', 'Não declarado')}
                        >
                          Não declarado
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* E-mail primário */}
                <FormField
                  control={form.control}
                  name="email_primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Digite o e-mail" 
                          {...field} 
                          data-invalid={!!form.formState.errors.email_primary || emailError.exists}
                        />
                      </FormControl>
                      <FormMessage />
                      {emailError.exists && emailError.contact && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Este e-mail já está cadastrado para: <strong>{emailError.contact.name}</strong>
                          </AlertDescription>
                        </Alert>
                      )}
                    </FormItem>
                  )}
                />

                {/* Telefone Celular */}
                <FormField
                  control={form.control}
                  name="mobile_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Celular</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o telefone celular" 
                          {...field} 
                          data-invalid={!!form.formState.errors.mobile_phone}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* Telefone Fixo */}
                <FormField
                  control={form.control}
                  name="landline_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Fixo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o telefone fixo" 
                          {...field} 
                          data-invalid={!!form.formState.errors.landline_phone}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LinkedIn */}
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a URL do LinkedIn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nível de Decisão */}
                <FormField
                  control={form.control}
                  name="decision_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Decisão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível de decisão" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="estrategico">Estratégico</SelectItem>
                          <SelectItem value="tatico">Tático</SelectItem>
                          <SelectItem value="operacional">Operacional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Endereço</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="address_street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Rua</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite a rua" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="Nº" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address_complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Apto, Sala, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address_neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Cidade */}
                  <FormField
                    control={form.control}
                    name="city_id"
                    render={({ field }) => (
                      <FormItem>
                        <CitySelector
                          value={field.value}
                          onValueChange={field.onChange}
                          label="Cidade - UF - País"
                          placeholder="Selecione uma cidade..."
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Responsável */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsible_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o usuário responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {profiles?.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsible_department_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento Responsável</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o departamento responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments?.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 </div>
                  </TabsContent>

                  <TabsContent value="portal" className="space-y-4 mt-6">
                    {/* Comunicação via WhatsApp/Telegram */}
                    <div className="space-y-3">
                      <FormLabel>Comunicação via WhatsApp/Telegram</FormLabel>
                      <div className="flex items-center space-x-6">
                        <FormField
                          control={form.control}
                          name="messaging_whatsapp"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  WhatsApp (usa o número do celular)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="messaging_telegram"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal">
                                  Telegram (usa o número do celular)
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="vinculos" className="space-y-4 mt-6">
                {/* Vínculos Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Vínculos</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Vincular Contato
                    </Button>
                  </div>
                  
                  {contactLinks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      <p>Nenhum vínculo adicionado.</p>
                      <p className="text-sm">É obrigatório adicionar pelo menos um vínculo para salvar o contato.</p>
                    </div>
                   ) : (
                     <div className="space-y-2">
                       {enrichedLinks.map((link, index) => (
                         <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <Badge variant={
                                   link.link_type === 'cliente' ? 'customer' :
                                   link.link_type === 'fornecedor' ? 'supplier' :
                                   link.link_type === 'representante' ? 'secondary' :
                                   'secondary'
                                 }>
                                   {getLinkTypeLabel(link.link_type, link.target_kind)}
                                 </Badge>
                                 
                                 {link.link_type === 'representante' && link.meta ? (
                                   <Badge variant={
                                     link.meta.is_sales && link.meta.is_purchases ? 'secondary' :
                                     link.meta.is_sales ? 'customer' :
                                     link.meta.is_purchases ? 'supplier' :
                                     'outline'
                                   }>
                                     {link.meta.is_sales && link.meta.is_purchases ? 'Vendas + Compras' :
                                      link.meta.is_sales ? 'Vendas' :
                                      link.meta.is_purchases ? 'Compras' :
                                      'Não definido'}
                                   </Badge>
                                  ) : (
                                     <Badge variant={
                                       (link.target_kind === 'economic_group_sales' || link.target_kind === 'economic_group_purchases') ? 'group' :
                                       link.target_kind === 'public_org' ? 'secondary' :
                                       link.target_kind === 'external_partner' ? 'secondary' :
                                       link.link_type === 'cliente' ? 'unitCustomer' :
                                       link.link_type === 'fornecedor' ? 'unitSupplier' :
                                       'outline'
                                      }>
                                        {(link.target_kind === 'economic_group_sales' || link.target_kind === 'economic_group_purchases') ? 'Matriz' : 
                                         link.target_kind === 'public_org' ? 'Órgãos Públicos' :
                                         link.target_kind === 'association_union' ? 'Associações e Sindicatos' :
                                         link.target_kind === 'external_partner' ? 'Parceiros Externos' : 'Unidade'}
                                      </Badge>
                                  )}
                               </div>
                               <div className="mt-1">
                                  <div className="font-medium text-foreground">
                                    {link.display_name && link.display_name !== link.target_id ? link.display_name : 
                                     link.link_type === 'representante' ? 'Representante Comercial' :
                                     link.link_type === 'cliente' ? 'Cliente' :
                                     link.link_type === 'fornecedor' ? 'Fornecedor' :
                                      link.link_type === 'entidade' && link.target_kind === 'carrier' ? 'Transportadora' :
                                      link.link_type === 'entidade' && link.target_kind === 'public_org' ? 'Órgão Público' :
                                      'Entidade'
                                    }
                                 </div>
                                 {link.secondary_name && (
                                   <div className="text-sm text-muted-foreground">{link.secondary_name}</div>
                                 )}
                                 {link.city_info && (link.target_kind !== 'economic_group_sales' && link.target_kind !== 'economic_group_purchases') && (
                                   <div className="text-xs text-muted-foreground mt-1">
                                     📍 {link.city_info.name} - {link.city_info.uf}
                                     {link.city_info.country && link.city_info.country !== 'Brasil' && ` - ${link.city_info.country}`}
                                     {link.city_info.distance_km_to_indaiatuba && (
                                       <> • {Math.round(link.city_info.distance_km_to_indaiatuba)} km até Indaiatuba</>
                                     )}
                                     {link.city_info.average_truck_travel_time_hours && (
                                       <> • {link.city_info.average_truck_travel_time_hours.toFixed(1)}h média até Indaiatuba</>
                                     )}
                                   </div>
                                 )}
                               </div>
                            </div>
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={() => handleRemoveLink(index)}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>

                {/* Amigos e Familiares Section */}
                {friendsFamilyLinks && friendsFamilyLinks.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">Amigos e Familiares</h3>
                    </div>
                    <div className="grid gap-4">
                      {friendsFamilyLinks.map((link) => (
                        <div key={link.id} className="flex items-start justify-between p-4 border rounded-lg bg-card">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                {link.relationship === 'conjuge' ? 'Cônjuge' :
                                 link.relationship === 'filho_filha' ? 'Filho(a)' :
                                 link.relationship === 'pai_mae' ? 'Pai/Mãe' :
                                 link.relationship === 'amigo' ? 'Amigo' :
                                 link.relationship === 'companheiro' ? 'Companheiro(a)' :
                                 link.relationship === 'outro' ? link.relationship_other || 'Outro' :
                                 'Não especificado'}
                              </Badge>
                              {link.is_minor && <Badge variant="outline">Menor de idade</Badge>}
                              {link.has_consent && <Badge variant="outline">Consentimento</Badge>}
                              {link.dnc_list && <Badge variant="destructive">DNC</Badge>}
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Base legal:</span>{' '}
                                {link.legal_basis === 'consentimento' ? 'Consentimento' :
                                 link.legal_basis === 'legitimo_interesse' ? 'Legítimo Interesse' :
                                 link.legal_basis === 'obrigacao_legal' ? 'Obrigação Legal' :
                                 'Não especificado'}
                              </div>
                              
                              {link.usage_types && link.usage_types.length > 0 && (
                                <div>
                                  <span className="font-medium">Tipos de uso:</span>{' '}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {link.usage_types.map((type, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {type === 'emergencia' ? 'Emergência' :
                                         type === 'convites_eventos' ? 'Convites & Eventos' :
                                         type === 'beneficios' ? 'Benefícios' :
                                         type === 'comunicacao_institucional' ? 'Comunicação Institucional' :
                                         type === 'outro' ? link.usage_other || 'Outro' :
                                         type}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {link.contact_friend_family_link_employees && link.contact_friend_family_link_employees.length > 0 && (
                                <div>
                                  <span className="font-medium">Funcionários relacionados:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {link.contact_friend_family_link_employees.map((empLink) => {
                                      const employee = employees?.find(emp => emp.id === empLink.employee_id);
                                      return (
                                        <Badge key={empLink.employee_id} variant="outline" className="text-xs">
                                          {employee?.full_name || 'Funcionário não encontrado'}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {link.is_minor && link.legal_guardian_name && (
                                <div>
                                  <span className="font-medium">Responsável legal:</span>{' '}
                                  {link.legal_guardian_name}
                                  {link.legal_guardian_contact && ` - ${link.legal_guardian_contact}`}
                                </div>
                              )}
                              
                              {link.contact_restrictions && (
                                <div>
                                  <span className="font-medium">Restrições:</span>{' '}
                                  {link.contact_restrictions}
                                </div>
                              )}
                              
                              {link.conflict_notes && (
                                <div>
                                  <span className="font-medium">Conflito de interesse:</span>{' '}
                                  {link.conflict_notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFriendsFamily(link.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </TabsContent>
                </Tabs>

                <div className="mt-8 space-y-4">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancel}
                      disabled={isCreating || isUpdating}
                    >
                      Cancelar
                    </Button>
                     <Button 
                       type="submit" 
                       className="flex-1" 
                       disabled={isCreating || isUpdating || contactLinks.length === 0 || emailError.exists}
                     >
                      {(isCreating || isUpdating) && <LoadingSpinner className="mr-2 h-4 w-4" />}
                      {isEditing ? 'Atualizar Contato' : 'Salvar Contato'}
                    </Button>
                  </div>
                  {contactLinks.length === 0 && (
                    <p className="text-sm text-destructive text-center mt-2">
                      Adicione pelo menos um vínculo para salvar o contato
                    </p>
                  )}
                </div>
              </div>
            </form>
          </Form>

          <ContactLinkModal
            open={showLinkModal}
            onOpenChange={setShowLinkModal}
            onSave={handleAddLink}
            onFriendsFamilyConfirm={handleCreateFriendsFamily}
          />
        </div>
      </div>
    </CustomFullscreenModal>
  );
}