import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ProtheusManualSyncButton = () => {
  const [loading, setLoading] = useState(false);

  const handleManualSync = async () => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando sincronização manual...');
      
      const { data, error } = await supabase.functions.invoke('process-protheus-sync-scheduler', {
        body: { 
          triggered_by: 'manual_execution',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('❌ Erro na sincronização:', error);
        toast.error('Erro ao executar sincronização automática');
        return;
      }

      console.log('✅ Sincronização iniciada:', data);
      toast.success('Sincronização automática executada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao executar sincronização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleManualSync}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      Executar Agora
    </Button>
  );
};