import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormExternalLoginProps {
  formId: string;
  formTitle?: string;
  onLoginSuccess: (sessionData: any) => void;
}

export const FormExternalLogin = ({ formId, formTitle, onLoginSuccess }: FormExternalLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.functions.invoke('external-form-auth', {
        body: {
          email,
          password,
          form_id: formId
        }
      });

      if (authError) throw authError;

      if (data.success) {
        // Armazenar token de sessão
        localStorage.setItem('external_form_token', data.token);
        localStorage.setItem('external_form_session', JSON.stringify({
          recipient: data.recipient,
          form: data.form,
          expires_at: data.expires_at
        }));

        toast.success(`Bem-vindo(a), ${data.recipient.name}!`);
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError('Credenciais inválidas ou erro no servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Acesso ao Formulário
          </h2>
          {formTitle && (
            <p className="mt-2 text-sm text-gray-600">
              {formTitle}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Use as credenciais enviadas por email para acessar este formulário
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fazer Login</CardTitle>
            <CardDescription>
              Digite seu email e a senha temporária recebida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha recebida por email"
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Acessar Formulário'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-500">
                <p className="mb-2">Não recebeu o email com as credenciais?</p>
                <p className="text-xs">
                  Verifique sua caixa de spam ou entre em contato com quem enviou o formulário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Este é um acesso seguro e temporário ao formulário
          </p>
        </div>
      </div>
    </div>
  );
};