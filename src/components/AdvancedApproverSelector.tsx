import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, User, Building, X } from 'lucide-react';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useDepartments, Department } from '@/hooks/useDepartments';

export interface ApprovalSelection {
  specificUsers: string[];
  roleSelections: string[];
  departmentSelections: string[];
}

interface AdvancedApproverSelectorProps {
  value: ApprovalSelection;
  onChange: (selection: ApprovalSelection) => void;
  approvalFormat: 'single' | 'any' | 'all';
}

const roleOptions = [
  { value: 'admin', label: 'Administradores', icon: User },
  { value: 'director', label: 'Diretores', icon: User },
  { value: 'hr', label: 'RH', icon: User },
  { value: 'leader', label: 'Líderes', icon: Users },
  { value: 'user', label: 'Usuários', icon: User },
];

export const AdvancedApproverSelector: React.FC<AdvancedApproverSelectorProps> = ({
  value,
  onChange,
  approvalFormat
}) => {
  const { profiles, loading: profilesLoading } = useProfiles();
  const { departments, loading: departmentsLoading } = useDepartments();
  const [activeTab, setActiveTab] = useState('users');

  console.log('AdvancedApproverSelector - profiles:', profiles.length, 'departments:', departments.length);
  console.log('AdvancedApproverSelector - loading states:', { profilesLoading, departmentsLoading });

  // Use profiles directly since useProfiles already filters test users
  const filteredProfiles = useMemo(() => {
    return profiles;
  }, [profiles]);

  // Calculate resolved approvers count
  const resolvedApprovers = useMemo(() => {
    const usersByRole: Record<string, Profile[]> = {
      admin: filteredProfiles.filter(p => p.role === 'admin'),
      director: filteredProfiles.filter(p => p.role === 'director'),
      hr: filteredProfiles.filter(p => p.role === 'hr'),
      leader: filteredProfiles.filter(p => p.is_leader && !['admin', 'director', 'hr'].includes(p.role)),
      user: filteredProfiles.filter(p => p.role === 'user' || (!p.is_leader && !['admin', 'director', 'hr'].includes(p.role))),
    };

    let totalCount = 0;
    const summary: string[] = [];

    // Count specific users
    if (value.specificUsers.length > 0) {
      totalCount += value.specificUsers.length;
      summary.push(`${value.specificUsers.length} usuário${value.specificUsers.length > 1 ? 's' : ''} específico${value.specificUsers.length > 1 ? 's' : ''}`);
    }

    // Count role-based selections
    value.roleSelections.forEach(role => {
      const count = usersByRole[role]?.length || 0;
      totalCount += count;
      const roleLabel = roleOptions.find(r => r.value === role)?.label || role;
      if (count > 0) {
        summary.push(`${count} ${roleLabel.toLowerCase()}`);
      }
    });

    // Count department-based selections
    value.departmentSelections.forEach(deptId => {
      const dept = departments.find(d => d.id === deptId);
      const count = filteredProfiles.filter(p => p.department_id === deptId).length;
      totalCount += count;
      if (count > 0 && dept) {
        summary.push(`${count} do ${dept.name}`);
      }
    });

    return { totalCount, summary };
  }, [value, filteredProfiles, departments]);

  const handleSpecificUserChange = (userId: string, checked: boolean) => {
    const newUsers = checked 
      ? [...value.specificUsers, userId]
      : value.specificUsers.filter(id => id !== userId);
    
    onChange({
      ...value,
      specificUsers: newUsers
    });
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    const newRoles = checked 
      ? [...value.roleSelections, role]
      : value.roleSelections.filter(r => r !== role);
    
    onChange({
      ...value,
      roleSelections: newRoles
    });
  };

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    const newDepartments = checked 
      ? [...value.departmentSelections, departmentId]
      : value.departmentSelections.filter(id => id !== departmentId);
    
    onChange({
      ...value,
      departmentSelections: newDepartments
    });
  };

  const clearAll = () => {
    onChange({
      specificUsers: [],
      roleSelections: [],
      departmentSelections: []
    });
  };

  const formatApprovalType = () => {
    switch (approvalFormat) {
      case 'single': return 'Aprovação única';
      case 'any': return 'Qualquer um pode';
      case 'all': return 'Todos devem aprovar';
      default: return 'Configuração';
    }
  };

  // Show loading state if data is still loading
  if (profilesLoading || departmentsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando usuários e departamentos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message if no data available
  if (profiles.length === 0 && departments.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum usuário ou departamento encontrado</p>
              <p className="text-sm">Verifique se existem usuários ativos no sistema.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 h-5" />
            Resumo da Seleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{resolvedApprovers.totalCount}</p>
              <p className="text-sm text-muted-foreground">
                {formatApprovalType()} • {resolvedApprovers.totalCount} pessoa{resolvedApprovers.totalCount !== 1 ? 's' : ''} selecionada{resolvedApprovers.totalCount !== 1 ? 's' : ''}
              </p>
              {resolvedApprovers.summary.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {resolvedApprovers.summary.join(' + ')}
                </p>
              )}
            </div>
            {resolvedApprovers.totalCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="h-4 w-4 mr-1" />
                Limpar Tudo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funções
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Departamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Específicos</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum usuário disponível</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${profile.id}`}
                        checked={value.specificUsers.includes(profile.id)}
                        onCheckedChange={(checked) => handleSpecificUserChange(profile.id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`user-${profile.id}`} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {profile.name} - {
                          profile.role === 'director' ? 'Diretor' : 
                          profile.role === 'admin' ? 'Administrador' : 
                          profile.role === 'hr' ? 'RH' :
                          profile.is_leader ? 'Líder' : 'Usuário'
                        }
                      </Label>
                      {profile.department && (
                        <Badge variant="secondary" className="text-xs">
                          {profile.department}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Por Função/Cargo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleOptions.map((role) => {
                  const usersInRole = filteredProfiles.filter(p => {
                    if (role.value === 'leader') {
                      return p.is_leader && !['admin', 'director', 'hr'].includes(p.role);
                    }
                    if (role.value === 'user') {
                      return p.role === 'user' || (!p.is_leader && !['admin', 'director', 'hr'].includes(p.role));
                    }
                    return p.role === role.value;
                  });

                  return (
                    <div key={role.value} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.value}`}
                          checked={value.roleSelections.includes(role.value)}
                          onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                        />
                        <Label 
                          htmlFor={`role-${role.value}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {role.label}
                        </Label>
                      </div>
                      <Badge variant="outline">
                        {usersInRole.length} usuário{usersInRole.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum departamento disponível</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-4">
                  {departments.map((dept) => {
                    const usersInDept = filteredProfiles.filter(p => p.department_id === dept.id);
                    
                    return (
                      <div key={dept.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={value.departmentSelections.includes(dept.id)}
                            onCheckedChange={(checked) => handleDepartmentChange(dept.id, checked as boolean)}
                          />
                          <Label 
                            htmlFor={`dept-${dept.id}`} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {dept.name}
                          </Label>
                        </div>
                        <Badge variant="outline">
                          {usersInDept.length} usuário{usersInDept.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};