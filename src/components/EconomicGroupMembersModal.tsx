
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Search, X, Plus, Trash2 } from 'lucide-react';
import { useCustomerEconomicGroups, EconomicGroup, EconomicGroupMember, CustomerSearchResult } from '@/hooks/useCustomerEconomicGroups';

interface EconomicGroupMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: EconomicGroup | null;
  tableId: string;
}

export const EconomicGroupMembersModal: React.FC<EconomicGroupMembersModalProps> = ({
  open,
  onOpenChange,
  group,
  tableId
}) => {
  const {
    getGroupMembers,
    addGroupMember,
    removeGroupMember,
    searchCustomers
  } = useCustomerEconomicGroups(tableId);

  const [members, setMembers] = useState<EconomicGroupMember[]>([]);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open && group) {
      loadMembers();
    }
  }, [open, group]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadMembers = async () => {
    if (!group) return;
    
    setLoading(true);
    try {
      const data = await getGroupMembers(group.id);
      setMembers(data);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchCustomers(searchTerm);
      setSearchResults(results);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (customer: CustomerSearchResult) => {
    if (!group) return;
    
    await addGroupMember(group.id, customer.filial, customer.cod);
    await loadMembers();
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveMember = async (member: EconomicGroupMember) => {
    if (!group) return;
    
    await removeGroupMember(group.id, member.filial, member.cod);
    await loadMembers();
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Grupo {group.cod} - {group.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {group.member_count} cliente(s) • {group.unit_count} unidade(s)
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adicionar Cliente</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por código, nome ou nome reduzido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupo Atual</TableHead>
                      <TableHead className="w-[80px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((customer) => (
                      <TableRow key={`${customer.filial}-${customer.cod}`}>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {customer.filial}-{customer.cod}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.short_name || customer.nome}</div>
                            {customer.short_name && customer.short_name !== customer.nome && (
                              <div className="text-sm text-muted-foreground">{customer.nome}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.current_group_number ? (
                            <Badge variant="secondary">
                              Grupo #{customer.current_group_number}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem grupo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(customer)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Membros Atuais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Membros do Grupo</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Carregando membros..." />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Este grupo não possui membros ainda. A funcionalidade completa será implementada em breve.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Vendedores</TableHead>
                      <TableHead className="w-[80px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={`${member.filial}-${member.cod}`}>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {member.filial}-{member.cod}
                          </span>
                        </TableCell>
                        <TableCell>{member.display_name}</TableCell>
                        <TableCell>{member.unit_count}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.vendors.map((vendor) => (
                              <Badge key={vendor} variant="outline" className="text-xs">
                                {vendor}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
