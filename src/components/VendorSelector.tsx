
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useVendors, Vendor } from '@/hooks/useVendors';
import { Loader2 } from 'lucide-react';

interface VendorSelectorProps {
  value?: string; // formato: "cod|filial"
  onValueChange: (vendor: Vendor | undefined) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showLabel?: boolean;
}

export const VendorSelector = ({
  value,
  onValueChange,
  label = "Vendedor",
  placeholder = "Selecione um vendedor...",
  required = false,
  showLabel = true
}: VendorSelectorProps) => {
  const { listQuery } = useVendors();

  const handleChange = (selectedValue: string) => {
    if (!selectedValue || selectedValue === "__clear__") {
      onValueChange(undefined);
      return;
    }

    const [cod, filial] = selectedValue.split('|');
    const vendor = listQuery.data?.find(v => 
      v.vendor.a3_cod === cod && v.vendor.a3_filial === filial
    )?.vendor;
    
    onValueChange(vendor);
  };

  if (listQuery.isLoading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label className="text-sm font-medium">
            {label} {required && '*'}
          </Label>
        )}
        <div className="flex items-center gap-2 p-2 border rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Carregando vendedores...</span>
        </div>
      </div>
    );
  }

  if (listQuery.error) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <Label className="text-sm font-medium">
            {label} {required && '*'}
          </Label>
        )}
        <div className="p-2 border border-red-200 rounded-md">
          <span className="text-sm text-red-600">Erro ao carregar vendedores</span>
        </div>
      </div>
    );
  }

  const vendors = listQuery.data || [];

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label className="text-sm font-medium">
          {label} {required && '*'}
        </Label>
      )}
      <Select value={value || ""} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <SelectItem value="__clear__">Nenhum vendedor selecionado</SelectItem>
          {vendors.map(({ vendor }) => (
            <SelectItem 
              key={`${vendor.a3_cod}|${vendor.a3_filial}`}
              value={`${vendor.a3_cod}|${vendor.a3_filial}`}
            >
              <div className="flex flex-col">
                <span className="font-medium">{vendor.a3_nome}</span>
                <span className="text-xs text-muted-foreground">
                  Cód: {vendor.a3_cod} | Filial: {vendor.a3_filial}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {vendors.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum vendedor encontrado
        </p>
      )}
    </div>
  );
};
