import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Building, Shield, CheckSquare } from 'lucide-react';

// Import dashboard components
import { DashboardGeneral } from '@/components/dashboards/DashboardGeneral';
import { DashboardUsers } from '@/components/dashboards/DashboardUsers';
import { DashboardDepartments } from '@/components/dashboards/DashboardDepartments';
import { DashboardTasks } from '@/components/dashboards/DashboardTasks';
import { DashboardAudit } from '@/components/dashboards/DashboardAudit';

export const UnifiedDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'geral';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const tabs = [
    {
      id: 'geral',
      label: 'Geral',
      icon: BarChart3,
      component: DashboardGeneral
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: Users,
      component: DashboardUsers
    },
    {
      id: 'departamentos',
      label: 'Departamentos',
      icon: Building,
      component: DashboardDepartments
    },
    {
      id: 'tarefas',
      label: 'Tarefas',
      icon: CheckSquare,
      component: DashboardTasks
    },
    {
      id: 'auditoria',
      label: 'Auditoria',
      icon: Shield,
      component: DashboardAudit
    }
  ];

  return (
    <PageLayout containerClassName="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral e análises do sistema
        </p>
      </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <tab.component />
            </TabsContent>
          ))}
        </Tabs>
    </PageLayout>
  );
};