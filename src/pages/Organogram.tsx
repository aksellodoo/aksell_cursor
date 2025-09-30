import React, { useState, useEffect } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/PermissionGuard';
import { PageLayout } from '@/components/PageLayout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Search, Download, Building, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  color: string;
  employees: any[];
}

interface OrganogramNode {
  employee: any;
  subordinates: OrganogramNode[];
}

export default function Organogram() {
  const { employees, loading } = useEmployees();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleExportPDF = async () => {
    try {
      const orgChart = document.getElementById('organogram-content');
      if (!orgChart) {
        toast.error('Erro ao capturar o organograma');
        return;
      }

      toast.info('Gerando PDF...');
      
      const canvas = await html2canvas(orgChart, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('organograma.pdf');
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (departments.length > 0 && employees.length > 0) {
      organizeEmployeesByDepartment();
    }
  }, [departments, employees]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data?.map(dept => ({ ...dept, employees: [] })) || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const organizeEmployeesByDepartment = () => {
    const updatedDepartments = departments.map(dept => ({
      ...dept,
      employees: employees.filter(emp => emp.department_id === dept.id)
    }));

    setDepartments(updatedDepartments);
  };

  const buildHierarchy = (employees: any[], parentId: string | null = null): OrganogramNode[] => {
    return employees
      .filter(emp => emp.supervisor_id === parentId)
      .map(emp => ({
        employee: emp,
        subordinates: buildHierarchy(employees, emp.id)
      }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderEmployeeNode = (node: OrganogramNode, level: number = 0) => {
    const { employee, subordinates } = node;
    const hasSubordinates = subordinates.length > 0;
    const isExpanded = expandedNodes.has(employee.id);

    if (searchTerm && !employee.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    return (
      <div key={employee.id} className={`ml-${level * 4} mb-4`}>
        <Card className="w-full max-w-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.photo_url} />
                  <AvatarFallback>
                    {getInitials(employee.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{employee.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{employee.position}</p>
                  <p className="text-xs text-muted-foreground">{employee.employee_code}</p>
                </div>
              </div>
              
              {hasSubordinates && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNode(employee.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {employee.contract_type}
              </Badge>
              {employee.email && (
                <span className="text-xs text-muted-foreground">
                  {employee.email}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {hasSubordinates && isExpanded && (
          <div className="ml-6 mt-2 border-l-2 border-border pl-4">
            {subordinates.map(subNode => renderEmployeeNode(subNode, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentOrganogram = (department: Department) => {
    const hierarchy = buildHierarchy(department.employees);
    
    if (hierarchy.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-2 text-sm font-medium text-muted-foreground">
            Nenhum funcionário neste departamento
          </h3>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {hierarchy.map(node => renderEmployeeNode(node))}
      </div>
    );
  };

  const filteredDepartments = selectedDepartment === 'all' 
    ? departments 
    : departments.filter(dept => dept.id === selectedDepartment);

  const totalEmployees = departments.reduce((sum, dept) => sum + dept.employees.length, 0);
  const employeesWithoutDepartment = employees.filter(emp => !emp.department_id);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PermissionGuard pageName="Organograma" action="view">
      <PageLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Organograma</h1>
            <p className="text-muted-foreground">
              Visualize a estrutura hierárquica da empresa
            </p>
          </div>
          
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Departamento</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeesWithoutDepartment.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Organogram */}
        <div className="space-y-8" id="organogram-content">
          {filteredDepartments.map((department) => (
            <Card key={department.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: department.color }}
                  />
                  {department.name}
                </CardTitle>
                <CardDescription>
                  {department.employees.length} funcionário(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDepartmentOrganogram(department)}
              </CardContent>
            </Card>
          ))}

          {/* Funcionários sem departamento */}
          {employeesWithoutDepartment.length > 0 && selectedDepartment === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400" />
                  Sem Departamento
                </CardTitle>
                <CardDescription>
                  {employeesWithoutDepartment.length} funcionário(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeesWithoutDepartment.map(employee => (
                    <div key={employee.id}>
                      {renderEmployeeNode({ employee, subordinates: [] })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-2 text-sm font-medium text-muted-foreground">
              Nenhum departamento encontrado
            </h3>
          </div>
        )}
      </PageLayout>
    </PermissionGuard>
  );
}