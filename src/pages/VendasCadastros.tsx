
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CustomFullscreenModal } from '@/components/ui/custom-fullscreen-modal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Users, Building2, FileText, TrendingUp, X } from 'lucide-react';

// Import existing components
import UnifiedAccounts from '@/components/sales/UnifiedAccounts';
import { ClientesDetalhado } from '@/components/sales/ClientesDetalhado';
import { SalesLeads } from '@/components/sales/SalesLeads';
import { useProtheusClientGroups } from '@/hooks/useProtheusClientGroups';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { useVendors } from '@/hooks/useVendors';
import { PROTHEUS_TABLES } from '@/lib/config';

// Content Components

interface ClientesContentProps {
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
  showMissingOnly: boolean;
}

const ClientesContent = ({ activeSubTab, onSubTabChange, showMissingOnly }: ClientesContentProps) => {
  return (
    <Tabs value={activeSubTab || 'detalhado'} onValueChange={onSubTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="detalhado" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Clientes Protheus</span>
        </TabsTrigger>
        <TabsTrigger value="leads" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Leads</span>
        </TabsTrigger>
        <TabsTrigger value="unificado" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Clientes Unificados</span>
        </TabsTrigger>
      </TabsList>


      <TabsContent value="detalhado" className="space-y-4">
        <ClientesDetalhado />
      </TabsContent>

      <TabsContent value="leads" className="space-y-4">
        <SalesLeads />
      </TabsContent>

      <TabsContent value="unificado" className="space-y-4">
        <UnifiedAccounts showMissingOnly={showMissingOnly} />
      </TabsContent>
    </Tabs>
  );
};

const VendasCadastros = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeSubTab = searchParams.get('subtab') || '';
  const showMissingOnly = searchParams.get('missing') === '1';

  const handleSubTabChange = (value: string) => {
    setSearchParams({ subtab: value });
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <CustomFullscreenModal isOpen={true} onClose={handleClose} className="bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-10 w-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <ClientesContent 
          activeSubTab={activeSubTab || 'detalhado'} 
          onSubTabChange={handleSubTabChange}
          showMissingOnly={showMissingOnly}
        />
      </div>
    </CustomFullscreenModal>
  );
};

export default VendasCadastros;
