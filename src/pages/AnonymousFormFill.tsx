import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormRenderer } from '@/components/FormRenderer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AnonymousFormFill = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', resolvedFormId)
        .eq('is_published', true)
        .eq('allows_anonymous_responses', true)
        .single();

      if (formError) {
        if (formError.code === 'PGRST116') {
          setError('Formulário não encontrado, não está publicado ou não permite respostas anônimas');
        } else {
          setError('Erro ao carregar formulário');
        }
        return;
      }

      if (!formData.is_published) {
        setError('Este formulário não está mais disponível');
        return;
      }

      if (!formData.allows_anonymous_responses) {
        setError('Este formulário não permite respostas anônimas');
        return;
      }

      if (!['published_external', 'published_mixed'].includes(formData.publication_status)) {
        setError('Este formulário não está disponível para acesso externo');
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

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          response_data: formData,
          metadata: {
            is_anonymous: true,
            submitted_via: 'anonymous_link',
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
            <Button onClick={() => navigate('/site/home/pt')}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FormRenderer
      form={form}
      onSubmit={handleSubmit}
      submitting={submitting}
      isAnonymous={true}
      showBackButton={false}
      backTo="/"
    />
  );
};