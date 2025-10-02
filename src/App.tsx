
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import TestNotifications from "./pages/TestNotifications";
import Auth from "./pages/Auth";
import MfaSetup from "./pages/MfaSetup";
import DefinirSenha from "./pages/DefinirSenha";
import CompleteSignup from "./pages/CompleteSignup";
import SalesPage from "./pages/sales/SalesPage";
import { GroupMembersManager } from "./pages/sales/GroupMembersManager";
import VendasCadastros from "./pages/VendasCadastros";
import SitePageRouter from "./pages/Site/SitePageRouter";
import { UnifiedDashboard } from "./pages/UnifiedDashboard";
import { AppLayout } from "./components/AppLayout";
import { RootRedirect } from "./components/RootRedirect";
import Vendedores from "./pages/Vendedores";
import RepresentantesComerciais from "./pages/RepresentantesComerciais";
import RepresentantesComerciaisCompras from "./pages/RepresentantesComerciaisCompras";
import PotentialSuppliers from "./pages/PotentialSuppliers";
import Cidades from "./pages/Cidades";
import Transportadoras from "./pages/Transportadoras";
import SolicitarAcesso from "./pages/SolicitarAcesso";
import { Tasks } from "./pages/Tasks";
import { TaskEditorFullscreen } from "./pages/TaskEditorFullscreen";
import { Forms } from "./pages/Forms";
import { Automacoes } from "./pages/Automacoes";
import FormBuilderFullScreen from "./components/FormBuilderFullScreen";
import FormPublicFill from "./pages/FormPublicFill";
import { InternalFormFill } from "./components/InternalFormFill";
import DocumentManagement from "./pages/DocumentManagement";
import DocumentImport from "./pages/DocumentImport";

