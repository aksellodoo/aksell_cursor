
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Building2, MapPin, Tag } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { LeadCreateModal } from '@/components/LeadCreateModal';
import { toast } from 'sonner';

const VendasCadastros = () => {
  const { leads, loading, deleteLead } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredLeads = leads.filter(lead =>
    lead.trade_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cnpj?.includes(searchTerm.replace(/\D/g, '')) ||
    lead.segments?.some(segment => 
      segment.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o lead "${leadName}"?`)) {
      const success = await deleteLead(leadId);
      if (success) {
        toast.success('Lead excluído com sucesso!');
      }
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p>Carregando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads de Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e prospects de vendas
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome fantasia, razão social, CNPJ ou segmento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {lead.trade_name}
                  </CardTitle>
                  {lead.legal_name && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Razão Social:</strong> {lead.legal_name}
                    </p>
                  )}
                  {lead.cnpj && (
                    <p className="text-sm text-muted-foreground">
                      <strong>CNPJ:</strong> {formatCNPJ(lead.cnpj)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Editar lead"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteLead(lead.id, lead.trade_name)}
                    title="Excluir lead"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Cidade */}
                {lead.city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{lead.city.name}/{lead.city.uf}</span>
                  </div>
                )}

                {/* Segmentos */}
                {lead.segments && lead.segments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Segmentos:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lead.segments.map((segment) => (
                        <Badge
                          key={segment.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {segment.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data de criação */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente ajustar os termos de busca'
                  : 'Comece criando seu primeiro lead de vendas'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Lead
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <LeadCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default VendasCadastros;
