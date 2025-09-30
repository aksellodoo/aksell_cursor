import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMaterialTypes, type MaterialType, type BuyerQueueItem } from '@/hooks/useMaterialTypes';
import { useToast } from '@/hooks/use-toast';
import { BuyerSelector } from './BuyerSelector';
import { BuyerQueueEditor } from './BuyerQueueEditor';
import { type Buyer, useBuyers } from '@/hooks/useBuyers';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
});

type FormData = z.infer<typeof formSchema>;

interface EditMaterialTypeFormProps {
  materialType: MaterialType;
  onSuccess: () => void;
}

export function EditMaterialTypeForm({ materialType, onSuccess }: EditMaterialTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designatedBuyer, setDesignatedBuyer] = useState<Buyer | null>(null);
  const [buyerQueue, setBuyerQueue] = useState<BuyerQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const { updateMaterialType } = useMaterialTypes();
  const { listQuery: buyersQuery } = useBuyers();
  const { toast } = useToast();

  const buyers = buyersQuery.data || [];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: materialType.name,
      color: materialType.color,
    },
  });

  // Load initial designated buyer and queue
  useEffect(() => {
    const loadInitialData = async () => {
      // Find designated buyer
      if (materialType.designated_buyer_code && materialType.designated_buyer_filial) {
        const buyer = buyers.find(({ buyer }) => 
          buyer.y1_cod === materialType.designated_buyer_code && 
          buyer.y1_filial === materialType.designated_buyer_filial
        )?.buyer;
        
        if (buyer) {
          setDesignatedBuyer(buyer);
        }
      }

      // Load buyer queue
      try {
        const { data: queueData, error } = await supabase
          .from('purchases_material_type_buyer_queue')
          .select('buyer_code, buyer_filial, order_index')
          .eq('material_type_id', materialType.id)
          .order('order_index');

        if (error) throw error;
        
        setBuyerQueue(queueData || []);
      } catch (error) {
        console.error('Error loading buyer queue:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar fila de compradores",
          variant: "destructive",
        });
      } finally {
        setIsLoadingQueue(false);
      }
    };

    if (buyers.length > 0) {
      loadInitialData();
    }
  }, [materialType, buyers, toast]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Update material type
      await updateMaterialType(materialType.id, {
        name: data.name,
        color: data.color,
        designated_buyer_code: designatedBuyer?.y1_cod,
        designated_buyer_filial: designatedBuyer?.y1_filial,
      });

      // Update buyer queue - delete existing and insert new
      const { error: deleteError } = await supabase
        .from('purchases_material_type_buyer_queue')
        .delete()
        .eq('material_type_id', materialType.id);

      if (deleteError) throw deleteError;

      if (buyerQueue.length > 0) {
        const queueItems = buyerQueue.map(item => ({
          material_type_id: materialType.id,
          buyer_code: item.buyer_code,
          buyer_filial: item.buyer_filial,
          order_index: item.order_index,
        }));

        const { error: insertError } = await supabase
          .from('purchases_material_type_buyer_queue')
          .insert(queueItems);

        if (insertError) throw insertError;
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error updating material type:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar tipo de material",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingQueue) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Tipo de Material/Serviço</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Matéria Prima, Serviço de Consultoria..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input
                    type="color"
                    className="w-16 h-10 p-1 border rounded cursor-pointer"
                    {...field}
                  />
                </FormControl>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: field.value }}
                  />
                  <span className="text-sm text-muted-foreground">{field.value}</span>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Comprador Designado</Label>
            <div className="mt-2">
              <BuyerSelector
                value={designatedBuyer?.y1_cod}
                onSelect={setDesignatedBuyer}
                placeholder="Selecionar comprador designado..."
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comprador principal responsável por este tipo de material/serviço
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Ordem de Compradores</Label>
            <div className="mt-2">
              <BuyerQueueEditor
                queue={buyerQueue}
                onChange={setBuyerQueue}
                excludeBuyerCode={designatedBuyer?.y1_cod}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fila de compradores que podem assumir caso o designado não esteja disponível
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}