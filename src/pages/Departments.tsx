import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Settings2, Edit, Trash2, MoreHorizontal, MessageCircle, Folder } from "lucide-react";
import { getIconComponent } from "@/utils/departmentIcons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DepartmentFormModal } from "@/components/DepartmentFormModal";
import { DepartmentPermissionsModal } from "@/components/DepartmentPermissionsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { PermissionGuard } from "@/components/PermissionGuard";

import { useDepartments, Department } from "@/hooks/useDepartments";

import { PageLayout } from "@/components/PageLayout";
import { ShareButton } from "@/components/ShareButton";
import { useChatterNavigation } from "@/hooks/useChatterNavigation";
import { FoldersWithDocuments } from "@/components/FoldersWithDocuments";

export const Departments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDepartmentForFolders, setSelectedDepartmentForFolders] = useState<Department | null>(null);
  
  const { toast } = useToast();
  
  const { departments, loading, refetch } = useDepartments({ includeTestDepartments: true });


  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormModalOpen(true);
  };

  const handleEditPermissions = (department: Department) => {
    setSelectedDepartment(department);
    setIsPermissionsModalOpen(true);
  };

  const handleDelete = async (departmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este departamento?")) return;

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", departmentId);

      if (error) throw error;

      toast({
        title: "Departamento excluído",
        description: "O departamento foi excluído com sucesso.",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir departamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedDepartment(null);
    refetch();
  };

  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedDepartment(null);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <PermissionGuard pageName="Departamentos" action="view">
      <PageLayout>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Gerencie os departamentos da empresa
            </p>
          </div>
          <PermissionGuard pageName="Departamentos" action="modify" hideWhenNoAccess>
            <Button onClick={() => setIsFormModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Departamento
            </Button>
          </PermissionGuard>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar departamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Card>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Ícone</TableHead>
                      <TableHead className="w-[50px]">Cor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Organograma</TableHead>

                      <TableHead>Criado em</TableHead>

                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department) => {
                      const DepartmentRowContent = () => {
                        const { openChatter } = useChatterNavigation();
                        
                        const IconComponent = getIconComponent(department.icon || 'Building2');

                        return (
                          <TableRow key={department.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-muted-foreground" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: department.color }}
                              />
                            </TableCell>
                        <TableCell className="font-medium">
                          {department.name}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {department.description || "Sem descrição"}
                        </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={department.integrates_org_chart ? "default" : "secondary"}>
                                {department.integrates_org_chart ? "Sim" : "Não"}
                              </Badge>
                            </TableCell>
                        <TableCell>
                          {new Date(department.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                          
                            
                        <TableCell className="text-right">
                          <PermissionGuard pageName="Departamentos" action="modify" hideWhenNoAccess>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuContent 
                                  align="end" 
                                  sideOffset={5}
                                  className="z-[9999] bg-popover border shadow-lg"
                                >
                                  <DropdownMenuItem onClick={() => handleEdit(department)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSelectedDepartmentForFolders(department)}>
                                    <Folder className="mr-2 h-4 w-4" />
                                    Ver Pastas e Documentos
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditPermissions(department)}>
                                    <Settings2 className="mr-2 h-4 w-4" />
                                    Editar Permissões
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openChatter({ recordType: 'department', recordId: department.id, recordName: department.name })}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Abrir Chatter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <div className="w-full">
                                      <ShareButton
                                        recordType="department"
                                        recordId={department.id}
                                        recordName={department.name}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start p-0 h-auto"
                                        showText={true}
                                      />
                                    </div>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(department.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenuPortal>
                            </DropdownMenu>
                          </PermissionGuard>
                            </TableCell>
                          </TableRow>
                        );
                      };
                      
                      return <DepartmentRowContent key={department.id} />;
                    })}
                  </TableBody>
                </Table>
                {filteredDepartments.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum departamento encontrado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folders and Documents Section */}
        {selectedDepartmentForFolders && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Pastas e Documentos - {selectedDepartmentForFolders.name}
              </h2>
              <Button
                variant="outline"
                onClick={() => setSelectedDepartmentForFolders(null)}
              >
                Fechar
              </Button>
            </div>
            <FoldersWithDocuments departmentId={selectedDepartmentForFolders.id} />
          </div>
        )}

        <DepartmentFormModal
          open={isFormModalOpen}
          onClose={handleCloseModal}
          department={selectedDepartment}
        />

        <DepartmentPermissionsModal
          open={isPermissionsModalOpen}
          onClose={handleClosePermissionsModal}
          department={selectedDepartment}
        />
      </PageLayout>
    </PermissionGuard>
  );
};