
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { type UnifiedGroupMember } from "@/hooks/useCustomerGroupsWithId";
import { useState, useMemo } from "react";

interface GroupMembersTableProps {
  members: UnifiedGroupMember[];
  onRemoveMember: (member: UnifiedGroupMember) => void;
  loading: boolean;
}

type SortField = 'commercial_name' | 'unified_status' | 'protheus_cod' | 'vendor_name';
type SortDirection = 'asc' | 'desc' | null;

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

export function GroupMembersTable({ members, onRemoveMember, loading }: GroupMembersTableProps) {
  const [filters, setFilters] = useState({
    commercial_name: '',
    unified_status: '',
    protheus_cod: '',
    vendor_name: ''
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 ml-1" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4 ml-1" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-1" />;
  };

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      const commercialName = (member.commercial_name || member.display_name || '').toLowerCase();
      const legalName = (member.legal_name || '').toLowerCase();
      const clientFilter = filters.commercial_name.toLowerCase();
      const clientMatch = commercialName.includes(clientFilter) || legalName.includes(clientFilter);

      const statusMatch = getStatusLabel(member.unified_status).toLowerCase().includes(filters.unified_status.toLowerCase());
      
      const protheusCode = `${member.protheus_filial || ''}-${member.protheus_cod || ''}-${member.protheus_loja || ''}`;
      const protheusMatch = protheusCode.toLowerCase().includes(filters.protheus_cod.toLowerCase());
      
      const vendorMatch = (member.vendor_name || '').toLowerCase().includes(filters.vendor_name.toLowerCase());

      return clientMatch && statusMatch && protheusMatch && vendorMatch;
    });

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue = '';
        let bValue = '';

        switch (sortField) {
          case 'commercial_name':
            aValue = a.commercial_name || a.display_name || '';
            bValue = b.commercial_name || b.display_name || '';
            break;
          case 'unified_status':
            aValue = getStatusLabel(a.unified_status);
            bValue = getStatusLabel(b.unified_status);
            break;
          case 'protheus_cod':
            aValue = `${a.protheus_filial || ''}-${a.protheus_cod || ''}-${a.protheus_loja || ''}`;
            bValue = `${b.protheus_filial || ''}-${b.protheus_cod || ''}-${b.protheus_loja || ''}`;
            break;
          case 'vendor_name':
            aValue = a.vendor_name || '';
            bValue = b.vendor_name || '';
            break;
        }

        const comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [members, filters, sortField, sortDirection]);

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum membro no grupo ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Filtrar por cliente..."
          value={filters.commercial_name}
          onChange={(e) => setFilters(prev => ({ ...prev, commercial_name: e.target.value }))}
        />
        <Input
          placeholder="Filtrar por status..."
          value={filters.unified_status}
          onChange={(e) => setFilters(prev => ({ ...prev, unified_status: e.target.value }))}
        />
        <Input
          placeholder="Filtrar por Protheus..."
          value={filters.protheus_cod}
          onChange={(e) => setFilters(prev => ({ ...prev, protheus_cod: e.target.value }))}
        />
        <Input
          placeholder="Filtrar por vendedor..."
          value={filters.vendor_name}
          onChange={(e) => setFilters(prev => ({ ...prev, vendor_name: e.target.value }))}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('commercial_name')}
                >
                  Cliente
                  {getSortIcon('commercial_name')}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('unified_status')}
                >
                  Status
                  {getSortIcon('unified_status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('protheus_cod')}
                >
                  Protheus
                  {getSortIcon('protheus_cod')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('vendor_name')}
                >
                  Vendedor
                  {getSortIcon('vendor_name')}
                </Button>
              </TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedMembers.map((member) => (
            <TableRow key={member.unified_id} className="hover:bg-muted/50">
              <TableCell>
                <div className="py-1">
                  <p className="text-xs font-medium leading-tight">
                    {member.commercial_name || member.display_name}
                  </p>
                  {member.legal_name && member.legal_name !== member.commercial_name && (
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {member.legal_name}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Badge className={getStatusColor(member.unified_status)}>
                    {getStatusLabel(member.unified_status)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {member.protheus_filial ? (
                  <span className="font-mono text-sm">
                    {member.protheus_filial}-{member.protheus_cod}-{member.protheus_loja}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {member.vendor_name ? (
                  <span className="text-sm">{member.vendor_name}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(member)}
                  disabled={loading}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {filteredAndSortedMembers.length === 0 && members.length > 0 && (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum membro encontrado com os filtros aplicados.
      </div>
    )}
    </div>
  );
}
