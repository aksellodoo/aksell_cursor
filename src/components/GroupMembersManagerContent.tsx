import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Users, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { GroupMembersTable } from "./GroupMembersTable";
import { 
  useCustomerGroupsWithId, 
  type UnifiedGroupMember, 
  type UnifiedSearchResult 
} from "@/hooks/useCustomerGroupsWithId";

interface GroupMembersManagerContentProps {
  groupId: number;
  groupName: string;
  onClose: () => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'customer':
      return 'default'; // Verde
    case 'lead_only':
      return 'secondary'; // Azul
    case 'prospect':
      return 'outline'; // Amarelo
    default:
      return 'destructive'; // Vermelho para inactive
  }
};

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

export function GroupMembersManagerContent({ 
  groupId, 
  groupName, 
  onClose 
}: GroupMembersManagerContentProps) {
  const [members, setMembers] = useState<UnifiedGroupMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const MIN_CHARS = 3;
  const { toast } = useToast();

  const {
    getGroupMembers,
    searchCustomers,
    addMemberToGroup,
    removeMemberFromGroup,
    loading
  } = useCustomerGroupsWithId();

  const loadGroupData = async () => {
    try {
      const membersData = await getGroupMembers(groupId);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível carregar os membros do grupo",
        variant: "destructive"
      });
      setMembers([]);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const handleSearch = async () => {
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < MIN_CHARS) {
      toast({
        title: "Busca inválida",
        description: `Digite pelo menos ${MIN_CHARS} caracteres para buscar`,
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    console.debug("Iniciando busca por:", trimmedTerm);
    
    try {
      const results = await searchCustomers(trimmedTerm);
      console.debug("Resultados da busca:", results);
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({
        title: "Erro na busca",
        description: "Erro ao buscar clientes",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddMember = async (customer: UnifiedSearchResult) => {
    try {
      await addMemberToGroup(groupId, customer.unified_id);
      await loadGroupData();
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    }
  };

  const handleRemoveMember = async (member: UnifiedGroupMember) => {
    try {
      const result = await removeMemberFromGroup(groupId, member.unified_id);
      if (result.success && result.data?.group_deleted) {
        onClose();
      } else {
        await loadGroupData();
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Gerenciar Membros do Grupo</h2>
        <p className="text-sm text-muted-foreground">{groupName}</p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search">Buscar clientes unificados</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
              placeholder="Digite nome, CNPJ ou código..."
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || searchTerm.trim().length < MIN_CHARS}
            className="mt-6"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </>
            )}
          </Button>
          {(searchTerm || searchResults.length > 0) && (
            <Button
              variant="outline"
              onClick={handleClearSearch}
              disabled={isSearching}
              className="mt-6"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
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
                    <Button 
                      size="sm" 
                      onClick={() => handleAddMember(customer)}
                      disabled={members.some(m => m.unified_id === customer.unified_id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {members.some(m => m.unified_id === customer.unified_id) ? "Já no grupo" : "Adicionar"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Estado vazio após busca */}
        {hasSearched && searchResults.length === 0 && !isSearching && (
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum resultado encontrado para "{searchTerm}"</p>
            <p className="text-sm mt-1">Tente buscar por nome ou CNPJ</p>
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

        <GroupMembersTable 
          members={members}
          onRemoveMember={handleRemoveMember}
          loading={loading}
        />
      </div>
    </div>
  );
}
