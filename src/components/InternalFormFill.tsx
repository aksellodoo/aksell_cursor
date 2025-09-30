import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormRenderer } from '@/components/FormRenderer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useForms } from '@/hooks/useForms';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

export const InternalFormFill = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { forms, loading: formsLoading, submitFormResponse } = useForms();
  const [submitting, setSubmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const form = forms.find(f => f.id === id);

  useEffect(() => {
    if (!form || !user || !profile || formsLoading || profileLoading) return;

    // Verificar se o usuário tem permissão para preencher este formulário
    const checkPermission = () => {
      // Verificar recipients internos
      const internalRecipients = form.internal_recipients || {};
      
      // Verificar se está nos usuários específicos
      if (internalRecipients.users && internalRecipients.users.includes(user.id)) {
        return true;
      }
      
      // Verificar se está no departamento
      if (internalRecipients.departments && profile.department_id && 
          internalRecipients.departments.includes(profile.department_id)) {
        return true;
      }
      
      // Verificar se está nos roles
      if (internalRecipients.roles && profile.role && 
          internalRecipients.roles.includes(profile.role)) {
        return true;
      }
      
      // Verificar se é "todos os usuários"
      if (internalRecipients.all_users) {
        return true;
      }
      
      return false;
    };

    setHasPermission(checkPermission());
  }, [form, user, profile, formsLoading, profileLoading]);

  const handleSubmit = async (formData: any) => {
    if (!form || !user) return;

    setSubmitting(true);
    try {
      await submitFormResponse(form.id, {
        form_id: form.id,
        submitted_by: user.id,
        response_data: formData,
        submitted_at: new Date().toISOString()
      });
      
      toast.success('Formulário enviado com sucesso!');
      navigate('/formularios');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Erro ao enviar formulário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/formularios');
  };

  if (formsLoading || profileLoading) {
    return <LoadingSpinner />;
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Formulário não encontrado</h3>
              <p className="text-muted-foreground text-center mb-6">
                O formulário solicitado não existe ou não está disponível.
              </p>
              <Button onClick={handleGoBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Formulários
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Acesso negado</h3>
              <p className="text-muted-foreground text-center mb-6">
                Você não tem permissão para preencher este formulário.
              </p>
              <Button onClick={handleGoBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar aos Formulários
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasPermission === null) {
    return <LoadingSpinner />;
  }

  return (
    <FormRenderer
      form={form}
      onSubmit={handleSubmit}
      submitting={submitting}
      isAnonymous={false}
      backTo="/formularios"
    />
  );
};

export default InternalFormFill;