
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Search, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  useCustomerGroupsWithId, 
  type CustomerGroupWithId 
} from "@/hooks/useCustomerGroupsWithId";
import { type UnifiedGroupMember, type UnifiedSearchResult } from "@/types/unifiedGroupTypes";

interface CustomerGroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: CustomerGroupWithId | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'customer':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'lead_only':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'prospect':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'customer':
      return 'Cliente';
    case 'lead_only':
      return 'Lead';
    case 'prospect':
      return 'Prospect';
    case 'inactive':
      return 'Inativo';
    default:
      return 'Desconhecido';
  }
};

export function CustomerGroupMembersModal({ isOpen, onClose, group }: CustomerGroupMembersModalProps) {
  const [members, setMembers] = useState<UnifiedGroupMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    getGroupMembers,
    searchCustomers,
    addMemberToGroup,
    removeMemberFromGroup,
    loading
  } = useCustomerGroupsWithId();

  const loadGroupData = async () => {
    if (!group) return;
    
    try {
      const membersData = await getGroupMembers(group.id_grupo);
      setMembers(membersData);
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
    }
  };

  useEffect(() => {
    if (isOpen && group) {
      loadGroupData();
    }
  }, [isOpen, group?.id_grupo]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setIsSearching(true);
      try {
        const results = await searchCustomers(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleAddMember = async (customer: UnifiedSearchResult) => {
    if (!group) return;
    
    try {
      await addMemberToGroup(group.id_grupo, customer.unified_id);
      await loadGroupData();
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    }
  };

  const handleRemoveMember = async (member: UnifiedGroupMember) => {
    if (!group) return;
    
    try {
      const result = await removeMemberFromGroup(group.id_grupo, member.unified_id);
      if (result.success && result.data?.group_deleted) {
        onClose();
      } else {
        await loadGroupData();
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gerenciar Membros do Grupo: {group.nome_grupo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-auto">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search">Buscar clientes unificados</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite nome, CNPJ ou código..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchTerm.trim()}
                className="mt-6"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Resultados da Busca</h3>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Clientes Unificados ({searchResults.length})
                  </h4>
                  <div className="space-y-2">
                    {searchResults.map((customer) => (
                      <div key={customer.unified_id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{customer.display_name}</p>
                            <Badge className={getStatusColor(customer.unified_status)}>
                              {getStatusLabel(customer.unified_status)}
                            </Badge>
                          </div>
                          {customer.protheus_filial && (
                            <p className="text-sm text-muted-foreground">
                              Protheus: {customer.protheus_filial}-{customer.protheus_cod}-{customer.protheus_loja}
                            </p>
                          )}
                          {customer.vendor_name && (
                            <p className="text-sm text-muted-foreground">
                              Vendedor: {customer.vendor_name}
                            </p>
                          )}
                          {customer.current_group_name && (
                            <Badge variant="outline" className="text-xs">
                              Grupo atual: {customer.current_group_name}
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleAddMember(customer)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Current Members */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Membros Atuais ({members.length})
            </h3>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.unified_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{member.display_name}</p>
                          <Badge className={getStatusColor(member.unified_status)}>
                            {getStatusLabel(member.unified_status)}
                          </Badge>
                        </div>
                        {member.short_name && member.short_name !== member.display_name && (
                          <p className="text-sm text-muted-foreground">
                            Nome curto: {member.short_name}
                          </p>
                        )}
                        {member.protheus_filial && (
                          <p className="text-sm text-muted-foreground">
                            Protheus: {member.protheus_filial}-{member.protheus_cod}-{member.protheus_loja}
                          </p>
                        )}
                        {member.vendor_name && (
                          <p className="text-sm text-muted-foreground">
                            Vendedor: {member.vendor_name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum membro no grupo ainda.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
