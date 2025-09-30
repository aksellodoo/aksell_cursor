import { useMemo } from 'react';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface TaskAnalyticsProps {
  tasks: Task[];
}

const COLORS = {
  todo: '#6b7280',
  in_progress: '#3b82f6', 
  review: '#f59e0b',
  done: '#10b981',
};

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export const TaskAnalytics = ({ tasks }: TaskAnalyticsProps) => {
  const analytics = useMemo(() => {
    // Status distribution
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'todo' ? 'A Fazer' : 
            status === 'in_progress' ? 'Em Andamento' :
            status === 'review' ? 'Em Revisão' : 'Concluída',
      value: count,
      fill: COLORS[status as keyof typeof COLORS],
    }));

    // Priority distribution
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityData = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority === 'low' ? 'Baixa' :
               priority === 'medium' ? 'Média' :
               priority === 'high' ? 'Alta' : 'Urgente',
      count,
      fill: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS],
    }));

    // Tasks by assignee
    const assigneeCounts = tasks.reduce((acc, task) => {
      const assignee = task.assigned_user?.name || 'Não atribuído';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const assigneeData = Object.entries(assigneeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== 'done'
    ).length;

    // Completion rate
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return {
      statusData,
      priorityData, 
      assigneeData,
      overdueTasks,
      completionRate,
      totalTasks: tasks.length,
      completedTasks,
    };
  }, [tasks]);

  const chartConfig = {
    count: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
    value: {
      label: "Valor", 
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Resumo em cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{analytics.totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{analytics.overdueTasks}</p>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 5 Responsáveis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 Responsáveis por Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.assigneeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};