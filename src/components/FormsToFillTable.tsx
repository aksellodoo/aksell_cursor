import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFormsToFill, FormToFill } from '@/hooks/useFormsToFill';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Search, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const FormsToFillTable = () => {
  const { forms, loading, refetch } = useFormsToFill();
  const [searchTerm, setSearchTerm] = useState('');

  console.log('FormsToFillTable: loading=', loading, 'forms=', forms.length);

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (form: FormToFill) => {
    if (form.has_responded) {
      if (form.max_responses && form.response_count >= form.max_responses) {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completo</Badge>;
      }
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Respondido</Badge>;
    }

    if (form.response_deadline) {
      const deadline = new Date(form.response_deadline);
      const now = new Date();
      const isOverdue = now > deadline;
      
      if (isOverdue) {
        return <Badge variant="destructive">Vencido</Badge>;
      }
      
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilDeadline <= 24) {
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Urgente</Badge>;
      }
    }

    return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Pendente</Badge>;
  };

  const getDeadlineText = (deadline?: string) => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const isOverdue = now > deadlineDate;
    
    if (isOverdue) {
      return (
        <span className="text-red-600 text-sm flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Venceu {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: ptBR })}
        </span>
      );
    }
    
    return (
      <span className="text-muted-foreground text-sm flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Vence {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: ptBR })}
      </span>
    );
  };

  const handleRespondForm = (formId: string) => {
    // Aqui você pode implementar a navegação para o formulário
    window.open(`/formulario/${formId}`, '_blank');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Formulários a Preencher</h2>
          <p className="text-muted-foreground">
            Formulários que você precisa responder
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Atualizar'}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar formulários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {forms.filter(f => !f.has_responded).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respondidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {forms.filter(f => f.has_responded).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {forms.filter(f => {
                if (!f.response_deadline) return false;
                return new Date() > new Date(f.response_deadline) && !f.has_responded;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms Table */}
      {filteredForms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum formulário encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? 'Nenhum formulário corresponde à sua busca.'
                : 'Você não tem formulários para preencher no momento.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{form.title}</div>
                      {form.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {form.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(form)}
                  </TableCell>
                  
                  <TableCell>
                    {getDeadlineText(form.response_deadline)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {form.response_count}
                      {form.max_responses && ` / ${form.max_responses}`}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(form.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleRespondForm(form.id)}
                      disabled={form.max_responses !== null && form.response_count >= form.max_responses}
                    >
                      {form.has_responded ? 'Ver Respostas' : 'Responder'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};