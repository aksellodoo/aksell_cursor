import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormExternalLogin } from '@/components/FormExternalLogin';
import { FormRenderer } from '@/components/FormRenderer';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { FormHeader } from '@/components/FormHeader';
import { Button } from '@/components/ui/button';

export const ExternalFormAccess = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de acesso não fornecido');
      setLoading(false);
      return;
    }

    // Verificar se já existe sessão ativa
    const existingToken = localStorage.getItem('external_form_token');
    const existingSession = localStorage.getItem('external_form_session');

    if (existingToken && existingSession) {
      try {
        const session = JSON.parse(existingSession);
        if (new Date(session.expires_at) > new Date()) {
          setSessionData(session);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } else {
          // Sessão expirada
          localStorage.removeItem('external_form_token');
          localStorage.removeItem('external_form_session');
        }
      } catch (error) {
        // Erro ao parsear sessão, remover
        localStorage.removeItem('external_form_token');
        localStorage.removeItem('external_form_session');
      }
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

      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, description, is_published, publication_status, allows_anonymous_responses, fields_definition')
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

      // Se permite respostas anônimas, ir direto para o preenchimento
      if (formData.allows_anonymous_responses) {
        setForm(formData);
        setIsAuthenticated(true);
        setSessionData({ anonymous: true });
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

  const handleLoginSuccess = (data: any) => {
    setSessionData(data);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('external_form_token');
    localStorage.removeItem('external_form_session');
    setIsAuthenticated(false);
    setSessionData(null);
  };

  const handleFormSubmit = async (formData: any) => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          response_data: formData,
          submitted_by: sessionData?.anonymous ? null : sessionData?.recipient?.id,
          metadata: {
            is_anonymous: sessionData?.anonymous || false,
            submitted_via: sessionData?.anonymous ? 'anonymous' : 'external_login',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      throw error;
    } finally {
      setSubmitting(false);
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

  if (!isAuthenticated) {
    return (
      <FormExternalLogin
        formId={formId!}
        formTitle={form?.title}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Formulário Enviado!</h3>
            <p className="text-muted-foreground mb-6">
              Sua resposta foi registrada com sucesso. Obrigado por participar!
            </p>
            <Button onClick={() => window.close()}>
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tem campos definidos, usar FormRenderer
  if (form?.fields_definition && form.fields_definition.length > 0) {
    return (
      <FormRenderer
        form={form}
        onSubmit={handleFormSubmit}
        submitting={submitting}
        isAnonymous={sessionData?.anonymous}
      />
    );
  }

  // Fallback para formulários sem campos definidos
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <FormHeader className="mb-8" />
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">{form?.title}</h3>
            {form?.description && (
              <p className="text-muted-foreground mb-6">{form.description}</p>
            )}
            <div className="bg-yellow-50 rounded-lg p-4 max-w-md">
              <p className="text-sm text-yellow-800">
                Este formulário ainda não tem campos definidos. Entre em contato com o administrador.
              </p>
            </div>
            {!sessionData?.anonymous && (
              <div className="mt-6 flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Logado como: {sessionData?.recipient?.name}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};