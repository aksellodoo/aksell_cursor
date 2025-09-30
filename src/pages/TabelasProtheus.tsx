import { useState, useEffect } from "react";
import { Search, Database, Clock, Eye, Edit, Trash2, Power, PowerOff, Table, CheckCircle, XCircle, TableProperties, Link as LinkIcon, Shield, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageLayout } from "@/components/PageLayout";
import { CreateProtheusTableModal } from "@/components/CreateProtheusTableModal";
import { ProtheusTableDetailsModal } from "@/components/ProtheusTableDetailsModal";
import { RelationshipBuilder } from "@/components/RelationshipBuilder";
import { EditSyncSettingsModal } from "@/components/EditSyncSettingsModal";

import { useProtheusTables } from "@/hooks/useProtheusTables";
import { useProtheusSync } from "@/hooks/useProtheusSync";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Interface for relationships
interface Relationship {
  id: string;
  name: string;
  sourceTable: string;
  targetTable: string;
  type: '1:N' | 'N:1' | 'N:N';
  joinFields: { sourceField: string; targetField: string; }[];
  notes?: string;
  createdAt: string;
}

export default function TabelasProtheus() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [dynamicTables, setDynamicTables] = useState<any[]>([]);
  const [editingTable, setEditingTable] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isCreateRelationshipOpen, setIsCreateRelationshipOpen] = useState(false);
  const [isEditSyncModalOpen, setIsEditSyncModalOpen] = useState(false);
  const [selectedTableForSyncEdit, setSelectedTableForSyncEdit] = useState<any>(null);
  
  const { tables, loading, deleteTable, toggleTableStatus, fetchTables, cleanSupabaseTable, updateSupabaseTableStructure, updateSyncSettings, toggleLinkedOutsideProtheus } = useProtheusTables();
  const { createSyncTable, testTableConnection, loading: syncLoading } = useProtheusSync();
  const { toast } = useToast();

  // Fetch dynamic tables to check which have corresponding Supabase tables
  useEffect(() => {
    const fetchDynamicTables = async () => {
      try {
        const { data, error } = await supabase
          .from('protheus_dynamic_tables')
          .select('protheus_table_id, supabase_table_name');
        
        if (error) throw error;
        setDynamicTables(data || []);
      } catch (error) {
        console.error('Error fetching dynamic tables:', error);
      }
    };

    fetchDynamicTables();
  }, []);

  // Fetch relationships from database
  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const { data, error } = await supabase
          .from('protheus_table_relationships')
          .select(`
            id,
            name,
            relationship_type,
            join_fields,
            notes,
            created_at,
            source_table_id,
            target_table_id
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formattedRelationships = await Promise.all((data || []).map(async (rel: any) => {
          // Get source table name
          const { data: sourceTable } = await supabase
            .from('protheus_tables')
            .select('table_name')
            .eq('id', rel.source_table_id)
            .single();
          
          // Get target table name
          const { data: targetTable } = await supabase
            .from('protheus_tables')
            .select('table_name')
            .eq('id', rel.target_table_id)
            .single();
          
          const sourceTableName = sourceTable?.table_name || 'Desconhecida';
          const targetTableName = targetTable?.table_name || 'Desconhecida';
          
          return {
            id: rel.id,
            name: rel.name || `${sourceTableName}_${targetTableName}`.toUpperCase(),
            sourceTable: sourceTableName,
            targetTable: targetTableName,
            type: rel.relationship_type as '1:N' | 'N:1' | 'N:N',
            joinFields: Array.isArray(rel.join_fields) 
              ? (rel.join_fields as { sourceField: string; targetField: string; }[])
              : [],
            notes: rel.notes,
            createdAt: rel.created_at
          };
        }));
        
        setRelationships(formattedRelationships);
      } catch (error) {
        console.error('Error fetching relationships:', error);
      }
    };

    fetchRelationships();
  }, []);

  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (table: any) => {
    setSelectedTable(table);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedTable(null);
  };

  const handleViewRecords = (table: any) => {
    navigate(`/protheus/tabelas/${table.id}/registros`);
  };

  const handleToggleStatus = async (table: any) => {
    await toggleTableStatus(table.id, !table.is_active);
  };

  const handleDeleteTable = async (table: any) => {
    // Verificar se a tabela está linkada fora do Protheus
    if (table.linked_outside_protheus) {
      toast({
        title: "Operação não permitida",
        description: "Esta tabela está linkada fora do Protheus e não pode ser deletada.",
        variant: "destructive",
      });
      return;
    }
    
    await cleanSupabaseTable(table.id);
  };

  const handleCreateSyncTable = async (tableId: string) => {
    console.log('Creating sync table for:', tableId);
    const result = await createSyncTable(tableId);
    console.log('Create sync table result:', result);
    
    if (result.success) {
      toast({
        title: "Tabela Criada com Sucesso",
        description: result.message,
      });
      // Refresh tables list to show updated status
      window.location.reload();
    } else {
      toast({
        title: "Erro ao Criar Tabela",
        description: `${result.message} - Verifique a configuração do Protheus e tente novamente.`,
        variant: "destructive",
      });
      console.error('Detailed error:', result);
    }
  };

  const handleTestConnection = async (tableId: string) => {
    console.log('Testing connection for table:', tableId);
    const result = await testTableConnection(tableId);
    console.log('Test connection result:', result);
    
    if (result.success) {
      toast({
        title: "Teste de Conexão",
        description: result.message,
      });
    } else {
      toast({
        title: "Erro no Teste",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Check if table has corresponding Supabase table created
  const hasCorrespondingTable = (tableId: string) => {
    return dynamicTables.some(dt => dt.protheus_table_id === tableId);
  };

  const handleTableCreated = async () => {
    // Refresh both tables list and dynamic tables
    await fetchTables();
    // Refresh dynamic tables to update status
    const { data } = await supabase
      .from('protheus_dynamic_tables')
      .select('protheus_table_id, supabase_table_name');
    setDynamicTables(data || []);
  };

  const handleUpdateSupabaseStructure = async (tableId: string) => {
    const result = await updateSupabaseTableStructure(tableId);
    if (result.success) {
      // Refresh to show updated status
      await handleTableCreated();
    }
  };

  const handleEditTable = (table: any) => {
    setEditingTable(table);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTable(null);
  };

  const handleEditSyncSettings = (table: any) => {
    setSelectedTableForSyncEdit(table);
    setIsEditSyncModalOpen(true);
  };

  const handleCloseSyncEditModal = () => {
    setIsEditSyncModalOpen(false);
    setSelectedTableForSyncEdit(null);
  };

  const handleSaveSyncSettings = async (tableId: string, syncSettings: any) => {
    await updateSyncSettings(tableId, syncSettings);
  };

  const handleToggleLinkedOutside = async (table: any) => {
    await toggleLinkedOutsideProtheus(table.id, !table.linked_outside_protheus);
  };

  const handleSaveRelationship = async (relationshipData: any) => {
    try {
      // Find the table IDs based on table names
      const sourceTableId = tables.find(t => t.table_name === relationshipData.sourceTable)?.id;
      const targetTableId = tables.find(t => t.table_name === relationshipData.targetTable)?.id;
      
      if (!sourceTableId || !targetTableId) {
        throw new Error('Tabelas não encontradas');
      }

      // Generate automatic name
      const relationshipName = `${relationshipData.sourceTable}_${relationshipData.targetTable}`.toUpperCase();

      const { data, error } = await supabase
        .from('protheus_table_relationships')
        .insert({
          source_table_id: sourceTableId,
          target_table_id: targetTableId,
          relationship_type: relationshipData.type,
          join_fields: relationshipData.joinFields,
          notes: relationshipData.notes,
          name: relationshipName,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id, name, relationship_type, join_fields, notes, created_at')
        .single();
      
      if (error) throw error;

      const newRelationship: Relationship = {
        id: data.id,
        name: data.name || relationshipName,
        sourceTable: relationshipData.sourceTable,
        targetTable: relationshipData.targetTable,
        type: data.relationship_type as '1:N' | 'N:1' | 'N:N',
        joinFields: Array.isArray(data.join_fields) 
          ? (data.join_fields as { sourceField: string; targetField: string; }[])
          : [],
        notes: data.notes,
        createdAt: data.created_at
      };
      
      setRelationships(prev => [...prev, newRelationship]);
      
      toast({
        title: "Relacionamento salvo",
        description: `Relacionamento "${relationshipName}" salvo com sucesso.`,
      });
    } catch (error) {
      console.error('Error saving relationship:', error);
      toast({
        title: "Erro ao salvar relacionamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getIntervalText = (value: number, unit: string) => {
    const unitLabels = {
      seconds: 's',
      minutes: 'm',
      hours: 'h',
      days: 'd'
    };
    return `${value}${unitLabels[unit as keyof typeof unitLabels]}`;
  };

  const activeTables = tables.filter(t => t.is_active).length;
  const inactiveTables = tables.filter(t => !t.is_active).length;
  const tablesWithSupabase = tables.filter(t => t.create_supabase_table).length;
  const linkedTablesCount = tables.filter(t => hasCorrespondingTable(t.id)).length;
  const linkedOutsideCount = tables.filter(t => t.linked_outside_protheus).length;

  return (
    <PageLayout>
      <Tabs defaultValue="tabelas" className="w-full no-animations">
        <TabsList className="overflow-x-auto scrollbar-none w-full md:w-auto md:grid md:grid-cols-2 gap-1 ml-16">
          <TabsTrigger value="tabelas" className="flex items-center gap-2 min-w-[140px]">
            <Database className="w-4 h-4" />
            Tabelas
          </TabsTrigger>
          <TabsTrigger value="relacionamentos" className="flex items-center gap-2 min-w-[180px]">
            <LinkIcon className="w-4 h-4" />
            Relacionamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabelas" className="space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4">

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ml-16">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tabelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <CreateProtheusTableModal onSuccess={handleTableCreated} />
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 ml-16">
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Tabelas</p>
                <p className="text-2xl font-bold text-foreground">{tables.length}</p>
              </div>
              <Table className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tabelas Ativas</p>
                <p className="text-2xl font-bold text-success">{activeTables}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tabelas Inativas</p>
                <p className="text-2xl font-bold text-destructive">{inactiveTables}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Tabela Supabase</p>
                <p className="text-2xl font-bold text-accent">{tablesWithSupabase}</p>
              </div>
              <Database className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tabelas Supabase Vinculadas</p>
                <p className="text-2xl font-bold text-primary">{linkedTablesCount}</p>
              </div>
              <LinkIcon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0 bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Linkadas fora Protheus</p>
                <p className="text-2xl font-bold text-orange-500">{linkedOutsideCount}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables List */}
      <Card className="shadow-card border-0 bg-gradient-card ml-16">
        <CardHeader>
          <CardTitle>Lista de Tabelas Protheus</CardTitle>
          <CardDescription>
            {filteredTables.length} tabela(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
               <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
               <p>Carregando tabelas...</p>
             </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma tabela encontrada</p>
            </div>
          ) : (
            <TableComponent>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Tabela</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Nome Tabela Supabase</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Tabela Supabase</TableHead>
                  <TableHead>Linkado fora Protheus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-mono font-medium text-foreground">
                            {table.table_name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="text-sm text-foreground truncate">
                          {table.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {table.supabase_table_name ? (
                        <code className="font-mono text-xs px-2 py-1 bg-muted rounded text-foreground">
                          {table.supabase_table_name}
                        </code>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">
                          Não criada
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getIntervalText(table.query_interval_value, table.query_interval_unit)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={table.create_supabase_table ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {table.create_supabase_table ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Sim
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Não
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={table.linked_outside_protheus ? "destructive" : "secondary"}
                        className="gap-1"
                      >
                        {table.linked_outside_protheus ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            Sim
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Não
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={table.is_active ? "default" : "secondary"}
                        className="gap-1"
                      >
                        {table.is_active ? (
                          <>
                            <Power className="h-3 w-3" />
                            Ativa
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-3 w-3" />
                            Inativa
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Database className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(table)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleTestConnection(table.id)}
                            disabled={syncLoading}
                          >
                            <Database className="mr-2 h-4 w-4" />
                            Testar Conexão
                          </DropdownMenuItem>

                          {table.create_supabase_table && !hasCorrespondingTable(table.id) && (
                            <DropdownMenuItem 
                              onClick={() => handleCreateSyncTable(table.id)}
                              disabled={syncLoading}
                            >
                              <Database className="mr-2 h-4 w-4" />
                              Criar Tabela de Sync
                            </DropdownMenuItem>
                          )}

                          {table.create_supabase_table && hasCorrespondingTable(table.id) && (
                            <DropdownMenuItem onClick={() => handleViewRecords(table)}>
                              <TableProperties className="mr-2 h-4 w-4" />
                              Ver Registros
                            </DropdownMenuItem>
                          )}

                          
                          <DropdownMenuItem 
                            onClick={() => handleEditTable(table)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {hasCorrespondingTable(table.id) ? 'Editar Campos Extras' : 'Editar'}
                          </DropdownMenuItem>

                          {hasCorrespondingTable(table.id) && (
                            <DropdownMenuItem 
                              onClick={() => handleEditSyncSettings(table)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Editar Sincronização
                            </DropdownMenuItem>
                          )}

                          {table.create_supabase_table && hasCorrespondingTable(table.id) && (
                            <DropdownMenuItem 
                              onClick={() => handleUpdateSupabaseStructure(table.id)}
                              disabled={syncLoading}
                            >
                              <Database className="mr-2 h-4 w-4" />
                              Atualizar Base de Dados Supabase
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => handleToggleStatus(table)}>
                            {table.is_active ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleToggleLinkedOutside(table)}>
                            {table.linked_outside_protheus ? (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Desativar linkado fora Protheus
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Ativar linkado fora Protheus
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                       <DropdownMenuItem 
                                         onSelect={(e) => e.preventDefault()}
                                         disabled={table.linked_outside_protheus}
                                         className={table.linked_outside_protheus ? "" : "text-destructive focus:text-destructive"}
                                       >
                                         <Trash2 className="mr-2 h-4 w-4" />
                                         Deletar
                                       </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    {!table.linked_outside_protheus && (
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja deletar a tabela "{table.table_name}"? 
                                            Esta ação não pode ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteTable(table)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Deletar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    )}
                                  </AlertDialog>
                                </div>
                              </TooltipTrigger>
                              {table.linked_outside_protheus && (
                                <TooltipContent>
                                  <p>Esta tabela está linkada fora do Protheus e não pode ser deletada</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="relacionamentos" className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ml-16">
            <div>
              <h3 className="text-lg font-semibold">Relacionamentos</h3>
              <p className="text-sm text-muted-foreground">
                {relationships.length} relacionamento(s) cadastrado(s)
              </p>
            </div>
            
            <Button onClick={() => setIsCreateRelationshipOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar relacionamento
            </Button>
          </div>

          {/* Relationships Table */}
          <Card className="shadow-card border-0 bg-gradient-card ml-16">
            <CardHeader>
              <CardTitle>Lista de Relacionamentos</CardTitle>
              <CardDescription>
                Relacionamentos entre tabelas Protheus
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {relationships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LinkIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum relacionamento cadastrado</p>
                </div>
              ) : (
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tabela Origem</TableHead>
                        <TableHead>Tabela Destino</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Chaves (Join)</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="w-[50px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relationships.map((relationship) => (
                        <TableRow key={relationship.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-mono font-medium text-foreground">
                              {relationship.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium text-foreground">
                              {relationship.sourceTable}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium text-foreground">
                              {relationship.targetTable}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {relationship.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {relationship.joinFields?.map((field, index) => (
                                <div key={index} className="text-xs">
                                  {field.sourceField} → {field.targetField}
                                </div>
                              )) || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground max-w-md truncate">
                              {relationship.notes || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(relationship.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableComponent>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <ProtheusTableDetailsModal
        table={selectedTable}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />

      {/* Edit Modal */}
      {editingTable && (
        <CreateProtheusTableModal
          table={editingTable}
          isEdit={true}
          hasSupabaseTable={hasCorrespondingTable(editingTable.id)}
          onClose={handleCloseEditModal}
          onSuccess={() => {
            handleTableCreated();
            handleCloseEditModal();
          }}
        />
      )}

      {/* Relationship Builder */}
      {isCreateRelationshipOpen && (
        <RelationshipBuilder
          isOpen={isCreateRelationshipOpen}
          onClose={() => setIsCreateRelationshipOpen(false)}
          tables={tables}
          onSave={handleSaveRelationship}
        />
      )}

      {/* Edit Sync Settings Modal */}
      <EditSyncSettingsModal
        isOpen={isEditSyncModalOpen}
        onClose={handleCloseSyncEditModal}
        table={selectedTableForSyncEdit}
        onSave={handleSaveSyncSettings}
      />

    </PageLayout>
  );
}
