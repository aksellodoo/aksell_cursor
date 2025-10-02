import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, FileText, User, Calendar, Building, Mail, Eye } from 'lucide-react';
import { FormResponseWithUser } from '@/hooks/useFormResults';

interface FilledFormViewerProps {
  form: any;
  responseData: any;
  response: FormResponseWithUser;
  onClose: () => void;
}

export const FilledFormViewer = ({ form, responseData, response, onClose }: FilledFormViewerProps) => {
  const renderField = (field: any) => {
    const value = responseData[field.id];
    const fieldWidth = field.width === 'full' ? 'col-span-2' : 'col-span-1';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type={field.type}
              value={value || ''}
              disabled
              className="bg-muted"
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              value={value || ''}
              disabled
              className="bg-muted min-h-[100px]"
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ""} disabled>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder={value || field.placeholder || "Nenhuma opção selecionada"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        if (field.options && field.options.length > 1) {
          // Multiple choice checkbox
          const selectedValues = value || [];
          return (
            <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="space-y-2">
                {field.options.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option}`}
                      checked={selectedValues.includes(option)}
                      disabled
                      className="bg-muted"
                    />
                    <Label htmlFor={`${field.id}-${option}`} className="cursor-default">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          // Single checkbox
          return (
            <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={value || false}
                  disabled
                  className="bg-muted"
                />
                <Label htmlFor={field.id} className="cursor-default">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
            </div>
          );
        }

      case 'radio':
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup value={value || ''} disabled>
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option}
                    id={`${field.id}-${option}`}
                    disabled
                    className="bg-muted"
                  />
                  <Label htmlFor={`${field.id}-${option}`} className="cursor-default">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return (
          <div key={field.id} className={`space-y-2 ${fieldWidth}`}>
            <Label>{field.label}</Label>
            <Input
              value={value ? String(value) : ''}
              disabled
              className="bg-muted"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{form?.title}</h1>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                      <Eye className="w-3 h-3 mr-1" />
                      Somente Leitura
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{form?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Respondent Information */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Respondente</p>
                <p className="font-medium">{response.user_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="font-medium">{response.user_email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Departamento</p>
                <p className="font-medium">{response.user_department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Preenchido em</p>
                <p className="font-medium">
                  {new Date(response.submitted_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form?.fields_definition?.map((field: any) => renderField(field))}
              </div>

              {(!form?.fields_definition || form.fields_definition.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Este formulário não possui campos definidos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Footer */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Este é um formulário preenchido em modo somente leitura.</p>
            <p>Os dados não podem ser editados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
