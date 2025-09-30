import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Users, UserCheck } from 'lucide-react';
import { FormHeader } from '@/components/FormHeader';

export const FormAccessSelector = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }

    resolveTokenAndFetchForm();
  }, [token]);

  const resolveTokenAndFetchForm = async () => {
    try {
      // Primeiro, resolver o token para obter o form_id
      const { data: resolvedFormId, error: tokenError } = await supabase
        .rpc('resolve_form_token', { token_text: token });

      if (tokenError || !resolvedFormId) {
        setError('Token inválido ou expirado');
        return;
      }

      setFormId(resolvedFormId);

      // Agora buscar os dados do formulário
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, description, is_published, publication_status, allows_anonymous_responses')
        .eq('id', resolvedFormId)
        .eq('is_published', true)
        .single();

      if (formError) {
        if (formError.code === 'PGRST116') {
          setError('Formulário não encontrado ou não está publicado');
        } else {
          setError('Erro ao carregar formulário');
        }
        return;
      }

      if (!formData.is_published) {
        setError('Este formulário não está mais disponível');
        return;
      }

      // Se é formulário apenas interno, redirecionar para login
      if (formData.publication_status === 'published_internal') {
        navigate('/auth');
        return;
      }

      setForm(formData);
    } catch (error) {
      console.error('Erro ao buscar formulário:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInternalAccess = () => {
    navigate('/auth');
  };

  const handleExternalAccess = () => {
    // Se permite respostas anônimas, ir direto para preenchimento
    if (form?.allows_anonymous_responses) {
      navigate(`/forms/external/${token}/fill`);
    } else {
      // Requer login externo
      navigate(`/forms/external/${token}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-center">Acesso Negado</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <FormHeader className="mb-8" />
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {form?.title}
            </CardTitle>
            {form?.description && (
              <p className="text-muted-foreground mt-2">
                {form.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">
                Como você deseja acessar este formulário?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opção de usuário interno */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors cursor-pointer" 
                    onClick={handleInternalAccess}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <UserCheck className="w-12 h-12 text-blue-600 mb-4" />
                  <h4 className="font-medium text-lg mb-2">Usuário do Sistema</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Fazer login com credenciais do Ficha Certa
                  </p>
                  <Button onClick={handleInternalAccess} className="w-full">
                    Fazer Login no Sistema
                  </Button>
                </CardContent>
              </Card>

              {/* Opção de usuário externo */}
              <Card className="border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors cursor-pointer"
                    onClick={handleExternalAccess}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="w-12 h-12 text-green-600 mb-4" />
                  <h4 className="font-medium text-lg mb-2">Usuário Externo</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    {form?.allows_anonymous_responses 
                      ? 'Preencher formulário sem login'
                      : 'Usar credenciais fornecidas por email'
                    }
                  </p>
                  <Button 
                    onClick={handleExternalAccess} 
                    variant={form?.allows_anonymous_responses ? "default" : "outline"}
                    className="w-full"
                  >
                    {form?.allows_anonymous_responses 
                      ? 'Preencher Formulário'
                      : 'Login Externo'
                    }
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Escolha a opção que melhor descreve seu tipo de acesso ao formulário
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};