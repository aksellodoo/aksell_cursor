import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getBaseUrl } from "@/lib/config";
import { useMicrosoftAccount } from "@/hooks/useMicrosoftAccount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, PlugZap, Plug, Plug2, XCircle, Inbox, AlertCircle } from "lucide-react";
import SharedMailboxesModal from "./SharedMailboxesModal";

interface Props {
  editedUserId: string;
  onStatusChanged?: () => Promise<void> | void;
}

export const Office365ConfigButton = ({ editedUserId, onStatusChanged }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { account, loading, refresh } = useMicrosoftAccount(editedUserId);
  const [processing, setProcessing] = useState(false);
  const [mailboxesOpen, setMailboxesOpen] = useState(false);

  const isSelf = !!user && user.id === editedUserId;

  const handleStart = async () => {
    if (!isSelf) {
      toast({
        title: "Ação não permitida",
        description: "Somente o próprio usuário pode conectar sua conta Microsoft.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      const redirectUri = `${getBaseUrl()}/oauth/ms/callback`;
      const returnTo = `${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem("ms_return_to", returnTo);
      
      // Test connection to ms-auth-start function
      console.log("Starting Microsoft OAuth process...");
      const { data, error } = await supabase.functions.invoke("ms-auth-start", {
        body: { redirectUri },
      });
      
      if (error) {
        console.error("ms-auth-start error:", error);
        throw error;
      }
      
      const { authUrl, state } = data || {};
      if (!authUrl || !state) {
        throw new Error("Resposta inválida do servidor - URL de autenticação não recebida.");
      }
      
      console.log("OAuth URL generated successfully, redirecting...");
      sessionStorage.setItem("ms_oauth_state", state);
      window.location.href = authUrl;
    } catch (err: any) {
      console.error("ms-auth-start failed:", err);
      
      // Enhanced error messages based on error type
      let errorMessage = "Não foi possível iniciar a conexão com a Microsoft.";
      let errorTitle = "Erro de Conexão";
      
      if (err?.message?.includes("Microsoft secrets not configured")) {
        errorMessage = "Configurações da Microsoft não estão definidas no servidor. Contate o administrador.";
        errorTitle = "Configuração Pendente";
      } else if (err?.message?.includes("network") || err?.message?.includes("fetch")) {
        errorMessage = "Erro de conectividade. Verifique sua conexão com a internet.";
        errorTitle = "Erro de Rede";
      } else if (err?.message) {
        errorMessage = `Erro específico: ${err.message}`;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!isSelf) {
      toast({
        title: "Ação não permitida",
        description: "Somente o próprio usuário pode desconectar a conta Microsoft.",
        variant: "destructive",
      });
      return;
    }
    if (!account) return;
    if (!confirm("Tem certeza que deseja desconectar sua conta Microsoft?")) return;

    setProcessing(true);
    try {
      await supabase.from("ms_oauth_tokens").delete().eq("microsoft_account_id", account.id);
      await supabase.from("microsoft_accounts").delete().eq("id", account.id);

      toast({
        title: "Conexão removida",
        description: "Sua conta Microsoft foi desconectada.",
      });
      await refresh();
      if (onStatusChanged) await onStatusChanged();
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar a conta.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDiagnose = async () => {
    if (!isSelf) return;
    
    setProcessing(true);
    try {
      console.log("Starting Microsoft OAuth diagnosis...");
      
      // Test 1: Check base URL configuration
      const baseUrl = getBaseUrl();
      console.log("Base URL:", baseUrl);
      
      // Test 2: Test ms-auth-start function
      console.log("Testing ms-auth-start function...");
      const { data, error } = await supabase.functions.invoke("ms-auth-start", {
        body: { redirectUri: `${baseUrl}/oauth/ms/callback` },
      });
      
      if (error) {
        console.error("ms-auth-start test failed:", error);
        toast({
          title: "Falha no Diagnóstico",
          description: `Erro ao testar configuração: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("ms-auth-start test successful:", data);
      
      toast({
        title: "Diagnóstico Completo",
        description: "Configuração Microsoft está funcionando. Tente conectar novamente.",
      });
      
    } catch (err: any) {
      console.error("Diagnosis failed:", err);
      toast({
        title: "Erro no Diagnóstico",
        description: err?.message || "Erro inesperado durante o diagnóstico",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <span className="font-medium">Office 365</span>
          {loading ? (
            <Badge variant="secondary">Carregando...</Badge>
          ) : account ? (
            <Badge variant="default">Conectado</Badge>
          ) : (
            <Badge variant="outline">Não conectado</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMailboxesOpen(true)}
            disabled={!isSelf}
            title={isSelf ? "Gerenciar caixas compartilhadas" : "Somente o próprio usuário pode gerenciar"}
          >
            <Inbox className="h-4 w-4 mr-1" />
            Caixas compartilhadas
          </Button>
          
          {/* Diagnose button - only show if user can configure */}
          {isSelf && !account && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDiagnose} 
              disabled={processing}
              title="Testar configuração Microsoft"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Diagnóstico
            </Button>
          )}
          
          {account ? (
            <>
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={processing || !isSelf}>
                <XCircle className="h-4 w-4 mr-1" />
                Desconectar
              </Button>
              <Button variant="default" size="sm" onClick={handleStart} disabled={processing || !isSelf}>
                <PlugZap className="h-4 w-4 mr-1" />
                Revalidar
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" onClick={handleStart} disabled={processing || !isSelf}>
              {isSelf ? (
                <>
                  <Plug className="h-4 w-4 mr-1" />
                  Configuração Office 365
                </>
              ) : (
                <>
                  <Plug2 className="h-4 w-4 mr-1" />
                  Somente pelo usuário
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {account && (
        <div className="text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Conta:</span> {account.email || "(sem email)"}
          </div>
          {account.display_name && (
            <div>
              <span className="font-medium text-foreground">Nome:</span> {account.display_name}
            </div>
          )}
          {!isSelf && (
            <div className="text-xs text-muted-foreground mt-1">
              Somente o próprio usuário pode gerenciar a conexão Microsoft.
            </div>
          )}
        </div>
      )}

      <SharedMailboxesModal
        open={mailboxesOpen}
        onOpenChange={setMailboxesOpen}
        userId={editedUserId}
      />
    </div>
  );
};
