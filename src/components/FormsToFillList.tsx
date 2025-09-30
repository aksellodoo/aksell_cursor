import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormsToFill, FormToFill, FormsToFillFilters } from '@/hooks/useFormsToFill';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Search, FileText, Clock, CheckCircle, AlertCircle, Users, User, Filter, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface FormsToFillListProps {
  variant?: 'full' | 'compact';
  onlyPending?: boolean;
  limit?: number;
  compactHeader?: boolean;
}

export const FormsToFillList = ({ 
  variant = 'full', 
  onlyPending = false, 
  limit,
  compactHeader = true
}: FormsToFillListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FormsToFillFilters>({ scope: 'my_forms' });
  
  const { forms, loading, refetch, subordinatesData } = useFormsToFill(filters);

  console.log('FormsToFillList: loading=', loading, 'forms=', forms.length, 'filters=', filters);

  let filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.assigned_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply additional filters for compact mode
  if (onlyPending) {
    filteredForms = filteredForms.filter(form => !form.has_responded);
  }
  
  if (limit) {
    filteredForms = filteredForms.slice(0, limit);
  }

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

  const handleRespondForm = (form: FormToFill) => {
    // Se for um formulário de subordinado, abrir em modo visualização
    if (form.assigned_user_id && form.assigned_user_id !== user?.id) {
      // TODO: Implementar visualização de formulário de subordinado
      console.log('Visualizar formulário do subordinado:', form.assigned_user_name);
      return;
    }
    
    // Abrir formulário para preenchimento interno (usuários autenticados)
    window.open(`/formularios/${form.id}/preencher`, '_blank');
  };

  const handleScopeChange = (scope: 'my_forms' | 'team_forms') => {
    setFilters(prev => ({ 
      scope, 
      department_id: undefined, 
      user_id: undefined 
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      department_id: departmentId === 'all' ? undefined : departmentId,
      user_id: undefined 
    }));
  };

  const handleUserChange = (userId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      user_id: userId === 'all' ? undefined : userId 
    }));
  };

  // Estatísticas
  const stats = {
    total: filteredForms.length,
    pending: filteredForms.filter(f => !f.has_responded).length,
    completed: filteredForms.filter(f => f.has_responded).length,
    overdue: filteredForms.filter(f => {
      if (!f.response_deadline) return false;
      return new Date() > new Date(f.response_deadline) && !f.has_responded;
    }).length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Show header, filters and stats only in full mode */}
      {variant === 'full' && (
        <>
          {/* Header with filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Scope Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select 
                  value={filters.scope} 
                  onValueChange={handleScopeChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="my_forms">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Meus Formulários
                      </div>
                    </SelectItem>
                    {subordinatesData.subordinates.length > 0 && (
                      <SelectItem value="team_forms">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Da Minha Equipe
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Filter - only show when scope is team_forms */}
              {filters.scope === 'team_forms' && subordinatesData.departments.length > 1 && (
                <Select 
                  value={filters.department_id || 'all'} 
                  onValueChange={handleDepartmentChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {subordinatesData.departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* User Filter - only show when scope is team_forms */}
              {filters.scope === 'team_forms' && subordinatesData.subordinates.length > 1 && (
                <Select 
                  value={filters.user_id || 'all'} 
                  onValueChange={handleUserChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {subordinatesData.subordinates.map((subordinate: any) => (
                      <SelectItem key={subordinate.id} value={subordinate.id}>
                        {subordinate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar formulários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Total</h3>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Pendentes</h3>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Respondidos</h3>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Vencidos</h3>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Compact mode header */}
      {variant === 'compact' && compactHeader && filteredForms.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">Formulários Pendentes</h3>
          <Badge variant="secondary" className="text-xs">{filteredForms.length}</Badge>
        </div>
      )}

      {/* Forms List */}
      {filteredForms.length === 0 ? (
        variant === 'full' ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum formulário encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? 'Nenhum formulário corresponde à sua busca.'
                  : filters.scope === 'my_forms'
                  ? 'Você não tem formulários para preencher no momento.'
                  : 'Sua equipe não tem formulários para preencher no momento.'
                }
              </p>
            </CardContent>
          </Card>
        ) : null
      ) : (
        <div className={variant === 'compact' ? "space-y-3" : "grid gap-4"}>
          {filteredForms.map((form) => (
            <Card key={`${form.id}-${form.assigned_user_id}`} className={`hover:shadow-md transition-shadow animate-fade-in ${variant === 'compact' ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardContent className={variant === 'compact' ? "p-4" : "p-6"}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Form info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {variant === 'compact' && (
                            <Badge variant="outline" className="text-xs">Formulário</Badge>
                          )}
                          <h3 className={`font-semibold ${variant === 'compact' ? 'text-base' : 'text-lg'}`}>{form.title}</h3>
                        </div>
                        {form.description && variant === 'full' && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {form.description}
                          </p>
                        )}
                      </div>
                      {variant === 'full' && getStatusBadge(form)}
                    </div>

                    {/* Form metadata - simplified for compact */}
                    <div className={`flex flex-wrap items-center gap-3 text-sm text-muted-foreground ${variant === 'compact' ? 'text-xs' : ''}`}>
                      {/* Assigned user info (for team forms) */}
                      {variant === 'full' && filters.scope === 'team_forms' && form.assigned_user_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{form.assigned_user_name}</span>
                          <span className="text-xs">({form.assigned_department_name})</span>
                        </div>
                      )}

                      {/* Response count - simplified for compact */}
                      {variant === 'full' && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            {form.response_count} resposta{form.response_count !== 1 ? 's' : ''}
                            {form.max_responses && ` / ${form.max_responses}`}
                          </span>
                        </div>
                      )}

                      {/* Created date */}
                      <div className="flex items-center gap-1">
                        <Clock className={variant === 'compact' ? "w-3 h-3" : "w-3 h-3"} />
                        <span>
                          {variant === 'compact' ? 'Criado ' : 'Criado '}
                          {formatDistanceToNow(new Date(form.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Deadline */}
                    {form.response_deadline && (
                      <div>
                        {getDeadlineText(form.response_deadline)}
                      </div>
                    )}
                  </div>

                  {/* Right side - Action button */}
                  <div className="flex-shrink-0">
                    <Button
                      size={variant === 'compact' ? "sm" : "lg"}
                      onClick={() => handleRespondForm(form)}
                      disabled={form.max_responses !== null && form.response_count >= form.max_responses}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {form.assigned_user_id && form.assigned_user_id !== user?.id
                        ? 'Visualizar'
                        : form.has_responded 
                        ? 'Ver Respostas' 
                        : 'Preencher'
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};