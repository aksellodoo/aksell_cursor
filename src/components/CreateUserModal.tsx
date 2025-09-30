import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Search, Plus } from 'lucide-react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/EmployeeForm';

interface CreateUserModalProps {
  onUserCreated?: () => void;
}

interface Department {
  id: string;
  name: string;
}

export const CreateUserModal = ({ onUserCreated }: CreateUserModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [showEmployeeSearch, setShowEmployeeSearch] = useState(false);
  
  const { searchEmployees } = useEmployees();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    department_id: '',
    is_employee: false,
    employee_id: '',
    is_leader: false,
    company_relationship: '',
    can_change_password: true,
    notification_app: true,
    notification_email: true,
    notification_frequency: 'instant',
    notification_types: {
      changes: true,
      chatter: true,
      mentions: true,
      assignments: true
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employeeSearchQuery.length > 0) {
      const search = async () => {
        const employees = await searchEmployees(employeeSearchQuery);
        setFilteredEmployees(employees);
      };
      search();
    } else {
      setFilteredEmployees([]);
    }
  }, [employeeSearchQuery, searchEmployees]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Erro ao carregar departamentos');
    }
  };



  const handleEmployeeSelect = (employee: Employee) => {
    setFormData(prev => ({
      ...prev,
      employee_id: employee.id,
      name: employee.full_name,
      department_id: employee.department_id || ''
    }));
    setEmployeeSearchQuery(employee.full_name);
    setShowEmployeeSearch(false);
  };

  const handleNewEmployeeCreated = (newEmployee: Employee) => {
    setFormData(prev => ({
      ...prev,
      employee_id: newEmployee.id,
      department_id: newEmployee.department_id || ''
    }));
    setIsEmployeeFormOpen(false);
    toast.success('Funcionário criado com sucesso!');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: se é funcionário, deve ter employee_id
    if (formData.is_employee && !formData.employee_id) {
      toast.error('Selecione um funcionário ou cadastre um novo funcionário');
      return;
    }
    
    try {
      setIsLoading(true);

      const userData = {
        ...formData
      };

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData
      });

      if (error) throw error;

      if (!data?.user_id) {
        throw new Error('User ID não retornado');
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            userEmail: formData.email,
            userName: formData.name,
            userId: data.user_id
          }
        });
        
        toast.success('Usuário criado com sucesso! Email enviado com link para definir senha.');
      } catch (emailError) {
        console.error('Erro ao enviar email de boas-vindas:', emailError);
        toast.success('Usuário criado, mas houve erro no envio do email.');
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'user',
        department_id: '',
        is_employee: false,
        employee_id: '',
        is_leader: false,
        company_relationship: '',
        can_change_password: true,
        notification_app: true,
        notification_email: true,
        notification_frequency: 'instant',
        notification_types: {
          changes: true,
          chatter: true,
          mentions: true,
          assignments: true
        }
      });
      setEmployeeSearchQuery('');
      setFilteredEmployees([]);
      
      setIsOpen(false);
      
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Criar Usuário
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* User Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sistema de Senha</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Um email será enviado para <strong>{formData.email || "o usuário"}</strong> com 
                    um link para definir a senha de acesso ao sistema.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} disabled={formData.is_leader}>
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

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Select value={formData.department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments
                        .filter(dept => dept.id && dept.id.trim() !== '') // Filtrar departamentos com ID vazio
                        .map((dept) => (
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
                  <p className="text-sm text-muted-foreground">Se marcado, a função será definida como usuário líder</p>
                </div>
                <Switch
                  id="is_leader"
                  checked={formData.is_leader}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_leader: checked, role: checked ? 'user' : prev.role }))}
                />
              </div>

              {/* É funcionário da empresa? */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_employee">É funcionário da empresa?</Label>
                  <p className="text-sm text-muted-foreground">Marque se o usuário é um funcionário registrado</p>
                </div>
                <Switch
                  id="is_employee"
                  checked={formData.is_employee}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      is_employee: checked,
                      employee_id: checked ? prev.employee_id : '',
                      company_relationship: checked ? '' : prev.company_relationship
                    }));
                    if (!checked) {
                      setEmployeeSearchQuery('');
                      setFilteredEmployees([]);
                    }
                  }}
                />
              </div>

              {/* Seleção de funcionário - só aparece se is_employee for true */}
              {formData.is_employee && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Funcionário</Label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar funcionário pelo nome..."
                            value={employeeSearchQuery}
                            onChange={(e) => {
                              setEmployeeSearchQuery(e.target.value);
                              setShowEmployeeSearch(e.target.value.length > 0);
                            }}
                            className="pl-10"
                            onFocus={() => setShowEmployeeSearch(employeeSearchQuery.length > 0)}
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEmployeeFormOpen(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Novo
                        </Button>
                      </div>
                      
                      {/* Lista de funcionários filtrados */}
                      {showEmployeeSearch && filteredEmployees.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-background border border-border rounded-md shadow-lg">
                          {filteredEmployees.map((employee) => (
                            <button
                              key={employee.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                              onClick={() => handleEmployeeSelect(employee)}
                            >
                              <div className="font-medium">{employee.full_name}</div>
                              <div className="text-sm text-muted-foreground">{employee.position}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.employee_id && (
                      <p className="text-sm text-muted-foreground">
                        Funcionário selecionado: {employeeSearchQuery}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Campo de relacionamento com empresa - só aparece se NÃO for funcionário */}
              {!formData.is_employee && (
                <div className="space-y-2">
                  <Label htmlFor="company_relationship">Relacionamento com a empresa</Label>
                  <Input
                    id="company_relationship"
                    value={formData.company_relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_relationship: e.target.value }))}
                    placeholder="Ex: Consultor, Terceirizado, etc."
                  />
                </div>
              )}
            </CardContent>
          </Card>


          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal para criar novo funcionário */}
      <EmployeeForm
        isOpen={isEmployeeFormOpen}
        onClose={() => setIsEmployeeFormOpen(false)}
        employee={null}
        onSuccess={() => {}}
        initialFullName={formData.name}
        onCreated={handleNewEmployeeCreated}
      />
    </Dialog>
  );
};