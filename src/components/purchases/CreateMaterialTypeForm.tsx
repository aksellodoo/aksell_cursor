import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateColorFromName } from '@/utils/colorUtils';
import { useMaterialTypes } from '@/hooks/useMaterialTypes';
import { useToast } from '@/hooks/use-toast';
import { BuyerSelector } from './BuyerSelector';
import { BuyerQueueEditor, type BuyerQueueItem } from './BuyerQueueEditor';
import { type Buyer } from '@/hooks/useBuyers';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal'),
});

type FormData = z.infer<typeof formSchema>;

interface ExtendedCreateData {
  name: string;
  color: string;
  designated_buyer_code?: string;
  designated_buyer_filial?: string;
  buyer_queue: BuyerQueueItem[];
}

interface CreateMaterialTypeFormProps {
  onSuccess: () => void;
}

export function CreateMaterialTypeForm({ onSuccess }: CreateMaterialTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [designatedBuyer, setDesignatedBuyer] = useState<Buyer | null>(null);
  const [buyerQueue, setBuyerQueue] = useState<BuyerQueueItem[]>([]);
  const { createMaterialType } = useMaterialTypes();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: '#3B82F6', // Default blue color
    },
  });

  const watchedName = form.watch('name');

  // Auto-generate color when name changes
  const handleNameChange = (name: string) => {
    if (name.trim()) {
      const generatedColor = generateColorFromName(name);
      form.setValue('color', generatedColor);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const extendedData: ExtendedCreateData = {
        name: data.name,
        color: data.color,
        designated_buyer_code: designatedBuyer?.y1_cod,
        designated_buyer_filial: designatedBuyer?.y1_filial,
        buyer_queue: buyerQueue
      };
      
      await createMaterialType(extendedData);
      onSuccess();
    } catch (error) {
      console.error('Error creating material type:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar tipo de material",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange(e.target.value);
                  }}
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
            {isSubmitting ? 'Criando...' : 'Criar Tipo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}