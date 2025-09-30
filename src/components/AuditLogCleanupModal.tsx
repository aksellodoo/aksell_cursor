import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLogCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanup: (daysToKeep: number) => Promise<number>;
  currentCount: number;
}

const cleanupOptions = [
  { value: '90', label: 'Manter 90 dias', description: 'Remove registros anteriores a 3 meses' },
  { value: '180', label: 'Manter 180 dias', description: 'Remove registros anteriores a 6 meses' },
  { value: '365', label: 'Manter 1 ano', description: 'Remove registros anteriores a 1 ano' },
  { value: '0', label: 'Limpar tudo', description: 'Remove TODOS os registros de auditoria', dangerous: true }
];

export const AuditLogCleanupModal = ({ 
  isOpen, 
  onClose, 
  onCleanup, 
  currentCount 
}: AuditLogCleanupModalProps) => {
  const [selectedOption, setSelectedOption] = useState('90');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCleanup = async () => {
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      const deletedCount = await onCleanup(parseInt(selectedOption));
      
      toast({
        title: 'Limpeza concluída',
        description: `${deletedCount} registros de auditoria foram removidos.`
      });
      
      onClose();
      setIsConfirmed(false);
    } catch (error) {
      toast({
        title: 'Erro na limpeza',
        description: 'Ocorreu um erro ao limpar os registros de auditoria.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedOptionData = cleanupOptions.find(opt => opt.value === selectedOption);
  const isDangerous = selectedOptionData?.dangerous;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Limpar Log de Auditoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Atualmente há <Badge variant="secondary">{currentCount}</Badge> registros de auditoria no sistema.
            </AlertDescription>
          </Alert>

          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {cleanupOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1">
                  <Label 
                    htmlFor={option.value} 
                    className={`font-medium cursor-pointer ${option.dangerous ? 'text-destructive' : ''}`}
                  >
                    {option.label}
                    {option.dangerous && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        PERIGOSO
                      </Badge>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {isDangerous && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta ação é irreversível. Todos os registros de auditoria serão permanentemente removidos.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <input
              type="checkbox"
              id="confirm"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="confirm" className="text-sm cursor-pointer">
              Confirmo que entendo as consequências desta ação
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant={isDangerous ? "destructive" : "default"}
            onClick={handleCleanup}
            disabled={!isConfirmed || loading}
          >
            {loading ? 'Limpando...' : 'Confirmar Limpeza'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};