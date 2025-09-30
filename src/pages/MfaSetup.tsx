import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { useTrustedDevice } from "@/hooks/useTrustedDevice";

const MfaSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [trustThisDevice, setTrustThisDevice] = useState(false);
  
  const { trustDevice } = useTrustedDevice();

  useEffect(() => {
    document.title = "Configurar 2FA - Autenticação de Dois Fatores";
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        navigate("/auth", { replace: true });
        return;
      }

      // Se já está em AAL2, volta para dashboard
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Verifica se realmente é obrigatório
      const { data: profile } = await supabase
        .from("profiles")
        .select("mfa_required, mfa_last_verified_at")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.mfa_required) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Tenta reutilizar fator TOTP existente
      const { data: factorsRes } = await supabase.auth.mfa.listFactors();
      const all = (factorsRes as any)?.all ?? (factorsRes as any)?.factors ?? [];
      const totpList = (factorsRes as any)?.totp ?? all.filter((f: any) => f.factor_type === "totp");
      const verifiedTotp = totpList.find((f: any) => f.status === "verified");
      const anyTotp = totpList[0];
      let id: string | null = (verifiedTotp || anyTotp)?.id ?? null;

      if (!id) {
        // Inicia inscrição TOTP quando não houver nenhum fator TOTP disponível
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` } as any);
        if (error || !data) {
          console.error("Erro ao iniciar inscrição TOTP:", error);
          setInitError("Não foi possível iniciar a configuração de 2FA. Clique em Recarregar para tentar novamente.");
          toast.error("Não foi possível iniciar a configuração de 2FA. Tente novamente.");
          return;
        }

        id = (data as any).id;
        const totp = (data as any).totp || {};
        setQr(totp.qr_code || totp.qrCode || null);
        setSecret(totp.secret || null);
        setUri(totp.uri || null);
        toast.message("Escaneie o QR code (ou use o secret) e informe o código para ativar o 2FA.");
      } else {
        // Já existe fator TOTP - apenas validar código
        setQr(null);
        setSecret(null);
        setUri(null);
      }

      setFactorId(id);
      setInitError(null);
      // Criar challenge para verificação (eleva para AAL2)
      if (!id) {
        console.error("Nenhum fator TOTP encontrado para o usuário");
        setInitError("Nenhum fator TOTP encontrado. Clique em Recarregar.");
        toast.error("Nenhum fator TOTP encontrado. Recarregue a página.");
        return;
      }
      let chId: string | null = null;
      // Tentar criar challenge; se falhar, reenrolar TOTP uma vez e tentar novamente
      let { data: chData, error: chError } = await supabase.auth.mfa.challenge({ factorId: id } as any);
      if (chError || !chData?.id) {
        console.warn("Falha ao criar challenge com fator atual. Tentando criar novo fator TOTP…", chError);
        const { data: reEnroll, error: reErr } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}` } as any);
        if (!reErr && reEnroll) {
          const newId = (reEnroll as any).id as string;
          const totp2 = (reEnroll as any).totp || {};
          setQr(totp2.qr_code || totp2.qrCode || null);
          setSecret(totp2.secret || null);
          setUri(totp2.uri || null);
          setFactorId(newId);
          const retry = await supabase.auth.mfa.challenge({ factorId: newId } as any);
          if (retry.error || !retry.data?.id) {
            console.error("Falha ao criar challenge mesmo após reenroll:", retry.error);
            setInitError("Não foi possível iniciar a verificação de 2FA. Clique em Recarregar.");
            toast.error("Não foi possível iniciar a verificação MFA. Recarregue a página.");
            return;
          }
          chId = (retry.data as any).id as string;
        } else {
          console.error("Reenroll TOTP falhou:", reErr);
          setInitError("Falha ao iniciar verificação. Clique em Recarregar.");
          toast.error("Falha ao iniciar verificação MFA. Recarregue a página.");
          return;
        }
      } else {
        chId = (chData as any).id as string;
      }
      setChallengeId(chId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = async () => {
    const code = otpCode.replace(/\D/g, "");
    if (!factorId || !/^\d{6}$/.test(code)) {
      toast.error("Digite o código de 6 dígitos");
      return;
    }
    setVerifying(true);
    try {
      let cid = challengeId;
      if (!cid) {
        const { data: chData, error: chError } = await supabase.auth.mfa.challenge({ factorId } as any);
        if (chError || !chData?.id) {
          toast.error("Não foi possível iniciar a verificação. Tente novamente.");
          return;
        }
        cid = (chData as any).id;
        setChallengeId(cid);
      }

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: cid!,
        code,
      } as any);
      if (error) {
        console.error("Erro ao verificar TOTP:", error);
        toast.error("Código inválido. Tente novamente.");
        // Renovar challenge para próxima tentativa
        const { data: newCh } = await supabase.auth.mfa.challenge({ factorId } as any);
        if ((newCh as any)?.id) setChallengeId((newCh as any).id);
        return;
      }

      // Atualiza campos de auditoria
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({ mfa_last_verified_at: new Date().toISOString(), mfa_enforced_at: new Date().toISOString() })
          .eq("id", userId);
      }

      toast.success("2FA ativado/verificado com sucesso!");

      // Aguardar elevação para AAL2 antes de navegar, evitando loop
      console.log("Aguardando AAL2...");
      let aal2Confirmed = false;
      for (let i = 0; i < 30; i++) {
        const { data: aalCheck } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        console.log(`AAL check ${i + 1}: currentLevel=${aalCheck?.currentLevel}, nextLevel=${aalCheck?.nextLevel}`);
        if (aalCheck?.currentLevel === "aal2") {
          aal2Confirmed = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!aal2Confirmed) {
        console.warn("AAL2 não foi confirmado após 15 segundos");
      }

      // Aguardar mais tempo para garantir que o token AAL2 está completamente propagado
      console.log("Aguardando propagação completa do token AAL2...");
      await new Promise((r) => setTimeout(r, 3000));

      // Confiar no dispositivo APÓS ter AAL2 confirmado e token propagado
      if (trustThisDevice) {
        try {
          console.log("Iniciando processo de trusted device...");
          toast.message("Configurando dispositivo confiável...");
          
          const success = await trustDevice(30); // 30 dias
          if (success) {
            console.log("Trusted device registrado com sucesso");
            toast.success("Dispositivo configurado como confiável!");
          } else {
            console.error("Falha ao registrar trusted device");
            toast.error("Falha ao configurar dispositivo confiável");
          }
        } catch (error) {
          console.error("Erro crítico ao confiar no dispositivo:", error);
          toast.error("Erro ao configurar dispositivo confiável");
        }
      }

      navigate("/dashboard", { replace: true });
    } finally {
      setVerifying(false);
    }
  };

  const cancel = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Configurar 2FA
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Autenticação de Dois Fatores obrigatória
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">Carregando…</div>
          ) : (
            <div className="space-y-4">
              {(qr || uri || secret) && (
                qr ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={qr}
                      alt="QR Code para configurar 2FA TOTP"
                      loading="lazy"
                      className="w-44 h-44 border rounded bg-background"
                    />
                    {secret && (
                      <p className="text-xs text-muted-foreground break-all">
                        ou use o secret: <span className="font-mono">{secret}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded text-xs break-all">
                    {uri && (
                      <>
                        <p className="mb-1">Adicione este URI ao seu autenticador:</p>
                        <code className="font-mono">{uri}</code>
                      </>
                    )}
                    {secret && (
                      <p className="mt-2">Secret: <span className="font-mono">{secret}</span></p>
                    )}
                  </div>
                )
              )}

              <div className="space-y-2">
                <Label>Código do autenticador</Label>
                <InputOTP maxLength={6} value={otpCode} onChange={(v: string) => setOtpCode((v || "").replace(/\D/g, ""))}>
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

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="trust-device" 
                  checked={trustThisDevice}
                  onCheckedChange={(checked) => setTrustThisDevice(checked === true)}
                />
                <Label 
                  htmlFor="trust-device" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Confiar neste dispositivo por 30 dias
                </Label>
              </div>

              {(!factorId || initError) && (
                <div className="text-xs text-destructive">
                  {initError ?? "Não foi possível iniciar a verificação ainda. Clique em Recarregar."}
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" onClick={verify} disabled={verifying || !/^\d{6}$/.test(otpCode)}>
                  {(qr || uri || secret) ? "Ativar 2FA" : "Verificar código"}
                </Button>
                {(!factorId || initError) && (
                  <Button variant="secondary" onClick={() => { setOtpCode(""); init(); }} disabled={verifying}>
                    Recarregar
                  </Button>
                )}
                <Button variant="outline" onClick={cancel} disabled={verifying}>
                  Cancelar
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Compatível com Bitwarden, Google Authenticator e outros apps TOTP.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MfaSetup;
