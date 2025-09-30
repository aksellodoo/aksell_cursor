import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMissingSuppliers, type MissingSupplier } from '@/hooks/useMissingSuppliers';

interface MissingSuppliersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MissingSuppliersModal({ open, onOpenChange }: MissingSuppliersModalProps) {
  const { missingSuppliers, loading, error } = useMissingSuppliers();

  // Helper para formatar CNPJ
  const formatCnpj = (cnpj: string | undefined) => {
    if (!cnpj) return '—';
    const digits = cnpj.replace(/[^0-9]/g, '');
    if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  };

  const getSourceBadge = (source: string) => {
    return source === 'protheus' ? (
      <Badge variant="secondary">Protheus</Badge>
    ) : (
      <Badge variant="outline">Potencial</Badge>
    );
  };

  const getProtheusKey = (supplier: MissingSupplier) => {
    if (supplier.source === 'protheus' && supplier.protheus_filial && supplier.protheus_cod && supplier.protheus_loja) {
      return `${supplier.protheus_filial}/${supplier.protheus_cod}/${supplier.protheus_loja}`;
    }
    return '—';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fornecedores Faltantes</DialogTitle>
          <DialogDescription>
            Lista de fornecedores Protheus e potenciais que ainda não foram criados como fornecedores unificados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : missingSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor faltante encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Protheus (Filial/Cod/Loja)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingSuppliers.map((supplier, index) => (
                  <TableRow key={`${supplier.source}-${supplier.potential_id || supplier.protheus_filial}-${supplier.protheus_cod}-${supplier.protheus_loja}-${index}`}>
                    <TableCell>
                      {getSourceBadge(supplier.source)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {supplier.trade_name || '—'}
                    </TableCell>
                    <TableCell>
                      {supplier.legal_name || '—'}
                    </TableCell>
                    <TableCell>
                      {formatCnpj(supplier.cnpj)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getProtheusKey(supplier)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        {!loading && !error && missingSuppliers.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Total: {missingSuppliers.length} fornecedor{missingSuppliers.length !== 1 ? 'es' : ''} faltante{missingSuppliers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}