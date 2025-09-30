import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getBaseUrl } from "@/lib/config";

export const OAuthMicrosoftCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("Processando retorno da Microsoft...");

  useEffect(() => {
    document.title = "Conectar Microsoft - Ficha Certa";

    const metaDesc = document.querySelector('meta[name="description"]') || (() => { const m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); return m; })();
    (metaDesc as HTMLMetaElement).setAttribute('content', 'Callback de autenticação Microsoft para vincular sua conta Office 365.');

    const canonical = document.querySelector('link[rel="canonical"]') || (() => { const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); document.head.appendChild(l); return l; })();
    (canonical as HTMLLinkElement).setAttribute('href', `${getBaseUrl()}/oauth/ms/callback`);


    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      setStatus("Código de autorização não encontrado.");
      toast({
        title: "Erro",
        description: "Código de autorização ausente no retorno.",
        variant: "destructive",
      });
      navigate("/auth" , { replace: true });
      return;
    }

    const expectedState = sessionStorage.getItem("ms_oauth_state");
    if (expectedState && state && expectedState !== state) {
      setStatus("Falha na validação do estado (state).");
      toast({
        title: "Erro de segurança",
        description: "Falha ao validar o retorno da Microsoft (state inválido).",
        variant: "destructive",
      });
      // Cleanup
      sessionStorage.removeItem("ms_oauth_state");
      navigate("/auth", { replace: true });
      return;
    }

    const exchange = async () => {
      try {
        const redirectUri = `${getBaseUrl()}/oauth/ms/callback`;
        setStatus("Conectando conta Microsoft...");
        console.log("Exchanging OAuth code for tokens...");
        
        const { data, error } = await supabase.functions.invoke("ms-auth-exchange", {
          body: { code, state, redirectUri },
        });
        
        if (error) {
          console.error("ms-auth-exchange error:", error);
          throw error;
        }

        console.log("Microsoft account connected successfully");
        toast({
          title: "Conta conectada",
          description: "Conexão com a Microsoft realizada com sucesso.",
        });

        const returnTo = sessionStorage.getItem("ms_return_to");
        sessionStorage.removeItem("ms_oauth_state");
        sessionStorage.removeItem("ms_return_to");

        // Segurança: garantir que returnTo é um path interno
        const safeReturn = returnTo && returnTo.startsWith("/") ? returnTo : "/usuarios";
        navigate(safeReturn, { replace: true });
      } catch (err: any) {
        console.error("Erro no ms-auth-exchange:", err);
        
        // Enhanced error handling based on error type
        let errorMessage = "Não foi possível finalizar a conexão com a Microsoft.";
        let errorTitle = "Erro de Conexão";
        
        if (err?.message?.includes("ACCOUNT_ALREADY_LINKED")) {
          errorMessage = "Esta conta Microsoft já está conectada a outro usuário do sistema.";
          errorTitle = "Conta Já Vinculada";
        } else if (err?.message?.includes("Microsoft secrets not configured")) {
          errorMessage = "Configurações da Microsoft não estão definidas no servidor. Contate o administrador.";
          errorTitle = "Configuração Pendente";
        } else if (err?.message?.includes("duplicate key")) {
          errorMessage = "Conflito na vinculação da conta. Tente desconectar e conectar novamente.";
          errorTitle = "Conflito de Conta";
        } else if (err?.message?.includes("Failed to exchange code")) {
          errorMessage = "Falha na autenticação com a Microsoft. Verifique suas credenciais e tente novamente.";
          errorTitle = "Falha na Autenticação";
        } else if (err?.message) {
          errorMessage = `Erro específico: ${err.message}`;
        }
        
        setStatus(errorMessage);
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
        
        // Wait a bit before redirecting so user can read the error
        setTimeout(() => {
          navigate("/usuarios", { replace: true });
        }, 3000);
      }
    };

    exchange();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner />
        <p className="text-muted-foreground text-sm">{status}</p>
      </div>
    </div>
  );
};

export default OAuthMicrosoftCallback;
