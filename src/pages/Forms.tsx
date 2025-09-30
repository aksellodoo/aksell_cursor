import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Share2, MoreHorizontal, Copy, Edit, Trash2, Eye, Search, Users, Eye as EyeIcon, Archive, Link, List, Clipboard, Settings, Send, History, MessageCircle, BarChart3, Filter, ArrowLeft } from 'lucide-react';
import { useForms } from '@/hooks/useForms';
import { useDepartments } from '@/hooks/useDepartments';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FormBuilder } from '@/components/FormBuilder';
import { FormConfigurationModal } from '@/components/FormConfigurationModal';
import { FormResultsScreen } from '@/components/FormResultsScreen';
import { PublicationLinkModal } from '@/components/PublicationLinkModal';
import { FormVersionsModal } from '@/components/FormVersionsModal';
import { FormsToFillList } from '@/components/FormsToFillList';
import { FormResultsList } from '@/components/FormResultsList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export const Forms = () => {
  const { forms, loading, createForm, deleteForm, duplicateForm, refetch, updateForm, getFormResponses } = useForms();
  const { departments } = useDepartments();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Initialize showBuilder and editingForm based on URL params to prevent flash
  const [showBuilder, setShowBuilder] = useState(() => {
    const builderParam = searchParams.get('builder');
    return builderParam === 'new' || builderParam === 'edit';
  });
  const [editingForm, setEditingForm] = useState(() => {
    const builderParam = searchParams.get('builder');
    const formIdParam = searchParams.get('id');
    if (builderParam === 'edit' && formIdParam) {
      // We'll set this properly in the effect when forms are loaded
      return { id: formIdParam };
    }
    return null;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const [resultsFormId, setResultsFormId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedFormForLink, setSelectedFormForLink] = useState<any>(null);
  
  // Filtros
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responseFilter, setResponseFilter] = useState<string>('all');

  // Effect to sync builder state with URL
  useEffect(() => {
    const builderParam = searchParams.get('builder');
    const formIdParam = searchParams.get('id');

    if (builderParam === 'new') {
      if (!showBuilder) {
        setShowBuilder(true);
      }
      if (editingForm !== null) {
        setEditingForm(null);
      }
    } else if (builderParam === 'edit' && formIdParam && forms.length > 0) {
      const formToEdit = forms.find(form => form.id === formIdParam);
      if (formToEdit) {
        if (!showBuilder) {
          setShowBuilder(true);
        }
        // Always update editingForm to ensure we have the full form data
        if (!editingForm || editingForm.id !== formToEdit.id || !(editingForm as any).title) {
          setEditingForm(formToEdit);
        }
      }
    } else if (!builderParam) {
      if (showBuilder) {
        setShowBuilder(false);
      }
      if (editingForm !== null) {
        setEditingForm(null);
      }
    }
  }, [searchParams, forms, showBuilder, editingForm]);

  const handleCreateForm = () => {
    // Clear any existing new form draft from localStorage
    try {
      localStorage.removeItem('formBuilder_new');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    navigate('/formularios/builder');
  };

  const handleEditForm = (form: any) => {
    navigate(`/formularios/${form.id}/editar`);
  };

  const handleCloseBuilder = () => {
    // This function is no longer needed as we navigate to full-screen pages
    navigate('/formularios');
  };

  const handleFormSaved = () => {
    // This function is no longer needed as FormBuilderFullScreen handles navigation
    refetch();
    toast({
      title: "Sucesso",
      description: "Formulário salvo com sucesso!",
    });
  };

  const handleDuplicateForm = async (id: string) => {
    const duplicated = await duplicateForm(id);
    if (duplicated) {
      toast({
        title: 'Formulário duplicado',
        description: 'Formulário duplicado com sucesso.'
      });
    }
  };

  const handleDeleteForm = async (id: string) => {
    console.log('=== INICIANDO EXCLUSÃO DE FORMULÁRIO ===');
    console.log('Formulário ID:', id);
    
    const success = await deleteForm(id);
    console.log('Resultado da exclusão:', success);
    
    if (success) {
      toast({
        title: 'Formulário excluído',
        description: 'Formulário excluído com sucesso.'
      });
    }
    // Se success for false, o toast de erro já foi mostrado no hook
  };

  const handleConfigureForm = (form: any) => {
    setSelectedForm(form);
    setShowConfigModal(true);
  };

  const handlePublishForm = (form: any) => {
    setSelectedForm(form);
    setShowConfigModal(true);
  };

  const handleViewVersions = (form: any) => {
    setSelectedForm(form);
    setShowVersionsModal(true);
  };

  const handleViewForm = (form: any) => {
    // Open form in a new tab for preview
    const formUrl = `/forms/external/${form.id}`;
    window.open(formUrl, '_blank');
  };

  const handleViewResults = async (form: any) => {
    setResultsFormId(form.id);
    setShowResultsScreen(true);
  };

  const handleShowLink = (form: any) => {
    setSelectedFormForLink(form);
    setShowLinkModal(true);
  };

  const handleConfigSave = async (config: any) => {
    if (!selectedForm) {
      toast({
        title: 'Erro',
        description: 'Nenhum formulário selecionado',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('=== SALVAMENTO INICIADO ===');
      console.log('Config:', config);
      console.log('Selected Form:', selectedForm);

      // Verificar se está publicando
      const isPublished = config.status && (
        config.status === 'published_internal' || 
        config.status === 'published_external' || 
        config.status === 'published_mixed'
      );

      console.log('Is Published:', isPublished);

      // Preparar dados básicos para a tabela forms (SEM external_recipients)
      const updateData = {
        title: config.title || selectedForm.title,
        description: config.description || selectedForm.description,
        status: config.status || 'draft',
        publication_status: config.status || 'draft',
        is_published: isPublished,
        published_at: isPublished && !selectedForm.published_at ? new Date().toISOString() : selectedForm.published_at,
        confidentiality_level: config.confidentiality_level || 'public',
        allows_anonymous_responses: config.allows_anonymous_responses || false,
        internal_recipients: config.internal_recipients || [],
        publication_settings: {
          ...selectedForm.publication_settings,
          ...config.publication_settings,
          // Ensure estimated_fill_minutes is preserved
          estimated_fill_minutes: config.publication_settings?.estimated_fill_minutes || config.estimated_fill_minutes
        },
        settings: {
          ...selectedForm.settings,
          response_limit: config.response_limit,
          deadline: config.deadline,
          estimated_fill_minutes: config.estimated_fill_minutes,
          ...config.settings
        },
        allowed_users: config.access_selection?.specificUsers || [],
        allowed_departments: config.access_selection?.departmentSelections || [],
        allowed_roles: config.access_selection?.roleSelections || [],
      };

      console.log('=== DADOS PARA ATUALIZAÇÃO ===');
      console.log('UpdateData:', updateData);
      
      // Atualizar campos básicos primeiro
      const result = await updateForm(selectedForm.id, updateData);
      
      if (result) {
        console.log('=== SALVAMENTO BÁSICO CONCLUÍDO ===');
        
        // Se for uma publicação, processar external_recipients separadamente
        if (isPublished && config.external_recipients && config.external_recipients.length > 0) {
          console.log('=== PROCESSANDO DESTINATÁRIOS EXTERNOS ===');
          console.log('External Recipients:', config.external_recipients);
          
          // TODO: Implementar salvamento na tabela form_external_recipients
          // Por enquanto, apenas logar
        }
        
        toast({
          title: isPublished ? 'Formulário publicado' : 'Configurações salvas',
          description: isPublished 
            ? 'O formulário foi publicado com sucesso.' 
            : 'As configurações do formulário foram atualizadas com sucesso.'
        });
        
        await refetch();
        setShowConfigModal(false);
        setSelectedForm(null);
      } else {
        throw new Error('Resultado nulo retornado do updateForm');
      }
    } catch (error) {
      console.error('=== ERRO NO SALVAMENTO ===');
      console.error('Error:', error);
      
      toast({
        title: 'Erro ao salvar',
        description: `Falha ao salvar o formulário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
    }
  };


  const getPublicationStatusLabel = (form: any) => {
    const status = form.publication_status || form.status;
    switch (status) {
      case 'published_internal':
        return 'Publicado - Interno';
      case 'published_external':
        return 'Publicado - Externo';
      case 'published_mixed':
        return 'Publicado - Misto';
      case 'published':
        return 'Publicado';
      case 'draft':
        return 'Rascunho';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const getPublicationStatusVariant = (form: any) => {
    const status = form.publication_status || form.status;
    switch (status) {
      case 'published_internal':
      case 'published_external':
      case 'published_mixed':
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredForms = forms.filter((form) => {
    // Filtro de busca
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPublicationStatusLabel(form).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de departamento
    const matchesDepartment = departmentFilter === 'all' || 
      (form.allowed_departments && form.allowed_departments.includes(departmentFilter));
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || 
      (form.publication_status || form.status) === statusFilter;
    
    // Filtro de respostas
    const hasResponses = form.has_responses || false;
    const matchesResponse = responseFilter === 'all' || 
      (responseFilter === 'with_responses' && hasResponses) ||
      (responseFilter === 'without_responses' && !hasResponses);
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesResponse;
  });

  const totalForms = forms.length;
  const publishedForms = forms.filter(f => 
    (f.publication_status || f.status).includes('published') || 
    f.status === 'published'
  ).length;
  const draftForms = forms.filter(f => 
    (f.publication_status || f.status) === 'draft'
  ).length;
  const archivedForms = forms.filter(f => 
    (f.publication_status || f.status) === 'archived'
  ).length;

  if (showResultsScreen && resultsFormId) {
    return (
      <FormResultsScreen
        formId={resultsFormId}
        onClose={() => {
          setShowResultsScreen(false);
          setResultsFormId(null);
        }}
      />
    );
  }


  if (loading) {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <>

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6 max-w-full min-w-0">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Formulários</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalForms}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publicados</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <EyeIcon className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{publishedForms}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Edit className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{draftForms}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arquivados</CardTitle>
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <Archive className="h-4 w-4 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{archivedForms}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="listagem" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-20">
            <TabsTrigger value="preencher" className="flex flex-col items-center gap-1 py-3 px-2 whitespace-normal text-center">
              <FileText className="w-4 h-4" />
              <span className="text-xs leading-tight">Formulários a preencher</span>
            </TabsTrigger>
            <TabsTrigger value="resultados" className="flex flex-col items-center gap-1 py-3 px-2 whitespace-normal text-center">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs leading-tight">Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="vinculados" className="flex flex-col items-center gap-1 py-3 px-2 whitespace-normal text-center">
              <Link className="w-4 h-4" />
              <span className="text-xs leading-tight">Formulários Vinculados</span>
            </TabsTrigger>
            <TabsTrigger value="listagem" className="flex flex-col items-center gap-1 py-3 px-2 whitespace-normal text-center">
              <List className="w-4 h-4" />
              <span className="text-xs leading-tight">Listagem de Formulários</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex flex-col items-center gap-1 py-3 px-2 whitespace-normal text-center">
              <Clipboard className="w-4 h-4" />
              <span className="text-xs leading-tight">Templates de Formulários</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preencher" className="space-y-4">
            <FormsToFillList />
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4">
            <FormResultsList onViewResults={handleViewResults} />
          </TabsContent>

          <TabsContent value="vinculados" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Formulários Vinculados</h3>
                <p className="text-muted-foreground text-center">
                  Formulários vinculados a outros processos e workflows
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listagem" className="space-y-4">

            {/* Actions Bar with Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar formulários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published_internal">Publicado - Interno</SelectItem>
                    <SelectItem value="published_external">Publicado - Externo</SelectItem>
                    <SelectItem value="published_mixed">Publicado - Misto</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={responseFilter} onValueChange={setResponseFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Respostas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="with_responses">Com respostas</SelectItem>
                    <SelectItem value="without_responses">Sem respostas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleCreateForm} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Formulário
              </Button>
            </div>

            {/* Forms Table */}
            {totalForms === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum formulário encontrado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comece criando seu primeiro formulário para coletar dados
                  </p>
                  <Button onClick={handleCreateForm} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Formulário
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Nome</TableHead>
                       <TableHead>Descrição</TableHead>
                       <TableHead>Status</TableHead>
                       <TableHead>Versão</TableHead>
                       <TableHead>Confidencialidade</TableHead>
                       <TableHead>Campos</TableHead>
                       <TableHead>Data de Criação</TableHead>
                       <TableHead className="text-right">Ações</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                     {filteredForms.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={8} className="text-center py-8">
                           <div className="flex flex-col items-center">
                             <Search className="w-8 h-8 text-muted-foreground mb-2" />
                             <p className="text-muted-foreground">
                               Nenhum formulário encontrado com os filtros aplicados
                             </p>
                           </div>
                         </TableCell>
                       </TableRow>
                     ) : (
                       filteredForms.map((form) => {
                         const isPublished = (form.publication_status || form.status).includes('published');
                         const hasResponses = form.has_responses || false;
                         const showResultsButton = isPublished && hasResponses;
                         
                         return (
                         <TableRow key={form.id}>
                           <TableCell className="font-medium">
                             <div className="flex items-center gap-2">
                               <FileText className="w-4 h-4 text-muted-foreground" />
                               <div className="flex flex-col">
                                 <span>{form.title}</span>
                                 {showResultsButton && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     className="mt-1 h-6 text-xs gap-1"
                                     onClick={() => handleViewResults(form)}
                                   >
                                     <BarChart3 className="w-3 h-3" />
                                     Resultados
                                   </Button>
                                 )}
                               </div>
                             </div>
                           </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">
                              {form.description || 'Sem descrição'}
                            </div>
                          </TableCell>
                           <TableCell>
                             <Badge variant={getPublicationStatusVariant(form)}>
                               {getPublicationStatusLabel(form)}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary" className="text-xs">
                                 v{(form as any).version_number || 1}
                               </Badge>
                               {(form as any).has_responses && (
                                 <Badge variant="outline" className="text-xs">
                                   Com respostas
                                 </Badge>
                               )}
                             </div>
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center gap-1">
                               {form.confidentiality_level === 'public' ? (
                                 <Badge variant="outline" className="text-green-700 border-green-200">
                                   Público
                                 </Badge>
                               ) : (
                                 <Badge variant="outline" className="text-orange-700 border-orange-200">
                                   Privado
                                 </Badge>
                               )}
                               {form.allow_anonymous && (
                                 <Badge variant="outline" className="text-xs">Anônimo</Badge>
                               )}
                             </div>
                           </TableCell>
                          <TableCell>
                            {Array.isArray(form.fields_definition) 
                              ? `${form.fields_definition.length} campos`
                              : '0 campos'
                            }
                          </TableCell>
                          <TableCell>
                            {new Date(form.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 <DropdownMenuItem onClick={() => handleEditForm(form)}>
                                   <Edit className="w-4 h-4 mr-2" />
                                   Editar Campos
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleConfigureForm(form)}>
                                   <Settings className="w-4 h-4 mr-2" />
                                   Configurações
                                 </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePublishForm(form)}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Publicar
                                  </DropdownMenuItem>
                                  {isPublished && (
                                    <DropdownMenuItem onClick={() => handleShowLink(form)}>
                                      <Link className="w-4 h-4 mr-2" />
                                      Link da publicação
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => handleDuplicateForm(form.id)}>
                                   <Copy className="w-4 h-4 mr-2" />
                                   Duplicar
                                 </DropdownMenuItem>
                                 <DropdownMenuItem>
                                   <Share2 className="w-4 h-4 mr-2" />
                                   Compartilhar
                                 </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewForm(form)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/chatter/form/${form.id}`)}>
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Chatter
                                  </DropdownMenuItem>
                                 {(form.version_number || 1) > 1 && (
                                   <DropdownMenuItem onClick={() => handleViewVersions(form)}>
                                     <History className="w-4 h-4 mr-2" />
                                     Ver Versões
                                   </DropdownMenuItem>
                                 )}
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem 
                                   onClick={() => handleDeleteForm(form.id)}
                                   className="text-destructive"
                                 >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Excluir
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                         </TableRow>
                         );
                       })
                     )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Templates de Formulários</h3>
                <p className="text-muted-foreground text-center">
                  Templates pré-configurados para criar formulários rapidamente
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {selectedForm && (
          <>
            <FormConfigurationModal
              isOpen={showConfigModal}
              onClose={() => {
                setShowConfigModal(false);
                setSelectedForm(null);
              }}
              onSave={handleConfigSave}
              formId={selectedForm.id}
              form={selectedForm}
            />
            
            <FormVersionsModal
              isOpen={showVersionsModal}
              onClose={() => {
                setShowVersionsModal(false);
                setSelectedForm(null);
              }}
              form={selectedForm}
              canDelete={true}
            />
          </>
        )}

        {selectedFormForLink && (
          <PublicationLinkModal
            open={showLinkModal}
            onOpenChange={setShowLinkModal}
            form={selectedFormForLink}
          />
        )}
        </div>
      </div>
    </>
  );
};
