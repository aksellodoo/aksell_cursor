import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Lock, Users, Building, Shield } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';

interface FormConfidentialitySettingsProps {
  confidentialityLevel: 'public' | 'private';
  allowedUsers?: string[];
  allowedDepartments?: string[];
  allowedRoles?: string[];
  onChange: (settings: {
    confidentialityLevel: 'public' | 'private';
    allowedUsers?: string[];
    allowedDepartments?: string[];
    allowedRoles?: string[];
  }) => void;
}

const roleOptions = [
  { value: 'admin', label: 'Administradores', icon: Shield },
  { value: 'director', label: 'Diretores', icon: Users },
  { value: 'hr', label: 'Recursos Humanos', icon: Building },
  { value: 'user', label: 'Usuários', icon: Users },
];

export function FormConfidentialitySettings({
  confidentialityLevel,
  allowedUsers = [],
  allowedDepartments = [],
  allowedRoles = [],
  onChange
}: FormConfidentialitySettingsProps) {
  const { profiles } = useProfiles();
  const { departments } = useDepartments();

  const handleConfidentialityChange = (level: 'public' | 'private') => {
    onChange({
      confidentialityLevel: level,
      allowedUsers: level === 'private' ? allowedUsers : [],
      allowedDepartments: level === 'private' ? allowedDepartments : [],
      allowedRoles: level === 'private' ? allowedRoles : [],
    });
  };

  const handleUserChange = (userId: string, checked: boolean) => {
    const newUsers = checked
      ? [...allowedUsers, userId]
      : allowedUsers.filter(id => id !== userId);
    
    onChange({
      confidentialityLevel,
      allowedUsers: newUsers,
      allowedDepartments,
      allowedRoles,
    });
  };

  const handleDepartmentChange = (departmentId: string, checked: boolean) => {
    const newDepartments = checked
      ? [...allowedDepartments, departmentId]
      : allowedDepartments.filter(id => id !== departmentId);
    
    onChange({
      confidentialityLevel,
      allowedUsers,
      allowedDepartments: newDepartments,
      allowedRoles,
    });
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    const newRoles = checked
      ? [...allowedRoles, role]
      : allowedRoles.filter(r => r !== role);
    
    onChange({
      confidentialityLevel,
      allowedUsers,
      allowedDepartments,
      allowedRoles: newRoles,
    });
  };

  // Calcular resumo dos aprovadores selecionados
  const usersCount = allowedUsers.length;
  const departmentsCount = allowedDepartments.length;
  const rolesCount = allowedRoles.length;
  const totalCount = usersCount + departmentsCount + rolesCount;

  return (
    <div className="space-y-6">
      {/* Seleção de Nível de Confidencialidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Nível de Confidencialidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={confidentialityLevel} 
            onValueChange={handleConfidentialityChange}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="public" id="public" />
              <div className="flex-1">
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Público</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Qualquer usuário autenticado pode acessar este formulário
                </p>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-200">
                Público
              </Badge>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="private" id="private" />
              <div className="flex-1">
                <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Privado</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas usuários, departamentos ou roles específicos podem acessar
                </p>
              </div>
              <Badge variant="outline" className="text-orange-700 border-orange-200">
                Privado
              </Badge>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Configurações para Formulários Privados */}
      {confidentialityLevel === 'private' && (
        <>
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Resumo do Acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {totalCount === 0 ? (
                  <Badge variant="destructive">Nenhum acesso configurado</Badge>
                ) : (
                  <>
                    {usersCount > 0 && (
                      <Badge variant="secondary">
                        {usersCount} usuário{usersCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {departmentsCount > 0 && (
                      <Badge variant="secondary">
                        {departmentsCount} departamento{departmentsCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {rolesCount > 0 && (
                      <Badge variant="secondary">
                        {rolesCount} role{rolesCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários Específicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${profile.id}`}
                      checked={allowedUsers.includes(profile.id)}
                      onCheckedChange={(checked) => handleUserChange(profile.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`user-${profile.id}`} 
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {profile.name} ({profile.email})
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Departamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Departamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept.id}`}
                      checked={allowedDepartments.includes(dept.id)}
                      onCheckedChange={(checked) => handleDepartmentChange(dept.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`dept-${dept.id}`} 
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {dept.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Roles/Funções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roleOptions.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={allowedRoles.includes(role.value)}
                      onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`role-${role.value}`} 
                      className="flex items-center gap-2 flex-1 cursor-pointer text-sm"
                    >
                      <role.icon className="w-4 h-4" />
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}