import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, BarChart3, FileText, Users, Calendar, RefreshCw, Eye } from 'lucide-react';
import { useFormResultsAccess } from '@/hooks/useFormResultsAccess';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface FormResultsListProps {
  onViewResults: (form: any) => void;
}

export const FormResultsList = ({ onViewResults }: FormResultsListProps) => {
  const { forms, loading, refetch } = useFormResultsAccess();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published_internal':
        return <Badge variant="default">Interno</Badge>;
      case 'published_external':
        return <Badge variant="secondary">Externo</Badge>;
      case 'published_mixed':
        return <Badge variant="outline">Misto</Badge>;
      case 'task_usage':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Uso em Tarefas</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Estatísticas
  const totalForms = forms.length;
  const formsWithResponses = forms.filter(f => f.has_responses).length;
  const totalResponses = forms.reduce((sum, f) => sum + f.response_count, 0);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Formulários</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalForms}</div>
            <p className="text-xs text-muted-foreground">
              Formulários com acesso aos resultados
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Respostas</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BarChart3 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formsWithResponses}</div>
            <p className="text-xs text-muted-foreground">
              Formulários respondidos
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Respostas coletadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar formulários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button variant="outline" onClick={refetch} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Formulários com Acesso aos Resultados</CardTitle>
          <CardDescription>
            Lista de formulários onde você pode visualizar os resultados e respostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum formulário encontrado'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca.'
                  : 'Você ainda não tem acesso aos resultados de nenhum formulário.'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Respostas</TableHead>
                    <TableHead>Criado por</TableHead>
                    <TableHead>Data de Criação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewResults(form)}
                          disabled={!form.has_responses}
                          title={form.has_responses ? 'Ver resultados' : 'Sem respostas disponíveis'}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{form.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {form.description || 'Sem descrição'}
                      </TableCell>
                      <TableCell>{getStatusBadge(form.publication_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={form.has_responses ? "default" : "outline"}>
                            {form.response_count}
                          </Badge>
                          {form.has_responses && (
                            <span className="text-xs text-green-600">
                              respondido{form.response_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{form.creator_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(form.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};