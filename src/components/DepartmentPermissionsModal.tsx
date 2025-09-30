
import { useState, useEffect } from "react";

import { FullscreenDialogContent } from "@/components/ui/fullscreen-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SYSTEM_MENU, type SystemNavItem } from "@/lib/navigation-pages";
import { Search, ChevronDown, ChevronRight, Eye, EyeOff, Settings } from "lucide-react";

interface Department {
  id: string;
  name: string;
  color: string;
}

interface Permission {
  id?: string;
  page_name: string;
  admin_permission: string;
  director_permission: string;
  hr_permission: string;
  leader_permission: string; // ADDED
  user_permission: string;
}

interface DepartmentPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
}

const PERMISSION_OPTIONS = [
  { value: "ver_modificar", label: "Ver e Modificar", color: "default" },
  { value: "ver_somente", label: "Ver Somente", color: "secondary" },
  { value: "bloquear_acesso", label: "Bloquear Acesso", color: "destructive" }
];

export const DepartmentPermissionsModal = ({ open, onClose, department }: DepartmentPermissionsModalProps) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Gestão de Tarefas', 'Gestão', 'RH', 'Protheus', 'Gestão de Contatos', 'Vendas']));
  const { toast } = useToast();

  useEffect(() => {
    if (department && open) {
      fetchPermissions();
    }
  }, [department, open]);

  // Get hierarchical structure from SYSTEM_MENU
  const getSystemMenuStructure = () => {
    // Create a map to organize menu items by group
    const groupedMenu = new Map<string, SystemNavItem[]>();
    
    SYSTEM_MENU.forEach(item => {
      const group = item.group || 'Outros';
      if (!groupedMenu.has(group)) {
        groupedMenu.set(group, []);
      }
      groupedMenu.get(group)?.push(item);
    });
    
    return groupedMenu;
  };

  // Extract all canonical page names from SYSTEM_MENU
  const getAllSystemPages = (): string[] => {
    const pages: string[] = [];
    
    const processItem = (item: SystemNavItem) => {
      pages.push(item.label); // Use canonical label
      item.children?.forEach(child => processItem(child));
    };
    
    SYSTEM_MENU.forEach(processItem);
    return pages.sort((a, b) => a.localeCompare(b));
  };

  // Function to normalize page names to canonical form
  const normalizeToCanonical = (pageName: string): string => {
    const nameMapping = new Map<string, string>();
    
    const processItem = (item: SystemNavItem) => {
      nameMapping.set(item.label, item.label);
      item.aliases?.forEach(alias => nameMapping.set(alias, item.label));
      item.children?.forEach(child => processItem(child));
    };
    
    SYSTEM_MENU.forEach(processItem);
    return nameMapping.get(pageName) || pageName;
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const fetchPermissions = async () => {
    if (!department) return;

    try {
      const { data, error } = await supabase
        .from("department_permissions")
        .select("*")
        .eq("department_id", department.id);

      if (error) throw error;

      // Get all system pages (canonical names only)
      const systemPages = getAllSystemPages();
      
      // Normalize existing database entries to canonical names
      const existingPermissions = (data || []).map((p: any) => ({
        ...p,
        page_name: normalizeToCanonical(p.page_name)
      }));

      // Create permissions for all system pages
      const allPermissions = systemPages.map((pageName) => {
        const existing = existingPermissions.find((p: any) => p.page_name === pageName);
        return existing || {
          page_name: pageName,
          admin_permission: "ver_modificar",
          director_permission: "ver_modificar",
          hr_permission: "ver_modificar",
          leader_permission: "ver_modificar",
          user_permission: "ver_somente",
        };
      });

      setPermissions(allPermissions);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar permissões",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (pageName: string, type: 'admin' | 'director' | 'hr' | 'leader' | 'user', value: string) => {
    setPermissions(prev => prev.map(permission => 
      permission.page_name === pageName 
        ? { 
            ...permission, 
            [`${type}_permission`]: value 
          } as Permission
        : permission
    ));
  };

  const handleCompleteMissingPermissions = async () => {
    if (!department) return;

    setLoading(true);
    try {
      const systemPages = getAllSystemPages();
      const missingPages = systemPages.filter(pageName => 
        !permissions.some(p => p.page_name === pageName)
      );

      if (missingPages.length === 0) {
        toast({
          title: "Nenhuma permissão faltante",
          description: "Todas as páginas já possuem permissões configuradas.",
        });
        return;
      }

      const missingPermissions = missingPages.map(pageName => ({
        page_name: pageName,
        admin_permission: "ver_modificar",
        director_permission: "ver_modificar", 
        hr_permission: "ver_modificar",
        leader_permission: "ver_modificar",
        user_permission: "ver_somente",
      }));

      setPermissions(prev => [...prev, ...missingPermissions]);

      toast({
        title: "Permissões completadas",
        description: `${missingPages.length} páginas foram adicionadas com permissões padrão.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao completar permissões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!department) return;

    setLoading(true);
    try {
      // Delete existing permissions for this department
      await supabase
        .from("department_permissions")
        .delete()
        .eq("department_id", department.id);

      // Insert new permissions
      const permissionsToInsert = permissions.map(permission => ({
        department_id: department.id,
        page_name: permission.page_name,
        admin_permission: permission.admin_permission as "ver_modificar" | "ver_somente" | "bloquear_acesso",
        director_permission: permission.director_permission as "ver_modificar" | "ver_somente" | "bloquear_acesso",
        hr_permission: permission.hr_permission as "ver_modificar" | "ver_somente" | "bloquear_acesso",
        leader_permission: permission.leader_permission as "ver_modificar" | "ver_somente" | "bloquear_acesso",
        user_permission: permission.user_permission as "ver_modificar" | "ver_somente" | "bloquear_acesso"
      }));

      const { error } = await supabase
        .from("department_permissions")
        .insert(permissionsToInsert);

      if (error) throw error;

      toast({
        title: "Permissões salvas",
        description: "As permissões foram atualizadas com sucesso.",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar permissões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPermissionLabel = (value: string) => {
    return PERMISSION_OPTIONS.find(opt => opt.value === value)?.label || value;
  };

  const getPermissionColor = (value: string) => {
    return PERMISSION_OPTIONS.find(opt => opt.value === value)?.color || "default";
  };

  if (!department) return null;

  // Create hierarchical structure for display
  const menuStructure = getSystemMenuStructure();
  
  // Get obsolete permissions (not found in current SYSTEM_MENU)
  const allSystemPages = getAllSystemPages();
  const obsoletePermissions = permissions.filter(p => 
    !allSystemPages.includes(p.page_name) && 
    p.page_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FullscreenDialogContent
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      className="fixed inset-0 grid grid-rows-[auto,1fr,auto] w-screen h-screen max-w-none p-0 sm:rounded-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 md:p-6 gap-3">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: department.color }} />
          <span>Permissões - {department.name}</span>
        </h2>
        <div className="relative flex items-center gap-2 min-w-[240px] w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content area */}
      <div className="p-6 space-y-6 overflow-auto">
        {/* Hierarchical permissions display */}
        {Array.from(menuStructure.entries()).map(([groupName, items]) => {
          const isExpanded = expandedSections.has(groupName);
          const hasMatchingItems = search === '' || items.some(item => 
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            (item.children && item.children.some(child => 
              child.label.toLowerCase().includes(search.toLowerCase())
            ))
          );
          
          if (!hasMatchingItems) return null;
          
          return (
            <Card key={groupName} className="border-l-4 border-primary/20">
              <Collapsible open={isExpanded} onOpenChange={() => toggleSection(groupName)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {groupName}
                      </CardTitle>
                      {isExpanded ? 
                        <ChevronDown className="h-5 w-5" /> : 
                        <ChevronRight className="h-5 w-5" />
                      }
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Página</th>
                            <th className="text-center py-3 px-4 font-medium">Admin</th>
                            <th className="text-center py-3 px-4 font-medium">Diretor</th>
                            <th className="text-center py-3 px-4 font-medium">RH</th>
                            <th className="text-center py-3 px-4 font-medium">Líder</th>
                            <th className="text-center py-3 px-4 font-medium">Usuário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items
                            .filter(item => search === '' || item.label.toLowerCase().includes(search.toLowerCase()))
                            .map((item) => {
                              const permission = permissions.find(p => p.page_name === item.label);
                              if (!permission) return null;
                              
                              return (
                                <tr key={item.label} className="border-b hover:bg-muted/30">
                                  <td className="py-3 px-4 font-medium">
                                    <div className="flex items-center gap-2">
                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                      {item.label}
                                    </div>
                                  </td>
                                  {(['admin','director','hr','leader','user'] as const).map((role) => (
                                    <td key={role} className="py-3 px-4">
                                      <Select
                                        value={(permission as any)[`${role}_permission`]}
                                        onValueChange={(value) => handlePermissionChange(permission.page_name, role, value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {PERMISSION_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                              <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${
                                                  option.value === 'ver_modificar' ? 'bg-green-500' :
                                                  option.value === 'ver_somente' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} />
                                                {option.label}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          
                          {/* Child items */}
                          {items
                            .filter(item => item.children && item.children.length > 0)
                            .map(parentItem => 
                              parentItem.children?.filter(child => 
                                search === '' || child.label.toLowerCase().includes(search.toLowerCase())
                              ).map(child => {
                                const permission = permissions.find(p => p.page_name === child.label);
                                if (!permission) return null;
                                
                                return (
                                  <tr key={child.label} className="border-b bg-muted/25 hover:bg-muted/50">
                                    <td className="py-3 px-4 font-medium pl-8">
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-px bg-border" />
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        {child.label}
                                      </div>
                                    </td>
                                    {(['admin','director','hr','leader','user'] as const).map((role) => (
                                      <td key={role} className="py-3 px-4">
                                        <Select
                                          value={(permission as any)[`${role}_permission`]}
                                          onValueChange={(value) => handlePermissionChange(permission.page_name, role, value)}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {PERMISSION_OPTIONS.map(option => (
                                              <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                  <div className={`w-2 h-2 rounded-full ${
                                                    option.value === 'ver_modificar' ? 'bg-green-500' :
                                                    option.value === 'ver_somente' ? 'bg-yellow-500' : 'bg-red-500'
                                                  }`} />
                                                  {option.label}
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })
                            )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
        
        {/* Obsolete permissions section */}
        {obsoletePermissions.length > 0 && (
          <Card className="border-l-4 border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-yellow-600">
                <EyeOff className="h-5 w-5" />
                Páginas Obsoletas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Página</th>
                      <th className="text-center py-3 px-4 font-medium">Admin</th>
                      <th className="text-center py-3 px-4 font-medium">Diretor</th>
                      <th className="text-center py-3 px-4 font-medium">RH</th>
                      <th className="text-center py-3 px-4 font-medium">Líder</th>
                      <th className="text-center py-3 px-4 font-medium">Usuário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obsoletePermissions.map((permission) => (
                      <tr key={permission.page_name} className="border-b bg-yellow-50/50 hover:bg-yellow-100/50">
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4 text-yellow-600" />
                            {permission.page_name}
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              Obsoleto
                            </Badge>
                          </div>
                        </td>
                        {(['admin','director','hr','leader','user'] as const).map((role) => (
                          <td key={role} className="py-3 px-4">
                            <Select
                              value={(permission as any)[`${role}_permission`]}
                              onValueChange={(value) => handlePermissionChange(permission.page_name, role, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PERMISSION_OPTIONS.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        option.value === 'ver_modificar' ? 'bg-green-500' :
                                        option.value === 'ver_somente' ? 'bg-yellow-500' : 'bg-red-500'
                                      }`} />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t p-4 md:p-6">
        <Button 
          variant="outline" 
          onClick={handleCompleteMissingPermissions}
          disabled={loading}
          className="text-sm"
        >
          Completar Permissões Faltantes
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Permissões"}
          </Button>
        </div>
      </div>
    </FullscreenDialogContent>
  );
};
