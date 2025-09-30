import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Shield, Briefcase } from 'lucide-react';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string | null;
  is_leader: boolean;
  employee_id?: string | null;
  company_relationship?: string | null;
  supervisor_id?: string | null;
}

interface ProfileTabProps {
  user: User;
  formData: any;
  setFormData: (data: any) => void;
}

export const ProfileTab = ({ user, formData, setFormData }: ProfileTabProps) => {
  const { departments, loading: departmentsLoading } = useDepartments();
  const { employees, loading: employeesLoading } = useEmployees();
  const { profile: currentUserProfile } = useUserProfile();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Verificar se o usuário atual é administrador
  const canEditRole = currentUserProfile?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(formData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o email"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access and Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Acesso e Permissões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select 
                        value={formData.role} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} 
                        disabled={!canEditRole}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="hr">RH</SelectItem>
                          <SelectItem value="director">Diretor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  {!canEditRole && (
                    <TooltipContent>
                      <p>Apenas administradores podem alterar funções de usuários</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select 
                value={formData.department_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                disabled={departmentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum departamento</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_leader">Líder de Equipe</Label>
              <p className="text-sm text-muted-foreground">
                Usuário pode gerenciar outros usuários e ter permissões especiais
              </p>
            </div>
            <Switch
              id="is_leader"
              checked={formData.is_leader}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                is_leader: checked
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Dados Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Funcionário Vinculado</Label>
              <Select 
                value={formData.employee_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                disabled={employeesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum funcionário</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.employee_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_relationship">Vínculo com a Empresa</Label>
              <Select 
                value={formData.company_relationship} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, company_relationship: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não especificado</SelectItem>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="contractor">Terceirizado</SelectItem>
                  <SelectItem value="consultant">Consultor</SelectItem>
                  <SelectItem value="intern">Estagiário</SelectItem>
                  <SelectItem value="partner">Sócio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor_id">Supervisor</Label>
            <Select 
              value={formData.supervisor_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, supervisor_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum supervisor</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};