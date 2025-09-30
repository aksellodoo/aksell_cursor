
import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Search, TrendingUp, Edit, Trash2, MapPin, Building, Calendar, User, Hash } from 'lucide-react';
import { LeadCreateFullscreen } from './LeadCreateFullscreen';
import { toast } from 'sonner';
import { Lead } from '@/hooks/useLeads';

// Format CNPJ function
const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return cnpj;
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const SalesLeads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  const { leads, loading, deleteLead, fetchLeads } = useLeads();

  const filteredLeads = leads.filter(lead =>
    lead.trade_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lead_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.segments?.some(segment => 
      segment.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditOpen(true);
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o lead "${leadName}"?`)) {
      return;
    }

    try {
      await deleteLead(leadId);
      toast.success('Lead excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir lead');
    }
  };

  const getSourceChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      'digital_marketing': 'Marketing Digital',
      'referral': 'Indicação',
      'direct_contact': 'Contato Direto',
      'event': 'Evento',
      'other': 'Outro'
    };
    return labels[channel] || channel;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'qualified': return 'outline';
      case 'proposal': return 'default';
      case 'negotiation': return 'secondary';
      case 'won': return 'default';
      case 'lost': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'new': 'Novo',
      'contacted': 'Contatado',
      'qualified': 'Qualificado',
      'proposal': 'Proposta',
      'negotiation': 'Negociação',
      'won': 'Ganho',
      'lost': 'Perdido'
    };
    return labels[status] || status;
  };


  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads por ID (LE-1), nome fantasia, razão social, CNPJ ou segmento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Leads Table */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando leads...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  {searchTerm ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca.' 
                    : 'Comece criando seu primeiro lead de vendas.'
                  }
                </p>
              </div>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Lead
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Código
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Empresa
                    </div>
                  </TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Localização
                    </div>
                  </TableHead>
                  <TableHead>Segmentos</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Origem
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Criado em
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-mono text-sm">{lead.lead_code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{lead.trade_name}</div>
                        {lead.legal_name && lead.legal_name !== lead.trade_name && (
                          <div className="text-sm text-muted-foreground">{lead.legal_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.cnpj && (
                        <span className="font-mono text-sm">{formatCNPJ(lead.cnpj)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.city?.name && (
                        <span className="text-sm">{lead.city.name}, {lead.city.uf}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.segments && lead.segments.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.segments.slice(0, 2).map((segment, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {segment.name}
                            </Badge>
                          ))}
                          {lead.segments.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{lead.segments.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getSourceChannelLabel(lead.source_channel)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 w-8 p-0"
                           onClick={() => handleEditLead(lead)}
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteLead(lead.id, lead.trade_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Fullscreen */}
      <LeadCreateFullscreen
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={() => {
          fetchLeads();
          setIsCreateOpen(false);
        }}
      />

      {/* Edit Fullscreen */}
      <LeadCreateFullscreen
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        leadData={editingLead}
        onSave={() => {
          fetchLeads();
          setIsEditOpen(false);
          setEditingLead(null);
        }}
      />
    </div>
  );
};
