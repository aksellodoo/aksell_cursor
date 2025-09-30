import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.string().min(1, "Selecione uma função"),
  department_id: z.string().min(1, "Selecione um departamento"),
  is_employee: z.boolean(),
  employee_id: z.string().optional(),
  company_relationship: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
}

interface InviteUserModalProps {
  onInviteSent?: () => void;
}

export const InviteUserModal = ({ onInviteSent }: InviteUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "",
      department_id: "",
      is_employee: false,
      employee_id: "",
      company_relationship: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      // Buscar departamentos
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (deptData) setDepartments(deptData);

      // Buscar funcionários
      const { data: empData } = await supabase
        .from('employees')
        .select('id, full_name, employee_code')
        .eq('status', 'active')
        .order('full_name');
      
      if (empData) setEmployees(empData);
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employeeSearch) {
      const filtered = employees.filter(emp => 
        emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.employee_code.toLowerCase().includes(employeeSearch.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees([]);
    }
  }, [employeeSearch, employees]);

  const handleEmployeeSelect = (employee: Employee) => {
    form.setValue("employee_id", employee.id);
    setEmployeeSearch(employee.full_name);
    setFilteredEmployees([]);
  };

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    try {
      // Buscar nome do departamento
      const department = departments.find(d => d.id === data.department_id);
      
      const inviteData = {
        email: data.email,
        name: data.name,
        role: data.role,
        department: department?.name || '',
        department_id: data.department_id,
        is_employee: data.is_employee,
        employee_id: data.employee_id || null,
        company_relationship: !data.is_employee ? data.company_relationship : null,
      };

      const { error } = await supabase.functions.invoke('send-invitation', {
        body: inviteData
      });

      if (error) {
        toast.error("Erro ao enviar convite: " + error.message);
      } else {
        toast.success("Convite enviado com sucesso!");
        form.reset();
        setEmployeeSearch("");
        setIsOpen(false);
        onInviteSent?.();
      }
    } catch (error: any) {
      toast.error("Erro inesperado: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Envie um convite por email para um novo usuário se juntar à equipe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              placeholder="Nome do usuário"
              {...form.register("name")}
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...form.register("email")}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select
              onValueChange={(value) => form.setValue("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="director">Diretor da Empresa</SelectItem>
                <SelectItem value="hr">RH</SelectItem>
                <SelectItem value="user">Usuário Normal</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-sm text-destructive">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Select
              onValueChange={(value) => form.setValue("department_id", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.department_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.department_id.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_employee">É funcionário da empresa?</Label>
              <Switch
                id="is_employee"
                checked={form.watch("is_employee")}
                onCheckedChange={(checked) => {
                  form.setValue("is_employee", checked);
                  if (!checked) {
                    form.setValue("employee_id", "");
                    setEmployeeSearch("");
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {form.watch("is_employee") ? (
              <div className="space-y-2">
                <Label htmlFor="employee_search">Buscar Funcionário</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="employee_search"
                    placeholder="Digite o nome ou código do funcionário"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    disabled={isLoading}
                    className="pl-9"
                  />
                </div>
                
                {filteredEmployees.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border rounded-md">
                    {filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="p-2 hover:bg-muted cursor-pointer"
                        onClick={() => handleEmployeeSelect(employee)}
                      >
                        <div className="font-medium">{employee.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Código: {employee.employee_code}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="company_relationship">Relação com a empresa</Label>
                <Input
                  id="company_relationship"
                  placeholder="Ex: Cliente, Parceiro, Consultor..."
                  {...form.register("company_relationship")}
                  disabled={isLoading}
                />
                {form.formState.errors.company_relationship && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.company_relationship.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};