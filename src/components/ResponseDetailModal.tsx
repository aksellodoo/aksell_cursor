import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Mail, Building, Monitor, MapPin, FileText } from 'lucide-react';
import { FormResponseWithUser } from '@/hooks/useFormResults';
import { FilledFormViewer } from './FilledFormViewer';

interface ResponseDetailModalProps {
  response: FormResponseWithUser;
  form: any;
  onClose: () => void;
}

export const ResponseDetailModal = ({ response, form, onClose }: ResponseDetailModalProps) => {
  const [showFilledForm, setShowFilledForm] = useState(false);

  const renderFieldValue = (fieldId: string, value: any, fieldDefinition?: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Não preenchido</span>;
    }

    // Handle different field types
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="outline">{String(item)}</Badge>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return <Badge variant={value ? "default" : "secondary"}>{value ? 'Sim' : 'Não'}</Badge>;
    }

    if (fieldDefinition?.type === 'date') {
      return new Date(value).toLocaleDateString('pt-BR');
    }

    if (typeof value === 'object') {
      return <pre className="text-sm bg-muted p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
    }

    return <span className="whitespace-pre-wrap">{String(value)}</span>;
  };

  const getFieldLabel = (fieldId: string) => {
    const field = form?.fields_definition?.find((f: any) => f.id === fieldId);
    return field?.label || fieldId;
  };

  const getFieldDefinition = (fieldId: string) => {
    return form?.fields_definition?.find((f: any) => f.id === fieldId);
  };

  // Se o formulário preenchido está sendo visualizado, renderizar o FilledFormViewer
  if (showFilledForm) {
    return (
      <FilledFormViewer
        form={form}
        responseData={response.response_data}
        response={response}
        onClose={() => setShowFilledForm(false)}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes da Resposta</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilledForm(true)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Ver Formulário Preenchido
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações do Respondente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{response.user_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="font-medium">{response.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departamento</p>
                    <p className="font-medium">{response.user_department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Envio</p>
                    <p className="font-medium">
                      {new Date(response.submitted_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          {(response.ip_address || response.user_agent) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Informações Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {response.ip_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço IP</p>
                        <p className="font-mono text-sm">{response.ip_address}</p>
                      </div>
                    </div>
                  )}
                  {response.user_agent && (
                    <div>
                      <p className="text-sm text-muted-foreground">Navegador</p>
                      <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                        {response.user_agent}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Responses */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas do Formulário</CardTitle>
              <CardDescription>
                Dados preenchidos pelo usuário no formulário "{form?.title}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(response.response_data || {}).map(([fieldId, value], index) => (
                  <div key={fieldId}>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{getFieldLabel(fieldId)}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getFieldDefinition(fieldId)?.type || 'text'}
                        </Badge>
                      </div>
                      <div className="pl-4 border-l-2 border-muted">
                        {renderFieldValue(fieldId, value, getFieldDefinition(fieldId))}
                      </div>
                    </div>
                    {index < Object.entries(response.response_data || {}).length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
                
                {Object.keys(response.response_data || {}).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado nesta resposta
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {response.metadata && Object.keys(response.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadados</CardTitle>
                <CardDescription>
                  Informações adicionais sobre o envio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
                  {JSON.stringify(response.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};