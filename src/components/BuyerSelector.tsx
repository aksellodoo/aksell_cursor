import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { useBuyers } from "@/hooks/useBuyers";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface BuyerSelectorProps {
  codeName: string;
  filialName: string;
  label?: string;
  placeholder?: string;
}

export function BuyerSelector({ 
  codeName, 
  filialName, 
  label = "Comprador Designado",
  placeholder = "Selecione um comprador"
}: BuyerSelectorProps) {
  const form = useFormContext();
  const { user } = useAuth();
  const { listQuery, getSuggestedBuyerForUser } = useBuyers();

  // Auto-select buyer if user has a linked buyer
  useEffect(() => {
    if (user && listQuery.data && !form.getValues(codeName)) {
      const suggestedBuyer = getSuggestedBuyerForUser(user.id);
      if (suggestedBuyer) {
        form.setValue(codeName, suggestedBuyer.y1_cod);
        form.setValue(filialName, suggestedBuyer.y1_filial);
      }
    }
  }, [user, listQuery.data, getSuggestedBuyerForUser, form, codeName, filialName]);

  if (listQuery.isLoading) {
    return (
      <FormField
        control={form.control}
        name={codeName}
        render={() => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Carregando compradores..." />
                </SelectTrigger>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  const buyers = listQuery.data || [];

  return (
    <FormField
      control={form.control}
      name={codeName}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select 
              value={field.value || ""} 
              onValueChange={(value) => {
                if (value === "__clear__") {
                  field.onChange("");
                  form.setValue(filialName, "");
                } else {
                  const selectedBuyer = buyers.find(b => b.buyer.y1_cod === value)?.buyer;
                  if (selectedBuyer) {
                    field.onChange(value);
                    form.setValue(filialName, selectedBuyer.y1_filial);
                  } else {
                    field.onChange("");
                    form.setValue(filialName, "");
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__clear__">
                  <span className="text-muted-foreground">Sem comprador</span>
                </SelectItem>
                {buyers.map(({ buyer }) => (
                  <SelectItem key={`${buyer.y1_filial}-${buyer.y1_cod}`} value={buyer.y1_cod}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {buyer.y1_nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Código: {buyer.y1_cod} | Filial: {buyer.y1_filial}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}