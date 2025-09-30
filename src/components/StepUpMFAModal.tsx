import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useStepUpAuth } from '@/hooks/useStepUpAuth';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface StepUpMFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operation: string;
  operationDescription?: string;
}

export const StepUpMFAModal: React.FC<StepUpMFAModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  operation,
  operationDescription
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [showError, setShowError] = useState(false);
  
  const {
    isCheckingAAL,
    mfaChallenge,
    startMFAChallenge,
    verifyMFACode,
    cancelMFAChallenge
  } = useStepUpAuth();

  // Iniciar desafio MFA quando modal abre
  useEffect(() => {
    if (isOpen && !mfaChallenge) {
      startMFAChallenge();
    }
  }, [isOpen, mfaChallenge, startMFAChallenge]);

  // Limpar estado quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setOtpCode('');
      setShowError(false);
      cancelMFAChallenge();
    }
  }, [isOpen, cancelMFAChallenge]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setShowError(true);
      return;
    }

    const success = await verifyMFACode(otpCode);
    if (success) {
      onSuccess();
      onClose();
    } else {
      setShowError(true);
      setOtpCode('');
    }
  };

  const handleCancel = () => {
    cancelMFAChallenge();
    onClose();
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    setShowError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-warning" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Verificação de Segurança Necessária
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {operationDescription || `A operação "${operation}" requer verificação adicional de segurança.`}
            <br />
            Digite o código do seu aplicativo autenticador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!mfaChallenge && isCheckingAAL ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Preparando verificação de segurança...
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <InputOTP
                  value={otpCode}
                  onChange={handleOtpChange}
                  maxLength={6}
                  disabled={isCheckingAAL}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {showError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Código inválido. Tente novamente.</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerify}
                  disabled={otpCode.length !== 6 || isCheckingAAL}
                  className="w-full"
                >
                  {isCheckingAAL ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar e Continuar'
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCheckingAAL}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Esta verificação garante que operações sensíveis sejam realizadas apenas por você.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};