
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCityDistanceCalculation } from "@/hooks/useCityDistanceCalculation";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { DistanceProgressModal } from "@/components/site/DistanceProgressModal";
import { useState } from "react";

export function TopNavigation() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isJobRunning, currentJob } = useCityDistanceCalculation();
  const [showGlobalProgressModal, setShowGlobalProgressModal] = useState(false);
  
  // Função para obter o título da página atual
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return null; // Remove header da página principal
    if (path.startsWith('/vendas/vendedores')) return null; // Remove header para vendedores
    if (path.startsWith('/vendas/transportadoras')) return null; // Remove header para transportadoras
    if (path.startsWith('/logistica/transportadoras')) return null; // Remove header para transportadoras
    if (path.startsWith('/logistica/cidades')) return null; // Remove header para cidades
    if (path.startsWith('/vendas/representantes')) return null; // Remove header para representantes comerciais
    if (path.startsWith('/compras/compradores')) return null; // Remove header para compradores
    if (path.startsWith('/compras/representantes')) return null; // Remove header para representantes comerciais de compras
    if (path.startsWith('/compras/grupos-economicos')) return null; // Remove header para grupos econômicos
    if (path.startsWith('/dashboards/usuarios')) return 'Dashboard de Usuários';
    if (path.startsWith('/dashboards/departamentos')) return 'Dashboard de Departamentos';
    if (path.startsWith('/dashboards/auditoria')) return 'Dashboard de Auditoria';
    if (path.startsWith('/usuarios')) return null;
    if (path.startsWith('/departamentos')) return 'Departamentos';
    if (path.startsWith('/rh/funcionarios')) return 'Funcionários';
    if (path.startsWith('/rh/organograma')) return 'Organograma';
    if (path.startsWith('/automacoes/editor')) return 'Editor de Workflow';
    if (path.startsWith('/automacoes')) return null;
    if (path.startsWith('/formularios')) return null; // Remove header para formulários
    if (path.startsWith('/tasks')) return null; // Remove header para tarefas
    if (path.startsWith('/protheus')) return null;

    // Novos títulos para Portais
    // Remove header for all 'Portais' pages
    if (path.startsWith('/portais')) return null;
    
    // Remove header for Site pages
    if (path.startsWith('/gestao/site')) return null;
    
    // Remove header for Document Management pages
    if (path.startsWith('/gestao/documentos')) return null;
    
    // Remove header for Contacts pages
    if (path.startsWith('/gestao/contatos')) return null;
    if (path.startsWith('/vendas/cadastros')) return null;
    if (path.startsWith('/compras/cadastros')) return null;
    
    return 'Sistema';
  };

  const title = getPageTitle();
  
  // Não renderiza se não há título
  if (!title) return null;

  return (
    <>
      <nav className="border-b border-border/50 bg-card/95 backdrop-blur-md shadow-sm relative z-50">
        <div className="px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger 
                className="h-10 w-10 mobile-touch-target relative z-50 md:hidden" 
                data-sidebar="trigger"
              />
              
            </div>
            
            {/* Global Distance Job Indicator */}
            {isJobRunning && currentJob && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowGlobalProgressModal(true)}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Activity className="h-4 w-4 mr-2" />
                Distâncias: em execução
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Global Progress Modal */}
      <DistanceProgressModal
        open={showGlobalProgressModal}
        onOpenChange={setShowGlobalProgressModal}
      />
    </>
  );
}
