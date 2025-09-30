import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, ListTodo, CheckCircle, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface TasksTabProps {
  recordType: string;
  recordId: string;
}

const taskTypes = [
  {
    id: "call",
    name: "Ligação",
    icon: Phone,
    description: "Agendar ou registrar uma ligação",
    color: "bg-blue-500/10 text-blue-700 border-blue-200"
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    description: "Enviar ou acompanhar email",
    color: "bg-green-500/10 text-green-700 border-green-200"
  },
  {
    id: "meeting",
    name: "Reunião",
    icon: Calendar,
    description: "Agendar reunião ou encontro",
    color: "bg-purple-500/10 text-purple-700 border-purple-200"
  },
  {
    id: "task",
    name: "Tarefa",
    icon: ListTodo,
    description: "Criar tarefa geral",
    color: "bg-orange-500/10 text-orange-700 border-orange-200"
  },
  {
    id: "approval",
    name: "Aprovação",
    icon: CheckCircle,
    description: "Processo de aprovação",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-200"
  },
  {
    id: "document",
    name: "Documento",
    icon: FileText,
    description: "Criar ou revisar documento",
    color: "bg-indigo-500/10 text-indigo-700 border-indigo-200"
  }
];

export const TasksTab = ({ recordType, recordId }: TasksTabProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateTask = (taskType: string) => {
    setSelectedType(taskType);
    const params = new URLSearchParams();
    params.set('origin', 'fixed');
    params.set('record_type', recordType);
    params.set('record_id', recordId);
    params.set('fixed_type', taskType);
    navigate(`/tasks/new?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tarefas</h3>
        <Badge variant="outline">Relacionadas ao registro</Badge>
      </div>

      {/* Task Creation Types */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-4">Criar nova tarefa</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  selectedType === type.id ? type.color : "hover:border-primary/20"
                )}
                onClick={() => handleCreateTask(type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedType === type.id ? type.color : "bg-muted"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm">{type.name}</h5>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Existing Tasks List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-muted-foreground">Tarefas existentes</h4>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ver todas
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-8 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhuma tarefa encontrada para este registro</p>
              <p className="text-xs mt-1">Crie uma nova tarefa usando os botões acima</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
