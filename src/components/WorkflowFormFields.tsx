import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Users, Building2, UserCheck } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';

interface Department {
  id: string;
  name: string;
}

interface WorkflowFormFieldsProps {
  name: string;
  description: string;
  workflowType: string;
  selectedDepartments: string[];
  tags: string[];
  confidentialityLevel: 'public' | 'private';
  allowedUsers: string[];
  allowedDepartments: string[];
  allowedRoles: string[];
  priority: string;
  departments: Department[];
  newTag: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onWorkflowTypeChange: (value: string) => void;
  onDepartmentToggle: (departmentId: string) => void;
  onTagAdd: () => void;
  onTagRemove: (tag: string) => void;
  onNewTagChange: (value: string) => void;
  onConfidentialityChange: (value: 'public' | 'private') => void;
  onAllowedUsersChange: (users: string[]) => void;
  onAllowedDepartmentsChange: (departments: string[]) => void;
  onAllowedRolesChange: (roles: string[]) => void;
  onPriorityChange: (value: string) => void;
}

const workflowTypes = [
  { value: 'manual', label: 'Manual' },
  { value: 'approval', label: 'Aprovação' },
  { value: 'task_creation', label: 'Criação de Tarefas' },
  { value: 'notification', label: 'Notificação' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'conditional', label: 'Condicional' },
  { value: 'custom', label: 'Customizado' },
  { value: 'integration', label: 'Integração' },
  { value: 'report', label: 'Relatório' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'internal_process', label: 'Processo Interno' }
];

const priorityLevels = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' }
];

const availableRoles = [
  { value: 'user', label: 'Usuário' },
  { value: 'hr', label: 'RH' },
  { value: 'director', label: 'Diretor' },
  { value: 'admin', label: 'Administrador' }
];

export const WorkflowFormFields: React.FC<WorkflowFormFieldsProps> = ({
  name,
  description,
  workflowType,
  selectedDepartments,
  tags,
  confidentialityLevel,
  allowedUsers,
  allowedDepartments,
  allowedRoles,
  priority,
  departments,
  newTag,
  onNameChange,
  onDescriptionChange,
  onWorkflowTypeChange,
  onDepartmentToggle,
  onTagAdd,
  onTagRemove,
  onNewTagChange,
  onConfidentialityChange,
  onAllowedUsersChange,
  onAllowedDepartmentsChange,
  onAllowedRolesChange,
  onPriorityChange,
}) => {
  const { profiles } = useProfiles();

  const handleUserToggle = (userId: string) => {
    const updatedUsers = allowedUsers.includes(userId)
      ? allowedUsers.filter(id => id !== userId)
      : [...allowedUsers, userId];
    onAllowedUsersChange(updatedUsers);
  };

  const handlePrivateDepartmentToggle = (departmentId: string) => {
    const updatedDepartments = allowedDepartments.includes(departmentId)
      ? allowedDepartments.filter(id => id !== departmentId)
      : [...allowedDepartments, departmentId];
    onAllowedDepartmentsChange(updatedDepartments);
  };

  const handleRoleToggle = (role: string) => {
    const updatedRoles = allowedRoles.includes(role)
      ? allowedRoles.filter(r => r !== role)
      : [...allowedRoles, role];
    onAllowedRolesChange(updatedRoles);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="workflow-name">Nome do Workflow</Label>
          <Input
            id="workflow-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Digite o nome do workflow"
          />
        </div>

        <div>
          <Label htmlFor="workflow-description">Descrição</Label>
          <Textarea
            id="workflow-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Descreva o workflow"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workflow-type">Tipo do Workflow</Label>
            <Select value={workflowType} onValueChange={onWorkflowTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {workflowTypes.filter(type => type.value && type.value.trim() !== '').map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridade</Label>
            <Select value={priority} onValueChange={onPriorityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.filter(level => level.value && level.value.trim() !== '').map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Confidentiality Settings */}
      <div className="space-y-4">
        <div>
          <Label>Nível de Confidencialidade</Label>
          <Select value={confidentialityLevel} onValueChange={onConfidentialityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Público - Todos podem visualizar</SelectItem>
              <SelectItem value="private">Privado - Apenas usuários/departamentos/roles selecionados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Private Access Controls */}
        {confidentialityLevel === 'private' && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <div className="text-sm text-muted-foreground">
              Configure quem pode visualizar este workflow quando ele for privado:
            </div>

            {/* Allowed Users */}
            <div>
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuários Permitidos
              </Label>
              <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {profiles.map(profile => (
                  <div key={profile.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`user-${profile.id}`}
                      checked={allowedUsers.includes(profile.id)}
                      onCheckedChange={() => handleUserToggle(profile.id)}
                    />
                    <Label htmlFor={`user-${profile.id}`} className="text-sm cursor-pointer">
                      {profile.name}
                    </Label>
                  </div>
                ))}
              </div>
              {allowedUsers.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {allowedUsers.length} usuário(s) selecionado(s)
                </div>
              )}
            </div>

            {/* Allowed Departments */}
            <div>
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Departamentos Permitidos
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {departments.map(dept => (
                  <div key={dept.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`private-dept-${dept.id}`}
                      checked={allowedDepartments.includes(dept.id)}
                      onCheckedChange={() => handlePrivateDepartmentToggle(dept.id)}
                    />
                    <Label htmlFor={`private-dept-${dept.id}`} className="text-sm cursor-pointer">
                      {dept.name}
                    </Label>
                  </div>
                ))}
              </div>
              {allowedDepartments.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {allowedDepartments.length} departamento(s) selecionado(s)
                </div>
              )}
            </div>

            {/* Allowed Roles */}
            <div>
              <Label className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Funções Permitidas
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {availableRoles.map(role => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={allowedRoles.includes(role.value)}
                      onCheckedChange={() => handleRoleToggle(role.value)}
                    />
                    <Label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
              {allowedRoles.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {allowedRoles.length} função(ões) selecionada(s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Department Assignment */}
      <div>
        <Label>Departamentos (Atribuição do Workflow)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {departments.map(dept => (
            <div key={dept.id} className="flex items-center space-x-2">
              <Checkbox
                id={`dept-${dept.id}`}
                checked={selectedDepartments.includes(dept.id)}
                onCheckedChange={() => onDepartmentToggle(dept.id)}
              />
              <Label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer">
                {dept.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onTagRemove(tag)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => onNewTagChange(e.target.value)}
            placeholder="Adicionar tag"
            onKeyPress={(e) => e.key === 'Enter' && onTagAdd()}
          />
          <button
            type="button"
            onClick={onTagAdd}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};