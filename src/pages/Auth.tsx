
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { useTrustedDevice } from "@/hooks/useTrustedDevice";

// Schema for authentication (login and password recovery only)
const createAuthSchema = (showForgotPassword: boolean) => {
  const baseSchema = {
    email: z.string().email("Email inválido"),
  };

  if (showForgotPassword) {
    // Only email needed for password recovery
    return z.object(baseSchema);
  }

  // Only email and password for login
  return z.object({
    ...baseSchema,
    password: z.string().min(10, "Senha deve ter pelo menos 10 caracteres"),
  });
};

type AuthFormData = {
  email: string;
  password?: string;
};

const Auth = () => {
  const navigate = useNavigate();
  // Mudamos para usar apenas resetPassword do hook; signIn direto no Supabase para capturar MFA
  const { resetPassword, session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Estados para MFA
  const [mfaStep, setMfaStep] = useState<"none" | "challenge" | "enroll">("none");
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [enrollData, setEnrollData] = useState<{ factorId: string; qr?: string; secret?: string; uri?: string } | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [trustThisDevice, setTrustThisDevice] = useState(false);
  
  const { checkDeviceTrust, trustDevice } = useTrustedDevice();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(createAuthSchema(showForgotPassword)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (session?.user && mfaStep === "none") {
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate, mfaStep]);

  // Clear errors and reset form when mode changes
  useEffect(() => {
    form.clearErrors();
    if (showForgotPassword) {
      // Reset password field when switching to recovery mode
      form.setValue("password", "");
    }
  }, [showForgotPassword, form]);

  // Inicia fluxo de inscrição TOTP (QR + secret)
  const startTotpEnrollment = async () => {
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) {
        console.error("Erro ao iniciar inscrição TOTP:", error);
        toast({
          title: "Erro",
          description: "Erro ao iniciar configuração de 2FA.",
          variant: "destructive",
        });
        return;
      }

      const factorId = (data as any).id;
      const totp = (data as any).totp || {};
      setEnrollData({
        factorId,
        qr: totp.qr_code || totp.qrCode || null,
        secret: totp.secret,
        uri: totp.uri,
      });
      setMfaStep("enroll");
      toast({
        title: "Configuração 2FA",
        description: "Escaneie o QR code no Bitwarden (ou use o secret) e informe o código.",
      });
    } finally {
      setMfaLoading(false);
    }
  };

  // Verificar código no fluxo de inscrição (ativa o TOTP)
  const verifyTotpEnrollment = async () => {
    if (!enrollData?.factorId || otpCode.length < 6) {
      toast({
        title: "Erro",
        description: "Digite o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }
    setMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        code: otpCode,
      } as any);
      if (error) {
        console.error("Erro ao verificar TOTP (enroll):", error);
        toast({
          title: "Erro",
          description: "Código inválido. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Atualiza timestamps de auditoria (opcional)
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({ mfa_last_verified_at: new Date().toISOString(), mfa_enforced_at: new Date().toISOString() })
          .eq("id", userId);
      }

      toast({
        title: "Sucesso!",
        description: "2FA ativado com sucesso!",
      });
      navigate("/dashboard");
    } finally {
      setMfaLoading(false);
    }
  };

  // Verificar código no fluxo de challenge (login exigindo MFA)
  const verifyMfaChallenge = async () => {
    if (!selectedFactorId || otpCode.length < 6) {
      toast({
        title: "Erro",
        description: "Digite o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }
    setMfaLoading(true);
    try {
      const { data: chData, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: selectedFactorId,
      } as any);
      if (chErr || !chData) {
        console.error("Erro ao iniciar challenge MFA:", chErr);
        toast({
          title: "Erro",
          description: "Erro ao iniciar verificação 2FA.",
          variant: "destructive",
        });
        return;
      }
      const chId = (chData as any).id;
      setChallengeId(chId);

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: selectedFactorId,
        challengeId: chId,
        code: otpCode,
      } as any);
      if (vErr) {
        console.error("Erro ao verificar MFA (challenge):", vErr);
        toast({
          title: "Erro",
          description: "Código inválido. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Se o usuário escolheu confiar no dispositivo, criar trusted device
      if (trustThisDevice) {
        console.log('Auth: Attempting to trust device...');
        try {
          const success = await trustDevice(30); // 30 dias
          if (success) {
            console.log('Auth: Device trusted successfully');
          } else {
            console.log('Auth: Failed to trust device');
          }
        } catch (error) {
          console.error('Auth: Error trusting device:', error);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Login com 2FA concluído!",
      });
      navigate("/dashboard");
    } finally {
      setMfaLoading(false);
    }
  };

  // Cancela telas de MFA
  const cancelMfaFlow = async () => {
    try {
      // Se estava em enrollment, geralmente já há sessão; opcionalmente podemos sair
      if (mfaStep === "enroll") {
        await supabase.auth.signOut();
      }
    } finally {
      setMfaStep("none");
      setOtpCode("");
      setEnrollData(null);
      setSelectedFactorId(null);
      setChallengeId(null);
      setMfaFactors([]);
      setIsLoading(false);
      setMfaLoading(false);
    }
  };

  // Após login, verifica se o usuário precisa configurar 2FA (mfa_required) e ainda não está em AAL2
  const maybeRequireEnrollment = async () => {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("mfa_required")
      .eq("id", userId)
      .maybeSingle();

    const isRequired = !!profile?.mfa_required;
    const isAAL2 = aal?.currentLevel === "aal2";

    if (isRequired && !isAAL2) {
      navigate("/auth/2fa-setup");
      return true;
    }
    return false;
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (showForgotPassword) {
        // Usar APENAS nosso sistema de reset de senha customizado
        // Remove fallbacks que podem gerar URLs inconsistentes
        try {
          console.log('📧 Calling send-password-reset-link edge function...');
          const { data: resetData, error: resetError } = await supabase.functions.invoke(
            'send-password-reset-link',
            {
              body: {
                email: data.email,
                resetType: 'user_request',
              },
            }
          );

          if (resetError) {
            console.error('❌ Error calling send-password-reset-link:', resetError);
            toast({
              title: "Erro",
              description: "Erro ao enviar link de recuperação. Tente novamente em alguns minutos.",
              variant: "destructive",
            });
            return;
          }

          if ((resetData as any)?.error) {
            console.error('❌ Edge function returned error:', (resetData as any).error);
            toast({
              title: "Erro",
              description: (resetData as any).error,
              variant: "destructive",
            });
            return;
          }

          // Sucesso - sempre mostra mensagem positiva
          console.log('✅ Password reset email sent successfully');
          toast({
            title: "Email enviado!",
            description: "📧 Email de recuperação enviado! Verifique sua caixa de entrada e pasta de spam. O link será válido por 24 horas.",
          });
          setShowForgotPassword(false);
          form.reset({ email: "", password: "" });

        } catch (error) {
          console.error('❌ Unexpected error in password reset:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao enviar email. Tente novamente em alguns minutos.",
            variant: "destructive",
          });
        }
        return;
      }

      // Login básico primeiro - verificação de dispositivo acontece após autenticação básica
      console.log('🔑 Starting basic authentication...');

      // Login básico via Supabase
      const result = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password!,
      });

      const { data: signInData, error } = result as any;

      // Caso MFA seja requerido no login (usuário já tem fator TOTP inscrito)
      if (error && (signInData?.mfa || signInData?.mfa?.totp)) {
        console.log('🔐 MFA required for login');
        
        // Verificar se dispositivo é confiável APÓS autenticação básica
        try {
          const deviceTrustResult = await checkDeviceTrust();
          if (deviceTrustResult?.trusted) {
            console.log('✅ Device is trusted - implementing UX improvement for MFA');
            toast({
              title: "Dispositivo confiável",
              description: "🔐 Dispositivo confiável! Digite seu código 2FA uma última vez",
            });
          }
        } catch (deviceCheckError) {
          console.log('⚠️ Could not check device trust:', deviceCheckError);
        }
        
        const factors = signInData?.mfa?.factors || signInData?.mfa?.totp?.factors || [];
        if (Array.isArray(factors) && factors.length > 0) {
          setMfaFactors(factors);
          setSelectedFactorId(factors[0].id);
          setMfaStep("challenge");
          toast({
            title: "2FA necessário",
            description: "Insira o código do autenticador para concluir o login.",
          });
          return;
        }
      }

      if (error) {
        toast({
          title: "Erro no login",
          description: "Erro no login: " + error.message,
          variant: "destructive",
        });
        return;
      }

      // Login OK; verificar se precisamos forçar inscrição do 2FA conforme perfil
      if (signInData?.session) {
        const enrolledNeeded = await maybeRequireEnrollment();
        if (!enrolledNeeded) {
          toast({
            title: "Sucesso!",
            description: "Login realizado com sucesso!",
          });
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "Erro inesperado",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Carregando...";
    if (showForgotPassword) return "Enviar Email de Recuperação";
    return "Entrar";
  };

  const getTitle = () => {
    if (mfaStep === "challenge") return "Confirme com 2FA";
    if (mfaStep === "enroll") return "Configurar 2FA";
    if (showForgotPassword) return "Recuperar Senha";
    return "Entrar na sua conta";
  };

  const getDescription = () => {
    if (mfaStep === "challenge") return "Digite o código do autenticador para concluir o login.";
    if (mfaStep === "enroll") return "Escaneie o QR code no Bitwarden (ou use o secret), depois informe o código.";
    if (showForgotPassword) return "Digite seu email para receber as instruções de recuperação";
    return "Digite suas credenciais para acessar o sistema";
  };

  // Telas de MFA (renderização antecipada para não alterar o formulário original)
  if (mfaStep === "challenge" || mfaStep === "enroll") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-6 text-center">
            <div className="flex justify-center">
              <Logo onClick={() => window.open('https://aksell.com.br', '_blank')} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {getTitle()}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {getDescription()}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {mfaStep === "enroll" && (
              <div className="space-y-4">
                {enrollData?.qr ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={enrollData.qr}
                      alt="QR Code TOTP"
                      className="w-44 h-44 border rounded bg-background"
                    />
                    <p className="text-xs text-muted-foreground break-all">
                      ou use o secret: <span className="font-mono">{enrollData.secret}</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded text-xs break-all">
                    <p className="mb-1">Adicione este URI ao seu autenticador:</p>
                    <code className="font-mono">{enrollData?.uri || "otpauth://..."}</code>
                    {enrollData?.secret && (
                      <p className="mt-2">Secret: <span className="font-mono">{enrollData.secret}</span></p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Código do autenticador</Label>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
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

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={verifyTotpEnrollment}
                    disabled={mfaLoading || otpCode.length < 6}
                  >
                    Ativar 2FA
                  </Button>
                  <Button variant="outline" onClick={cancelMfaFlow} disabled={mfaLoading}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {mfaStep === "challenge" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Código do autenticador</Label>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
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
                    onCheckedChange={(checked) => setTrustThisDevice(checked as boolean)}
                  />
                  <Label 
                    htmlFor="trust-device" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Confiar neste dispositivo por 30 dias
                  </Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={verifyMfaChallenge}
                    disabled={mfaLoading || otpCode.length < 6 || !selectedFactorId}
                  >
                    Confirmar
                  </Button>
                  <Button variant="outline" onClick={cancelMfaFlow} disabled={mfaLoading}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 text-center">
          <div className="flex justify-center">
            <Logo onClick={() => window.open('https://aksell.com.br', '_blank')} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                {...form.register("email")}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {!showForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    {...form.register("password")}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>

            {!showForgotPassword && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                <KeyRound size={16} className="mr-2" />
                Esqueci minha senha
              </button>
            )}

            <div className="text-center space-y-2">
              {showForgotPassword ? (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  Voltar ao login
                </button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/solicitar-acesso')}
                  disabled={isLoading}
                  className="w-full"
                >
                  Solicitar Acesso ao Sistema
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
