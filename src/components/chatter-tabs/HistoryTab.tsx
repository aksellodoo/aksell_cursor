import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Edit3 } from "lucide-react";
import { useChatter } from "@/hooks/useChatter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryTabProps {
  recordType: string;
  recordId: string;
}

export const HistoryTab = ({ recordType, recordId }: HistoryTabProps) => {
  const { auditLogs, loading } = useChatter(recordType, recordId);

  const getChangeIcon = (fieldName: string) => {
    return <Edit3 className="h-4 w-4" />;
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldMappings: Record<string, string> = {
      // User fields
      name: "Nome",
      email: "Email",
      role: "Função",
      status: "Status",
      department: "Departamento",
      is_leader: "Liderança",
      
      // Employee fields
      full_name: "Nome Completo",
      employee_code: "Código do Funcionário",
      cpf: "CPF",
      position: "Cargo",
      salary: "Salário",
      hire_date: "Data de Admissão",
      termination_date: "Data de Demissão",
      birth_date: "Data de Nascimento",
      phone: "Telefone",
      gender: "Gênero",
      contract_type: "Tipo de Contrato",
      supervisor_id: "Supervisor",
      rg: "RG",
      notes: "Observações",
      
      // Task fields
      title: "Título",
      description: "Descrição",
      priority: "Prioridade",
      assigned_to: "Responsável",
      due_date: "Data de vencimento",
      
      // Department fields
      color: "Cor",
    };
    
    return fieldMappings[fieldName] || fieldName;
  };

  const formatValue = (value: string | null, fieldName?: string) => {
    if (!value || value === 'null') return 'Vazio';
    
    // Format dates
    if (value.includes('T') && value.includes('Z')) {
      try {
        return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      } catch {
        return value;
      }
    }
    
    // Format date fields without time
    if (fieldName && (fieldName.includes('date') || fieldName.includes('birth'))) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return format(date, "dd/MM/yyyy", { locale: ptBR });
        }
      } catch {
        return value;
      }
    }
    
    // Format salary
    if (fieldName === 'salary' && !isNaN(Number(value))) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(value));
    }
    
    // Format boolean values
    if (value === 'true' || value === 'false') {
      return value === 'true' ? 'Sim' : 'Não';
    }
    
    return value;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Histórico</h3>
          <Badge variant="outline">Carregando...</Badge>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico</h3>
        <Badge variant="outline">{auditLogs.length} alterações</Badge>
      </div>

      {auditLogs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma alteração registrada</p>
            <p className="text-xs text-muted-foreground mt-1">
              O histórico de mudanças aparecerá aqui conforme o registro for modificado
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={log.changer?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {log.changer?.name?.charAt(0).toUpperCase() || <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-muted rounded">
                          {getChangeIcon(log.field_name)}
                        </div>
                        <p className="text-sm font-medium">
                          {log.changer?.name || 'Sistema'} alterou{' '}
                          <span className="text-primary">{getFieldDisplayName(log.field_name)}</span>
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {log.old_value && (
                          <div>
                            <span className="font-medium">De:</span>{' '}
                            <span className="bg-red-500/10 text-red-700 px-1 rounded">
                              {formatValue(log.old_value, log.field_name)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Para:</span>{' '}
                          <span className="bg-green-500/10 text-green-700 px-1 rounded">
                            {formatValue(log.new_value, log.field_name)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};