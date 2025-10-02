import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  X, 
  Download, 
  Eye, 
  Search, 
  Calendar, 
  Users, 
  BarChart3, 
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useFormResults, FormResponseWithUser } from '@/hooks/useFormResults';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ResponseDetailModal } from '@/components/ResponseDetailModal';
import { FilledFormViewer } from '@/components/FilledFormViewer';

interface FormResultsScreenProps {
  formId: string;
  onClose: () => void;
}

export const FormResultsScreen = ({ formId, onClose }: FormResultsScreenProps) => {
  const { form, responses, analytics, loading, exportToCSV } = useFormResults(formId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<FormResponseWithUser | null>(null);
  const [showFilledForm, setShowFilledForm] = useState<FormResponseWithUser | null>(null);

  const filteredResponses = responses.filter(response => 
    response.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.user_department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.values(response.response_data || {}).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{form?.title}</h1>
                <p className="text-muted-foreground">Resultados e Analytics</p>
              </div>
            </div>
            <Button onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics?.totalResponses || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Todas as submissões
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics?.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Formulários completos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Respondentes Únicos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(responses.map(r => r.submitted_by)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Usuários diferentes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Última Resposta</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {responses.length > 0 
                    ? new Date(responses[0].submitted_at).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Data mais recente
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar respostas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredResponses.length} de {responses.length} respostas
            </Badge>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Respostas do Formulário</CardTitle>
              <CardDescription>
                Todas as submissões recebidas para este formulário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredResponses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma resposta encontrada</h3>
                  <p className="text-muted-foreground">
                    {responses.length === 0 
                      ? 'Este formulário ainda não recebeu nenhuma resposta.'
                      : 'Nenhuma resposta corresponde aos filtros aplicados.'
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Campos Preenchidos</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {new Date(response.submitted_at).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(response.submitted_at).toLocaleTimeString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{response.user_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">{response.user_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{response.user_department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {Object.keys(response.response_data || {}).length} campos
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedResponse(response)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalhes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowFilledForm(response)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ver Formulário
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <ResponseDetailModal
          response={selectedResponse}
          form={form}
          onClose={() => setSelectedResponse(null)}
        />
      )}

      {/* Filled Form Viewer */}
      {showFilledForm && (
        <FilledFormViewer
          form={form}
          responseData={showFilledForm.response_data}
          response={showFilledForm}
          onClose={() => setShowFilledForm(null)}
        />
      )}
    </div>
  );
};