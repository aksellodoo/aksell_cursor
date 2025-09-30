import { Home, Users, Building, UserCog, ChevronDown, BarChart3, Shield, BriefcaseBusiness, UserCheck, CheckSquare, Workflow, Calendar, CheckCheck, Settings, UserPlus, Share2, FileText, Database, Table, Search, List, Plus, Globe, Package, Award, Mail, FolderTree, ShoppingCart, Truck, MapPin, MessageSquare } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { ChatterAccess } from './ChatterAccess';
import { NotificationBell } from './NotificationBell';
import { UserProfileMenu } from './UserProfileMenu';
import { ThemeToggle } from './ui/theme-toggle';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { LogOut, Key } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "./Logo";
import { Skeleton } from "@/components/ui/skeleton";
import aksellSymbol from "@/assets/aksell-symbol.png";


const menuItems = [
  {
    title: "Gestão de Tarefas",
    icon: CheckSquare,
    items: [
      { title: "Tarefas", url: "/tasks", icon: CheckSquare },
      { title: "Formulários", url: "/formularios", icon: FileText },
      { title: "Automações", url: "/automacoes", icon: Workflow },
      { title: "Gestão de Documentos", url: "/gestao/documentos", icon: FolderTree }
    ]
  },
  {
    title: "Gestão",
    icon: Settings,
    items: [
      { title: "Usuários", url: "/usuarios", icon: UserCheck },
      { title: "Departamentos", url: "/departamentos", icon: Building },
      { title: "Portais", url: "/portais", icon: List },
      { title: "Registros Compartilhados", url: "/registros-compartilhados", icon: Share2 },
      { title: "Site", icon: Globe, subItems: [
        { title: "Dados do Site", url: "/gestao/site/produtos", icon: Package },
        { title: "Política de Privacidade", url: "/gestao/site/politica-privacidade", icon: Shield }
      ] }
    ]
  },
  {
    title: "Gestão de Contatos",
    icon: Mail,
    items: [
      { title: "Contatos", url: "/gestao/contatos", icon: Mail },
      { title: "Entidades", url: "/gestao/contatos/entidades", icon: Building }
    ]
  },
  {
    title: "Vendas",
    icon: Award,
    items: [
      { title: "Clientes", url: "/vendas/cadastros", icon: FileText },
      { title: "Vendedores", url: "/vendas/vendedores", icon: UserCheck },
      { title: "Representantes Comerciais", url: "/vendas/representantes", icon: ShoppingCart },
      { title: "Grupos Econômicos", url: "/vendas/grupos-economicos", icon: Users }
    ]
  },
  {
    title: "Logística",
    icon: Truck,
    items: [
      { title: "Transportadoras", url: "/logistica/transportadoras", icon: Truck },
      { title: "Cidades", url: "/logistica/cidades", icon: MapPin }
    ]
  },
  {
    title: "Compras",
    icon: ShoppingCart,
    items: [
      { title: "Fornecedores", url: "/compras/cadastros", icon: FileText },
      { title: "Compradores", url: "/compras/compradores", icon: Users },
      { title: "Representantes Comerciais", url: "/compras/representantes", icon: ShoppingCart },
      { title: "Potenciais Fornecedores", url: "/compras/potenciais-fornecedores", icon: FileText },
      { title: "Fornecedores Unificados", url: "/compras/fornecedores-unificados", icon: Users },
      { title: "Grupos Econômicos", url: "/compras/grupos-economicos", icon: Users },
      { title: "Tipos de Materiais", url: "/compras/tipos-de-materiais", icon: Package }
    ]
  },
  {
    title: "RH",
    icon: BriefcaseBusiness,
    items: [
      { title: "Funcionários", url: "/rh/funcionarios", icon: UserCheck },
      { title: "Organograma", url: "/rh/organograma", icon: Building }
    ]
  },
  {
    title: "Protheus",
    icon: Database,
    items: [
      { title: "Configurações", url: "/protheus/configuracoes", icon: Settings },
      { title: "Tabelas Protheus", url: "/protheus/tabelas", icon: Table }
    ]
  },
  {
    title: "IA",
    icon: MessageSquare,
    items: [
      { title: "Conversas", url: "/ia/conversas", icon: MessageSquare }
    ]
  }
] as const;

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const { userProfile, hasAccess, canView, loading: permissionsLoading } = usePermissions();
  
  const location = useLocation();
  
  // Estados para controlar se cada seção está aberta
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Gestão de Tarefas": true,
    "Gestão": true,
    "Gestão de Contatos": true,
    "Vendas": true,
    "Logística": true,
    "Compras": true,
    "RH": true,
    "Protheus": true
  });

  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const collapsed = state === "collapsed";

  // Check if section should be visible (has at least one accessible item)
  const isSectionVisible = (section: any) => {
    if (permissionsLoading) return true; // Show all sections while loading
    return section.items?.some((item: any) => {
      if (item.subItems) {
        return item.subItems.some((subItem: any) => hasAccess(subItem.title) && canView(subItem.title));
      }
      return hasAccess(item.title) && canView(item.title);
    });
  };

  return (
    <Sidebar
      className="w-60"
      collapsible="offcanvas"
    >
      <SidebarHeader className="p-4 border-b">
        <Logo 
          variant="full" 
          size="md"
          onClick={toggleSidebar}
        />
      </SidebarHeader>
      
      <SidebarContent className="gap-0">
        {permissionsLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : (
          /* Mapear outros itens do menu */
          menuItems
            .filter(section => isSectionVisible(section))
            .map((section, sectionIndex) => {
            
            return (
              <Collapsible 
                key={sectionIndex} 
                open={openSections[section.title]}
                onOpenChange={() => toggleSection(section.title)}
              >
                <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="group/collapsible w-full">
                    <div className="flex items-center justify-between flex-1">
                      <div className="flex items-center">
                        <section.icon className="mr-2 h-4 w-4" />
                        {section.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                       {section.items
                        .filter((item: any) => permissionsLoading || (hasAccess(item.title) && canView(item.title)))
                     .map((item, itemIndex) => {
                     const hasSubItems = (item as any).subItems;
                     const isActive = !hasSubItems && location.pathname === (item as any).url;
                      
                     if (hasSubItems) {
                       return (
                         <Collapsible key={itemIndex}>
                           <SidebarMenuItem>
                             <CollapsibleTrigger asChild>
                               <SidebarMenuButton isActive={isActive}>
                                 <item.icon className="h-4 w-4" />
                                 <span>{item.title}</span>
                                 <ChevronDown className="ml-auto h-4 w-4" />
                               </SidebarMenuButton>
                             </CollapsibleTrigger>
                             <CollapsibleContent>
                               <SidebarMenuSub>
                                 {(item as any).subItems.map((subItem: any, subIndex: number) => {
                                   const subIsActive = location.pathname === subItem.url;
                                   return (
                                     <SidebarMenuSubItem key={subIndex}>
                                       <SidebarMenuSubButton asChild isActive={subIsActive}>
                                         <NavLink 
                                           to={subItem.url}
                                           className={({ isActive }) => 
                                             isActive 
                                               ? "bg-primary/10 text-primary font-medium" 
                                               : "hover:bg-muted/50"
                                           }
                                         >
                                           <subItem.icon className="h-4 w-4" />
                                           <span>{subItem.title}</span>
                                         </NavLink>
                                       </SidebarMenuSubButton>
                                     </SidebarMenuSubItem>
                                   );
                                 })}
                               </SidebarMenuSub>
                             </CollapsibleContent>
                           </SidebarMenuItem>
                         </Collapsible>
                       );
                     }
                     
                     return (
                      <SidebarMenuItem key={itemIndex}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink 
                            to={(item as any).url}
                            className={({ isActive }) => 
                              isActive 
                                ? "bg-primary/10 text-primary font-medium" 
                                : "hover:bg-muted/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
              </Collapsible>
            )
          })
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t space-y-3">
        {/* Action buttons - Above user profile */}
        <div className="flex items-center space-x-2 justify-start">
          <NotificationBell />
          {profile?.id && (
            <ChatterAccess
              recordType="user"
              recordId={profile.id}
              recordName={profile.name || 'Usuário'}
              variant="icon-only"
            />
          )}
          <ThemeToggle />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>
                {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {profile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email || 'email@exemplo.com'}
              </p>
            </div>
          </div>
          
          <UserProfileMenu
            userName={profile?.name || 'Usuário'}
            userRole={profile?.role || ''}
            canChangePassword={profile?.can_change_password || false}
            onSignOut={signOut}
          />
        </div>
        
      </SidebarFooter>
    </Sidebar>
  );
}