import { Users } from "./pages/Users";
import { UserDetail } from "./pages/UserDetail";
import { UserEdit } from "./pages/UserEdit";
import { Departments } from "./pages/Departments";
import Portais from "./pages/Portais";
import PortalCreate from "./pages/PortalCreate";
import RegistrosCompartilhados from "./pages/RegistrosCompartilhados";
import ContactsList from "./pages/ContactsList";
import ContactForm from "./pages/ContactForm";
import ContactEntities from "./pages/ContactEntities";
import { ChatterFullScreen } from "./components/ChatterFullScreen";
import SiteData from "./pages/Site/SiteData";
import SitePrivacyPolicy from "./pages/Site/SitePrivacyPolicy";
import ComprasCadastros from "./pages/ComprasCadastros";
import Compradores from "./pages/Compradores";
import UnifiedSuppliersPage from "./pages/purchases/UnifiedSuppliersPage";
import Employees from "./pages/Employees";
import Organogram from "./pages/Organogram";
import ProtheusConfig from "./pages/ProtheusConfig";
import TabelasProtheus from "./pages/TabelasProtheus";
import ProtheusTableRecords from "./pages/ProtheusTableRecords";
import EconomicGroupsPage from "./pages/sales/EconomicGroupsPage";
import SupplierEconomicGroupsPage from "./pages/purchases/SupplierEconomicGroupsPage";
import MaterialTypesPage from "./pages/purchases/MaterialTypesPage";
import NotFound from "./pages/NotFound";
import ConversasPage from "./pages/IA/ConversasPage";
import ConversationView from "./pages/IA/ConversationView";
import ProtheusConversationPage from "./pages/IA/ProtheusConversationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/2fa-setup" element={<MfaSetup />} />
            <Route path="/auth/definir-senha" element={<DefinirSenha />} />
            <Route path="/auth/reset-password" element={<Navigate to="/auth/definir-senha" replace />} />
            <Route path="/auth/complete-signup" element={<CompleteSignup />} />
            
            {/* Authenticated routes */}
            <Route path="/dashboard" element={<AppLayout><UnifiedDashboard /></AppLayout>} />
            <Route path="/vendas/cadastros" element={<AppLayout><VendasCadastros /></AppLayout>} />
            <Route path="/vendas/vendedores" element={<AppLayout><Vendedores /></AppLayout>} />
            <Route path="/vendas/representantes" element={<AppLayout><RepresentantesComerciais /></AppLayout>} />
            <Route path="/vendas/grupos-economicos" element={<AppLayout><EconomicGroupsPage /></AppLayout>} />
            <Route path="/vendas/*" element={<AppLayout><SalesPage /></AppLayout>} />
            <Route path="/sales/*" element={<AppLayout><SalesPage /></AppLayout>} />
                
                {/* Gestão de Tarefas */}
                <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
                <Route path="/tasks/new" element={<TaskEditorFullscreen />} />
                <Route path="/formularios" element={<AppLayout><Forms /></AppLayout>} />
                <Route path="/formularios/builder" element={<AppLayout><FormBuilderFullScreen /></AppLayout>} />
                <Route path="/formularios/:id/editar" element={<AppLayout><FormBuilderFullScreen /></AppLayout>} />
                <Route path="/formularios/:id/fill" element={<AppLayout><InternalFormFill /></AppLayout>} />
                <Route path="/formulario/publico/:token" element={<FormPublicFill />} />
                <Route path="/automacoes" element={<AppLayout><Automacoes /></AppLayout>} />
                
                {/* Gestão */}
                <Route path="/usuarios" element={<AppLayout><Users /></AppLayout>} />
                <Route path="/usuarios/:id" element={<AppLayout><UserDetail /></AppLayout>} />
                <Route path="/usuarios/:id/editar" element={<AppLayout><UserEdit /></AppLayout>} />
                <Route path="/usuarios/:id/edit" element={<AppLayout><UserEdit /></AppLayout>} />
                <Route path="/departamentos" element={<AppLayout><Departments /></AppLayout>} />
                <Route path="/portais" element={<AppLayout><Portais /></AppLayout>} />
                <Route path="/portais/novo" element={<AppLayout><PortalCreate /></AppLayout>} />
                <Route path="/registros-compartilhados" element={<AppLayout><RegistrosCompartilhados /></AppLayout>} />
                <Route path="/gestao/documentos" element={<DocumentManagement />} />
                <Route path="/gestao/documentos/importar" element={<DocumentImport />} />
                
                <Route path="/gestao/contatos" element={<AppLayout><ContactsList /></AppLayout>} />
                <Route path="/gestao/contatos/novo" element={<AppLayout><ContactForm /></AppLayout>} />
                <Route path="/gestao/contatos/:id/edit" element={<AppLayout><ContactForm /></AppLayout>} />
                <Route path="/gestao/contatos/entidades" element={<AppLayout><ContactEntities /></AppLayout>} />
                
                {/* Chatter */}
                <Route path="/chatter/:recordType/:recordId" element={<ChatterFullScreen />} />
                
                <Route path="/gestao/site/produtos" element={<AppLayout><SiteData /></AppLayout>} />
                <Route path="/gestao/site/politica-privacidade" element={<AppLayout><SitePrivacyPolicy /></AppLayout>} />
                
                {/* Logística */}
                <Route path="/logistica/transportadoras" element={<AppLayout><Transportadoras /></AppLayout>} />
                <Route path="/logistica/cidades" element={<AppLayout><Cidades /></AppLayout>} />
                
                {/* Compras */}
                <Route path="/compras/cadastros" element={<AppLayout><ComprasCadastros /></AppLayout>} />
                <Route path="/compras/compradores" element={<AppLayout><Compradores /></AppLayout>} />
                <Route path="/compras/representantes" element={<AppLayout><RepresentantesComerciaisCompras /></AppLayout>} />
                <Route path="/compras/potenciais-fornecedores" element={<AppLayout><PotentialSuppliers /></AppLayout>} />
                <Route path="/compras/fornecedores-unificados" element={<AppLayout><UnifiedSuppliersPage /></AppLayout>} />
                <Route path="/compras/grupos-economicos" element={<AppLayout><SupplierEconomicGroupsPage /></AppLayout>} />
                <Route path="/compras/tipos-de-materiais" element={<AppLayout><MaterialTypesPage /></AppLayout>} />
                
                {/* RH */}
                <Route path="/rh/funcionarios" element={<AppLayout><Employees /></AppLayout>} />
                <Route path="/rh/organograma" element={<AppLayout><Organogram /></AppLayout>} />
                
                {/* Protheus */}
                <Route path="/protheus/configuracoes" element={<AppLayout><ProtheusConfig /></AppLayout>} />
                <Route path="/protheus/tabelas" element={<AppLayout><TabelasProtheus /></AppLayout>} />
                <Route path="/protheus/tabelas/:tableId/registros" element={<AppLayout><ProtheusTableRecords /></AppLayout>} />
                <Route path="/test-notifications" element={<AppLayout><TestNotifications /></AppLayout>} />
                
                {/* IA */}
                <Route path="/ia/conversas" element={<AppLayout><ConversasPage /></AppLayout>} />
                <Route path="/ia/conversa/:conversationId" element={<AppLayout><ConversationView /></AppLayout>} />
                <Route path="/ia/conversa-protheus/:conversationId" element={<ProtheusConversationPage />} />
                
                {/* Aliases para compatibilidade */}
                <Route path="/departments" element={<AppLayout><Departments /></AppLayout>} />
                <Route path="/transportadoras" element={<Navigate to="/logistica/transportadoras" replace />} />
                <Route path="/cidades" element={<Navigate to="/logistica/cidades" replace />} />
            
            {/* Public routes */}
            <Route path="/solicitar-acesso" element={<SolicitarAcesso />} />
            
            {/* Public site routes - only under /site */}
            <Route path="/site/:section/:lang" element={<SitePageRouter />} />
            <Route path="/site/:section" element={<SitePageRouter />} />
            <Route path="/site" element={<SitePageRouter />} />
            
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Catch-all para rotas não encontradas na área autenticada */}
            <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
