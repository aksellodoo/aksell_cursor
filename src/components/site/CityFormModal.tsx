
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSiteCities, type SiteCity } from "@/hooks/useSiteCities";

// Função auxiliar para verificar se é cidade brasileira
const isBrazilianCity = (country: string) => {
  return ['brasil', 'brazil', 'br'].includes(country.toLowerCase().trim());
};

const citySchema = z.object({
  name: z.string().min(1, "Nome do município é obrigatório"),
  cod_munic: z.string().optional(),
  cod_uf: z.string().optional(),
  uf: z.string().min(1, "UF é obrigatório"),
  country: z.string().min(1, "País é obrigatório"),
  population_est: z.number().int().min(0, "População deve ser um número positivo").optional(),
  codigo_ibge: z.string().optional(),
  latitude: z.number().min(-90).max(90, "Latitude deve estar entre -90 e 90").optional(),
  longitude: z.number().min(-180).max(180, "Longitude deve estar entre -180 e 180").optional(),
  capital: z.number().min(0).max(1),
  siafi_id: z.string().optional(),
  ddd: z.string().optional(),
  fuso_horario: z.string().optional(),
  distance_km_to_indaiatuba: z.number().min(0, "Distância deve ser um número positivo").optional(),
  average_truck_travel_time_hours: z.number().min(0, "Tempo de viagem deve ser um número positivo").optional(),
}).refine((data) => {
  // Validação condicional para cidades brasileiras
  if (isBrazilianCity(data.country)) {
    if (!data.cod_munic || data.cod_munic.trim() === '') {
      return false;
    }
    if (!data.cod_uf || data.cod_uf.trim() === '') {
      return false;
    }
    if (!/^\d+$/.test(data.cod_munic)) {
      return false;
    }
    if (!/^\d+$/.test(data.cod_uf)) {
      return false;
    }
    if (!/^[A-Z]{2}$/.test(data.uf)) {
      return false;
    }
  }
  return true;
}, {
  message: "Para cidades do Brasil, Cód. Munic e Cód. UF são obrigatórios e devem conter apenas números. UF deve ter 2 letras maiúsculas.",
  path: ["cod_munic"] // Mostra erro no primeiro campo relevante
});

type CityFormData = z.infer<typeof citySchema>;

interface CityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city?: SiteCity;
}

export function CityFormModal({ open, onOpenChange, city }: CityFormModalProps) {
  const { createCity, updateCity, isCreating, isUpdating } = useSiteCities();
  const isEditing = !!city;

  const form = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: city?.name || "",
      cod_munic: city?.cod_munic || "",
      cod_uf: city?.cod_uf || "",
      uf: city?.uf || "",
      country: city?.country || "Brasil",
      codigo_ibge: city?.codigo_ibge || "",
      capital: city?.capital || 0,
      siafi_id: city?.siafi_id || "",
      ddd: city?.ddd || "",
      fuso_horario: city?.fuso_horario || "",
      distance_km_to_indaiatuba: city?.distance_km_to_indaiatuba || undefined,
      average_truck_travel_time_hours: city?.average_truck_travel_time_hours || undefined,
    },
  });

  // Observar mudanças no campo país para controlar visibilidade
  const countryValue = form.watch("country");
  const isBrazilian = isBrazilianCity(countryValue || "");

  // Reset form when city changes
  useState(() => {
    if (city) {
      form.reset({
        name: city.name,
        cod_munic: city.cod_munic,
        cod_uf: city.cod_uf,
        uf: city.uf,
        country: city.country || "Brasil",
        codigo_ibge: city.codigo_ibge || "",
        capital: city.capital || 0,
        siafi_id: city.siafi_id || "",
        ddd: city.ddd || "",
        fuso_horario: city.fuso_horario || "",
        distance_km_to_indaiatuba: city.distance_km_to_indaiatuba || undefined,
        average_truck_travel_time_hours: city.average_truck_travel_time_hours || undefined,
      });
    }
  });

  const onSubmit = async (data: CityFormData) => {
    try {
      // Ensure all required fields are present and properly typed
      const cityData: Omit<SiteCity, "id" | "created_at" | "updated_at" | "created_by"> = {
        name: data.name,
        cod_munic: data.cod_munic || null,
        cod_uf: data.cod_uf || null,
        uf: data.uf,
        country: data.country,
        codigo_ibge: data.codigo_ibge || undefined,
        capital: data.capital,
        siafi_id: data.siafi_id || undefined,
        ddd: data.ddd || undefined,
        fuso_horario: data.fuso_horario || undefined,
        population_est: data.population_est || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        distance_km_to_indaiatuba: data.distance_km_to_indaiatuba || undefined,
        average_truck_travel_time_hours: data.average_truck_travel_time_hours || undefined,
      };

      if (isEditing && city) {
        await updateCity({ id: city.id, ...cityData });
      } else {
        await createCity(cityData);
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving city:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cidade" : "Cadastrar Cidade"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome do Município</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Brasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF{isBrazilian ? " *" : ""}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={isBrazilian ? "Ex: SP" : "Ex: SP, CA, TX"}
                        maxLength={isBrazilian ? 2 : 10}
                        {...field}
                        onChange={(e) => field.onChange(isBrazilian ? e.target.value.toUpperCase() : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isBrazilian && (
                <>
                  <FormField
                    control={form.control}
                    name="cod_munic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cód. Munic *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 3550308" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cod_uf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cód. UF *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 35" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codigo_ibge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código IBGE Município</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 3550308" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siafi_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID no Siafi</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 7107" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ddd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DDD</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="capital"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>É Capital?</FormLabel>
                    <Select value={field.value?.toString() || "0"} onValueChange={(value) => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Não</SelectItem>
                        <SelectItem value="1">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="population_est"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimativa da População</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 12396372"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="Ex: -23.550520"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="Ex: -46.633309"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="distance_km_to_indaiatuba"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distância em Km até Indaiatuba</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 150.5"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="average_truck_travel_time_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo Médio de Viagem de Caminhão (horas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 8.5"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuso_horario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuso Horário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: America/Sao_Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating
                  ? isEditing ? "Atualizando..." : "Cadastrando..."
                  : isEditing ? "Atualizar" : "Cadastrar"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
