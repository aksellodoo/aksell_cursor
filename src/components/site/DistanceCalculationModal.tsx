import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

type CalculationMode = 'fill_empty' | 'overwrite' | 'geocode_non_matrix';

interface DistanceCalculationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: CalculationMode) => void;
  isStarting: boolean;
}

export function DistanceCalculationModal({
  open,
  onOpenChange,
  onConfirm,
  isStarting
}: DistanceCalculationModalProps) {
  const [mode, setMode] = useState<CalculationMode>('fill_empty');

  const handleConfirm = () => {
    onConfirm(mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Calcular Distância até Indaiatuba, SP
          </DialogTitle>
          <DialogDescription>
            Esta operação irá calcular a distância rodoviária e tempo de viagem de caminhão 
            para todas as cidades selecionadas usando a Google Distance Matrix API.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <RadioGroup value={mode} onValueChange={(value) => setMode(value as CalculationMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fill_empty" id="fill_empty" />
                <Label htmlFor="fill_empty" className="text-sm font-medium leading-none cursor-pointer">
                  Somente preencher campos vazios (recomendado)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="text-sm font-medium leading-none cursor-pointer">
                  Sobrescrever valores existentes
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="geocode_non_matrix" id="geocode_non_matrix" />
                <Label htmlFor="geocode_non_matrix" className="text-sm font-medium leading-none cursor-pointer">
                  Geocodificar cidades que estão sem "matrix"
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>Observações:</strong>
              <br />
              • Usa Google Distance Matrix API com parâmetros de caminhão
              • Processa até 100 destinos por lote
              • Origem fixa: Indaiatuba, SP (-23.0816, -47.2100)
              • Cidades sem coordenadas serão geocodificadas automaticamente
              • Tempo de caminhão = tempo do Google × 1,25
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isStarting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isStarting}
            >
              {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Cálculo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}