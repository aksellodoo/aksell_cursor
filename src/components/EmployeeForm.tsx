import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateInput } from '@/components/ui/date-input';
import { X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee, useEmployees } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const employeeSchema = z.object({
  full_name: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().min(11, 'CPF é obrigatório'),
  rg: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  position: z.string().min(1, 'Função é obrigatória'),
  department_id: z.string().optional(),
  supervisor_id: z.string().optional(),
  birth_date: z.date().optional(),
  phone: z.string().optional(),
  gender: z.enum(['M', 'F', 'Outros']).optional(),
  hire_date: z.date(),
  termination_date: z.date().optional(),
  
  contract_type: z.enum(['CLT', 'PJ', 'Estagiario', 'Terceirizado', 'Temporario']),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess: () => void;
  initialFullName?: string;
  onCreated?: (employee: Employee) => void;
}

interface Department {
  id: string;
  name: string;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
  initialFullName,
  onCreated
}) => {
  const { createEmployee, updateEmployee, validateCPF, formatCPF, searchEmployees } = useEmployees();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<Employee[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: '',
      cpf: '',
      rg: '',
      email: '',
      position: '',
      department_id: 'none',
      supervisor_id: 'none',
      phone: '',
      gender: undefined,
      hire_date: new Date(),
      contract_type: 'CLT',
      status: 'active',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchSupervisors();
      
      if (employee) {
        form.reset({
          full_name: employee.full_name,
          cpf: employee.cpf,
          rg: employee.rg || '',
          email: employee.email || '',
          position: employee.position,
          department_id: employee.department_id || 'none',
          supervisor_id: employee.supervisor_id || 'none',
          birth_date: employee.birth_date ? new Date(employee.birth_date) : undefined,
          phone: employee.phone || '',
          gender: employee.gender,
          hire_date: new Date(employee.hire_date),
          termination_date: employee.termination_date ? new Date(employee.termination_date) : undefined,
          
          contract_type: employee.contract_type,
          status: employee.status,
          notes: employee.notes || '',
        });
        setPhotoPreview(employee.photo_url || '');
      } else {
        form.reset({
          full_name: initialFullName || '',
          cpf: '',
          rg: '',
          email: '',
          position: '',
          department_id: 'none',
          supervisor_id: 'none',
          phone: '',
          gender: undefined,
          hire_date: new Date(),
          contract_type: 'CLT',
          status: 'active',
          notes: '',
        });
        setPhotoPreview('');
      }
    }
  }, [isOpen, employee, form]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      
      // Filter out test departments
      const filteredData = (data || []).filter(dept => 
        !dept.name.includes('[TEST]') && !dept.name.includes('TEST')
      );
      
      setDepartments(filteredData);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const supervisors = await searchEmployees('');
      setAvailableSupervisors(supervisors.filter(s => s.id !== employee?.id));
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `employee-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-files')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('employee-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
      return null;
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    // Validar CPF
    if (!validateCPF(data.cpf)) {
      form.setError('cpf', { message: 'CPF inválido' });
      return;
    }

    setLoading(true);
    try {
      let photoUrl = employee?.photo_url;
      
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      const employeeData = {
        ...data,
        cpf: data.cpf.replace(/[^\d]/g, ''),
        birth_date: data.birth_date?.toISOString().split('T')[0],
        hire_date: data.hire_date.toISOString().split('T')[0],
        termination_date: data.termination_date?.toISOString().split('T')[0],
        photo_url: photoUrl,
        email: data.email || null,
        department_id: data.department_id === 'none' ? null : data.department_id,
        supervisor_id: data.supervisor_id === 'none' ? null : data.supervisor_id,
      };

      if (employee) {
        await updateEmployee(employee.id, employeeData);
      } else {
        const result = await createEmployee(employeeData);
        if (onCreated && result.data) {
          onCreated(result.data);
          return; // Don't call onSuccess and onClose if we have onCreated
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Foto */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview('');
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="text-sm text-primary hover:text-primary/80">
                  Alterar foto
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={14}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RG */}
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="RG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Função */}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função *</FormLabel>
                    <FormControl>
                      <Input placeholder="Função do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Departamento */}
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supervisor */}
              <FormField
                control={form.control}
                name="supervisor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supervisor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um supervisor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {availableSupervisors.map((supervisor) => (
                          <SelectItem key={supervisor.id} value={supervisor.id}>
                            {supervisor.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Nascimento */}
              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Data de nascimento"
                        disableFuture={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gênero */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Contratação */}
              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Contratação *</FormLabel>
                    <FormControl>
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Data de contratação"
                        disableFuture={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Contrato */}
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CLT">CLT</SelectItem>
                        <SelectItem value="PJ">PJ</SelectItem>
                        <SelectItem value="Estagiario">Estagiário</SelectItem>
                        <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                        <SelectItem value="Temporario">Temporário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="terminated">Demitido</SelectItem>
                        <SelectItem value="on_leave">Afastado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Demissão - somente se status for terminated */}
              {form.watch("status") === "terminated" && (
                <FormField
                  control={form.control}
                  name="termination_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Demissão</FormLabel>
                      <FormControl>
                        <DateInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Data de demissão"
                          disableFuture={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Botão de Gestão Salarial */}
              {employee && (
                <div className="col-span-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      toast.info("Gestão salarial será implementada após aprovação da migração");
                    }}
                    className="w-full"
                  >
                    Gerenciar Histórico Salarial
                  </Button>
                </div>
              )}
            </div>

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o funcionário"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (employee ? 'Salvar' : 'Criar')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};