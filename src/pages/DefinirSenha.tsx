import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Lock, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { Logo } from "@/components/Logo";

const DefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const generateRandomPassword = () => {
    // Gerar senha com 30 caracteres seguindo as melhores práticas
    const length = 30;
    const lowercase = "abcdefghijkmnpqrstuvwxyz"; // removido 'l' e 'o'
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removido 'I' e 'O'
    const numbers = "23456789"; // removido '0' e '1'
    const symbols = "!@#$%&*+-=?";
    
    // Garantir pelo menos 1 caractere de cada tipo
    let password = "";
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Preencher o restante aleatoriamente
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Embaralhar a senha para não ter padrão fixo
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewPassword(password);
    setConfirmPassword(password);
    toast.success("Senha segura de 30 caracteres gerada!");
  };

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      return "Por favor, preencha ambos os campos de senha";
    }

    if (newPassword.length < 10) {
      return "A senha deve ter pelo menos 10 caracteres";
    }

    if (newPassword !== confirmPassword) {
      return "As senhas não coincidem";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token inválido. Por favor, solicite um novo link de redefinição.");
      return;
    }

    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: resetError } = await supabase.functions.invoke(
        'validate-password-reset',
        {
          body: {
            token,
            newPassword,
          },
        }
      );

      if (resetError) {
        console.error('Error calling validate-password-reset:', resetError);
        throw new Error('Erro ao comunicar com o servidor');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      toast.success(data.message || "Senha definida com sucesso!");
      
      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 2000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Erro inesperado. Tente novamente.');
      toast.error("Erro ao definir senha");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="md" variant="full" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Token Inválido
            </CardTitle>
            <CardDescription>
              O link de redefinição de senha é inválido ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="md" variant="full" />
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Senha Definida!
            </CardTitle>
            <CardDescription>
              Sua senha foi definida com sucesso. Você será redirecionado para a página de login.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" variant="full" />
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            Definir Senha
          </CardTitle>
          <CardDescription>
            Defina uma nova senha para sua conta no FichaCerta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {newPassword && (
                <PasswordStrengthIndicator password={newPassword} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={generateRandomPassword}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Gerar Senha Segura (30 caracteres)
            </Button>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Definindo senha...
                </>
              ) : (
                "Definir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefinirSenha;