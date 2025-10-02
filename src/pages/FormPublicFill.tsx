import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useFormInvitations } from '@/hooks/useFormInvitations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, Calendar, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FormPublicFill() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { validateToken, markAsResponded } = useFormInvitations();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadFormByToken();
  }, [token]);

  const loadFormByToken = async () => {
    if (!token) {
      setError('Token inválido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Validate token and get invitation
      const invitationData = await validateToken(token);

      if (!invitationData) {
        setError('Link inválido ou expirado');
        setIsLoading(false);
        return;
      }

      // Check if already responded
      if (invitationData.responded_at) {
        setError('Este formulário já foi respondido');
        setIsSubmitted(true);
        setIsLoading(false);
        return;
      }

      setInvitation(invitationData);

      // Load form data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', invitationData.form_id)
        .single();

      if (formError) throw formError;

      // Check if form is still accepting responses
      const deadline = formData.publication_settings?.response_deadline || formData.settings?.deadline;
      if (deadline && new Date(deadline) < new Date()) {
        setError('O prazo para responder este formulário expirou');
        setIsLoading(false);
        return;
      }

      setForm(formData);
      setIsLoading(false);

    } catch (error: any) {
      console.error('Error loading form:', error);
      setError('Erro ao carregar formulário');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form || !invitation) return;

    try {
      setIsSubmitting(true);

      // Validate required fields
      const fields = form.fields_definition || [];
      const requiredFields = fields.filter((f: any) => f.required);
      const missingFields = requiredFields.filter((f: any) => !formData[f.id]);

      if (missingFields.length > 0) {
        toast.error(`Por favor, preencha todos os campos obrigatórios`);
        setIsSubmitting(false);
        return;
      }

      // Submit response
      const { data: response, error: responseError } = await supabase
        .from('form_responses')
        .insert({
          form_id: form.id,
          response_data: formData,
          metadata: {
            submitted_via: 'public_link',
            invitation_id: invitation.id,
            contact_id: invitation.contact_id
          }
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Mark invitation as responded
      await markAsResponded(invitation.id, response.id);

      setIsSubmitted(true);
      toast.success('Formulário enviado com sucesso!');

    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error('Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            required={field.required}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            className="w-full border rounded-md p-2"
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            required={field.required}
          >
            <option value="">Selecione...</option>
            {field.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-muted-foreground">Carregando formulário...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {isSubmitted ? 'Formulário Já Respondido' : 'Erro'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={isSubmitted ? "default" : "destructive"}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {isSubmitted && (
              <p className="text-sm text-muted-foreground mt-4">
                Obrigado por sua participação!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Formulário Enviado!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Sua resposta foi registrada com sucesso.
              </p>
              <p className="text-sm text-muted-foreground">
                Obrigado pela sua participação!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form view
  if (!form) return null;

  const fields = form.fields_definition || [];
  const deadline = form.publication_settings?.response_deadline || form.settings?.deadline;
  const estimatedMinutes = form.publication_settings?.estimated_fill_minutes || form.settings?.estimated_fill_minutes;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base mt-2">
                {form.description}
              </CardDescription>
            )}

            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              {estimatedMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>~{estimatedMinutes} minutos</span>
                </div>
              )}
              {deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Prazo: {format(new Date(deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            {invitation?.contact && (
              <p className="text-sm text-muted-foreground mt-2">
                Olá, <strong>{invitation.contact.name}</strong>
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                  {field.placeholder && (
                    <p className="text-xs text-muted-foreground">{field.placeholder}</p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Resposta
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Aksell Nutrition Ltda.
        </p>
      </div>
    </div>
  );
}
