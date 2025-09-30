import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  cpf: string;
  rg?: string;
  email?: string;
  position: string;
  department_id?: string;
  supervisor_id?: string;
  birth_date?: string;
  phone?: string;
  gender?: 'M' | 'F' | 'Outros';
  hire_date: string;
  termination_date?: string;
  salary?: number;
  contract_type: 'CLT' | 'PJ' | 'Estagiario' | 'Terceirizado' | 'Temporario';
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
    color: string;
  };
  supervisor?: {
    id: string;
    full_name: string;
  };
}

export const useEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, color),
          supervisor:employees!supervisor_id(id, full_name)
        `)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Erro ao carregar funcionários');
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (employeeData: Partial<Employee>) => {
    try {
      // Gerar código do funcionário
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_employee_code');

      if (codeError) throw codeError;

      // Separar campos que existem na tabela dos que não existem
      const { department, supervisor, ...dbData } = employeeData as any;

      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...dbData,
          employee_code: codeData
        })
        .select(`
          *,
          department:departments(id, name, color),
          supervisor:employees!supervisor_id(id, full_name)
        `)
        .single();

      if (error) throw error;

      setEmployees(prev => [...prev, data]);
      toast.success('Funcionário criado com sucesso');
      return { data, error: null };
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Erro ao criar funcionário');
      return { data: null, error };
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      // Separar campos que existem na tabela dos que não existem
      const { department, supervisor, ...dbData } = employeeData as any;

      const { data, error } = await supabase
        .from('employees')
        .update(dbData)
        .eq('id', id)
        .select(`
          *,
          department:departments(id, name, color),
          supervisor:employees!supervisor_id(id, full_name)
        `)
        .single();

      if (error) throw error;

      setEmployees(prev => 
        prev.map(emp => emp.id === id ? data : emp)
      );
      toast.success('Funcionário atualizado com sucesso');
      return { data, error: null };
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Erro ao atualizar funcionário');
      return { data: null, error };
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
      toast.success('Funcionário removido com sucesso');
      return { error: null };
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Erro ao remover funcionário');
      return { error };
    }
  };

  const searchEmployees = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name, color),
          supervisor:employees!supervisor_id(id, full_name)
        `)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,position.ilike.%${query}%,employee_code.ilike.%${query}%`)
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
  };

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 === 10 || digit1 === 11) digit1 = 0;
    if (digit1 !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 === 10 || digit2 === 11) digit2 = 0;
    if (digit2 !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const formatCPF = (cpf: string): string => {
    const numbers = cpf.replace(/[^\d]/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return {
    employees,
    loading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    validateCPF,
    formatCPF,
    refetch: fetchEmployees
  };
};