import { useState } from 'react';
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerSelector } from './BuyerSelector';
import { useBuyers, type Buyer } from '@/hooks/useBuyers';

export interface BuyerQueueItem {
  buyer_code: string;
  buyer_filial: string;
  order_index: number;
}

interface BuyerQueueEditorProps {
  queue: BuyerQueueItem[];
  onChange: (queue: BuyerQueueItem[]) => void;
  excludeBuyerCode?: string; // Excluir comprador designado da lista
}

export function BuyerQueueEditor({ queue, onChange, excludeBuyerCode }: BuyerQueueEditorProps) {
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const { listQuery } = useBuyers();
  
  const buyers = listQuery.data || [];

  const addBuyerToQueue = () => {
    if (!selectedBuyer) return;
    
    // Verificar se o comprador já está na fila
    const alreadyInQueue = queue.some(
      item => item.buyer_code === selectedBuyer.y1_cod && item.buyer_filial === selectedBuyer.y1_filial
    );
    
    if (alreadyInQueue) return;
    
    const newItem: BuyerQueueItem = {
      buyer_code: selectedBuyer.y1_cod,
      buyer_filial: selectedBuyer.y1_filial,
      order_index: queue.length
    };
    
    onChange([...queue, newItem]);
    setSelectedBuyer(null);
  };

  const removeBuyerFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    // Reindexar
    const reindexedQueue = newQueue.map((item, i) => ({
      ...item,
      order_index: i
    }));
    onChange(reindexedQueue);
  };

  const moveBuyer = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === queue.length - 1)
    ) {
      return;
    }

    const newQueue = [...queue];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Trocar posições
    [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];
    
    // Reindexar
    const reindexedQueue = newQueue.map((item, i) => ({
      ...item,
      order_index: i
    }));
    
    onChange(reindexedQueue);
  };

  const getBuyerName = (buyerCode: string, buyerFilial: string) => {
    const buyer = buyers.find(({ buyer }) => 
      buyer.y1_cod === buyerCode && buyer.y1_filial === buyerFilial
    )?.buyer;
    return buyer ? `${buyer.y1_nome} (${buyerCode}/${buyerFilial})` : `${buyerCode}/${buyerFilial}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <BuyerSelector
            value={selectedBuyer?.y1_cod}
            onSelect={(buyer) => {
              // Filtrar comprador designado e já existentes na fila
              if (!buyer) {
                setSelectedBuyer(null);
                return;
              }
              
              if (buyer.y1_cod === excludeBuyerCode) return;
              
              const alreadyInQueue = queue.some(
                item => item.buyer_code === buyer.y1_cod && item.buyer_filial === buyer.y1_filial
              );
              
              if (!alreadyInQueue) {
                setSelectedBuyer(buyer);
              }
            }}
            placeholder="Adicionar comprador à fila..."
          />
        </div>
        <Button 
          type="button"
          onClick={addBuyerToQueue}
          disabled={!selectedBuyer}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Nenhum comprador na fila de espera
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-medium">Fila de Compradores ({queue.length})</div>
          {queue.map((item, index) => (
            <Card key={`${item.buyer_code}-${item.buyer_filial}`} className="border">
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBuyer(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBuyer(index, 'down')}
                    disabled={index === queue.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                
                <div className="flex-1 flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm">{getBuyerName(item.buyer_code, item.buyer_filial)}</span>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => removeBuyerFromQueue(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}