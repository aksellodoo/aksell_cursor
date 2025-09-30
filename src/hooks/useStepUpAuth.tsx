import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StepUpAuthOptions {
  autoRedirect?: boolean;
  requiredForOperations?: string[];
}

export const useStepUpAuth = (options: StepUpAuthOptions = {}) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isAAL2, setIsAAL2] = useState(false);
  const [isCheckingAAL, setIsCheckingAAL] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState<any>(null);

  // Verificar nível AAL atual
  const checkAALLevel = useCallback(async () => {
    if (!session) {
      setIsAAL2(false);
      return false;
    }

    try {
      // O AAL está no JWT, não no objeto user
      const aal = (session as any)?.user?.aal || 'aal1';
      const isLevel2 = aal === 'aal2';
      setIsAAL2(isLevel2);
      console.log('🔐 Step-up Auth - Current AAL:', aal, 'Is AAL2:', isLevel2);
      return isLevel2;
    } catch (error) {
      console.error('🔐 Step-up Auth - Error checking AAL:', error);
      setIsAAL2(false);
      return false;
    }
  }, [session]);

  // Iniciar desafio MFA para step-up
  const startMFAChallenge = useCallback(async () => {
    if (!session) {
      toast({
        title: "Erro de autenticação",
        description: "Sessão não encontrada. Faça login novamente.",
        variant: "destructive"
      });
      return null;
    }

    try {
      setIsCheckingAAL(true);
      console.log('🔐 Step-up Auth - Starting MFA challenge...');

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: session.user.factors?.[0]?.id
      });

      if (error) {
        console.error('🔐 Step-up Auth - MFA challenge error:', error);
        toast({
          title: "Erro no desafio MFA",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      setMfaChallenge(data);
      console.log('🔐 Step-up Auth - MFA challenge created:', data.id);
      return data;
    } catch (error) {
      console.error('🔐 Step-up Auth - Exception in MFA challenge:', error);
      toast({
        title: "Erro inesperado",
        description: "Falha ao iniciar desafio MFA",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCheckingAAL(false);
    }
  }, [session, toast]);

  // Verificar código MFA para step-up
  const verifyMFACode = useCallback(async (code: string) => {
    if (!mfaChallenge) {
      toast({
        title: "Erro",
        description: "Nenhum desafio MFA ativo",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsCheckingAAL(true);
      console.log('🔐 Step-up Auth - Verifying MFA code...');

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: mfaChallenge.factor_id,
        challengeId: mfaChallenge.id,
        code
      });

      if (error) {
        console.error('🔐 Step-up Auth - MFA verification error:', error);
        toast({
          title: "Código inválido",
          description: "Verifique o código e tente novamente",
          variant: "destructive"
        });
        return false;
      }

      console.log('🔐 Step-up Auth - MFA verified successfully');
      setMfaChallenge(null);
      setIsAAL2(true);
      
      toast({
        title: "Verificação concluída",
        description: "Acesso elevado concedido com sucesso",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('🔐 Step-up Auth - Exception in MFA verification:', error);
      toast({
        title: "Erro inesperado",
        description: "Falha na verificação MFA",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsCheckingAAL(false);
    }
  }, [mfaChallenge, toast]);

  // Verificar se operação específica requer AAL2
  const requiresAAL2 = useCallback((operation: string) => {
    const sensitiveOperations = [
      'delete_user',
      'change_password',
      'view_sensitive_data',
      'export_data',
      'admin_operations',
      'financial_data',
      ...(options.requiredForOperations || [])
    ];
    
    return sensitiveOperations.includes(operation);
  }, [options.requiredForOperations]);

  // Garantir AAL2 para operação específica
  const ensureAAL2 = useCallback(async (operation: string) => {
    console.log('🔐 Step-up Auth - Checking AAL2 requirement for:', operation);
    
    if (!requiresAAL2(operation)) {
      console.log('🔐 Step-up Auth - Operation does not require AAL2');
      return true;
    }

    const currentAAL2 = await checkAALLevel();
    if (currentAAL2) {
      console.log('🔐 Step-up Auth - Already at AAL2, proceeding');
      return true;
    }

    console.log('🔐 Step-up Auth - AAL2 required, requesting elevation');
    return false; // Frontend deve mostrar UI de MFA
  }, [requiresAAL2, checkAALLevel]);

  // Cancelar desafio MFA
  const cancelMFAChallenge = useCallback(() => {
    setMfaChallenge(null);
    setIsCheckingAAL(false);
    console.log('🔐 Step-up Auth - MFA challenge cancelled');
  }, []);

  // Verificar AAL quando a sessão mudar
  useEffect(() => {
    checkAALLevel();
  }, [checkAALLevel]);

  return {
    isAAL2,
    isCheckingAAL,
    mfaChallenge,
    startMFAChallenge,
    verifyMFACode,
    cancelMFAChallenge,
    requiresAAL2,
    ensureAAL2,
    checkAALLevel
  };
};