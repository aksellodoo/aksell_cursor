import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpen, 
  Play, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Zap,
  Target
} from "lucide-react";

export const WorkflowTemplateHelp = () => {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        
        {/* Introdução */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">O que são Templates de Workflow?</h3>
          </div>
          <p className="text-muted-foreground">
            Templates são modelos pré-configurados de workflows que podem ser reutilizados para criar novos processos rapidamente. 
            Eles contêm toda a estrutura, fluxo de aprovações e configurações necessárias para automatizar processos comuns.
          </p>
        </div>

        <Separator />

        {/* Como usar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Como Usar um Template</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">1</Badge>
              <div>
                <p className="font-medium">Escolha o Template</p>
                <p className="text-sm text-muted-foreground">Navegue pela lista e encontre o template que melhor se adequa ao seu processo.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">2</Badge>
              <div>
                <p className="font-medium">Visualize o Fluxo</p>
                <p className="text-sm text-muted-foreground">Clique em "Visualizar" para ver como o workflow funciona antes de usar.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">3</Badge>
              <div>
                <p className="font-medium">Personalize o Workflow</p>
                <p className="text-sm text-muted-foreground">Clique em "Usar Template" e defina um nome único para seu workflow.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="shrink-0">4</Badge>
              <div>
                <p className="font-medium">Configure os Detalhes</p>
                <p className="text-sm text-muted-foreground">Ajuste prioridade, confidencialidade, departamentos e outras configurações.</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tipos de Triggers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Tipos de Triggers (Gatilhos)</h3>
          </div>
          <div className="grid gap-4">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertTitle>Manual</AlertTitle>
              <AlertDescription>
                O workflow é iniciado manualmente por um usuário. Ideal para processos sob demanda.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Agendado</AlertTitle>
              <AlertDescription>
                Executado automaticamente em horários específicos (diário, semanal, mensal).
                <br /><strong>Configuração:</strong> Defina a frequência na seção de triggers.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>Inatividade de Usuário</AlertTitle>
              <AlertDescription>
                Acionado quando um usuário fica inativo por um período determinado.
                <br /><strong>Configuração:</strong> Selecione o usuário e defina o tempo limite (ex: 30 dias).
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Target className="h-4 w-4" />
              <AlertTitle>Evento do Sistema</AlertTitle>
              <AlertDescription>
                Acionado por ações específicas no sistema (novo cadastro, alteração de status, etc.).
                <br /><strong>Configuração:</strong> Escolha o evento que deve disparar o workflow.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <Separator />

        {/* Configurações Avançadas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Configurações Importantes</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Níveis de Confidencialidade
              </h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li><strong>Público:</strong> Qualquer usuário autenticado pode ver e usar</li>
                <li><strong>Líderes de Departamento:</strong> Apenas líderes e cargos superiores</li>
                <li><strong>Diretores e Administradores:</strong> Apenas diretores e administradores</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Prioridades
              </h4>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li><strong>Baixa:</strong> Processos não urgentes, pode aguardar</li>
                <li><strong>Média:</strong> Processos rotineiros do dia a dia</li>
                <li><strong>Alta:</strong> Processos importantes que precisam de atenção</li>
                <li><strong>Urgente:</strong> Processos críticos que requerem ação imediata</li>
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        {/* Melhores Práticas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Melhores Práticas</h3>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">💡</Badge>
              <p className="text-sm">Use nomes descritivos para seus workflows (ex: "Solicitação de Férias - Equipe Marketing")</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">⚡</Badge>
              <p className="text-sm">Teste sempre um template com dados fictícios antes de usar em produção</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">👥</Badge>
              <p className="text-sm">Configure os aprovadores corretos para cada etapa do processo</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">📧</Badge>
              <p className="text-sm">Personalize as notificações para incluir informações relevantes</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">🔄</Badge>
              <p className="text-sm">Revise e atualize seus workflows periodicamente para manter a eficiência</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Exemplos Práticos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Exemplos de Uso por Departamento</h3>
          </div>
          
          <div className="grid gap-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-sm">👥 Recursos Humanos</h4>
              <p className="text-xs text-muted-foreground">Contratação, férias, avaliação de desempenho, offboarding</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-sm">💰 Financeiro</h4>
              <p className="text-xs text-muted-foreground">Aprovação de orçamentos, processos de compra, controle de despesas</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-sm">💻 TI</h4>
              <p className="text-xs text-muted-foreground">Chamados de suporte, provisionamento de acesso, manutenção</p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium text-sm">📈 Vendas</h4>
              <p className="text-xs text-muted-foreground">Qualificação de leads, onboarding de clientes, propostas</p>
            </div>
          </div>
        </div>

        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Precisa de Ajuda?</AlertTitle>
          <AlertDescription>
            Se você tiver dúvidas sobre configuração de workflows ou templates, entre em contato com a equipe de TI 
            ou consulte a documentação completa no portal da empresa.
          </AlertDescription>
        </Alert>
      </div>
    </ScrollArea>
  );
};