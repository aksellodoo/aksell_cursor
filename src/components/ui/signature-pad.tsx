import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void;
  value?: string;
  disabled?: boolean;
}

export const SignaturePad = ({ onSignatureChange, value, disabled = false }: SignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value);
      setIsEmpty(false);
    }
  }, [value]);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onSignatureChange('');
    }
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signature = sigCanvas.current.toDataURL();
      onSignatureChange(signature);
      setIsEmpty(false);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      save();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="border border-border rounded-lg overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 400,
              height: 200,
              className: 'signature-canvas w-full h-48'
            }}
            backgroundColor="white"
            penColor="black"
            onBegin={handleBegin}
            onEnd={handleEnd}
            clearOnResize={false}
          />
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={clear}
            disabled={disabled || isEmpty}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={save}
            disabled={disabled || isEmpty}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        {disabled 
          ? 'Assinatura desabilitada' 
          : 'Desenhe sua assinatura na área acima'
        }
      </p>
    </div>
  );
};