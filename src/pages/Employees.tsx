import React, { useState } from 'react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ImportExportModal } from '@/components/ImportExportModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmployeeForm } from '@/components/EmployeeForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ChatterComponent } from '@/components/ChatterComponent';
import { ChatterAccess } from '@/components/ChatterAccess';
import { useChatterNavigation } from '@/hooks/useChatterNavigation';
import { UserPlus, Search, MoreVertical, Edit, MessageSquare, Users, UserCheck, UserX, Building, Download, Upload, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { PageLayout } from '@/components/PageLayout';
import { ShareButton } from '@/components/ShareButton';
import { SharedRecordIndicator } from '@/components/SharedRecordIndicator';
import { useRecordSharing } from '@/hooks/useRecordSharing';

export default function Employees() {
  const { employees, loading, refetch, createEmployee } = useEmployees();
  const { userProfile } = usePermissions();
  const { profile } = useUserProfile();
  const { openChatter } = useChatterNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const { toast } = useToast();

  const filteredEmployees = employees.filter(employee =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      terminated: { label: 'Demitido', variant: 'destructive' as const },
      on_leave: { label: 'Afastado', variant: 'outline' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getContractTypeBadge = (contractType: string) => {
    const typeMap = {
      CLT: { label: 'CLT', variant: 'default' as const },
      PJ: { label: 'PJ', variant: 'secondary' as const },
      Estagiario: { label: 'Estagiário', variant: 'outline' as const },
      Terceirizado: { label: 'Terceirizado', variant: 'secondary' as const },
      Temporario: { label: 'Temporário', variant: 'outline' as const }
    };
    
    const typeInfo = typeMap[contractType as keyof typeof typeMap] || typeMap.CLT;
    return (
      <Badge variant={typeInfo.variant}>
        {typeInfo.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const inactiveEmployees = employees.filter(e => e.status === 'inactive').length;
  const terminatedEmployees = employees.filter(e => e.status === 'terminated').length;
  const uniqueDepartments = new Set(employees.map(e => e.department_id).filter(Boolean)).size;

  const canModify = userProfile?.is_leader;

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleNewEmployee = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleChatter = (employee: Employee) => {
    openChatter({
      recordType: 'employee',
      recordId: employee.id,
      recordName: employee.full_name
    });
  };


  const handleFormSuccess = () => {
    refetch();
  };

  const handleImportEmployees = async (data: any[]) => {
    try {
      for (const row of data) {
        const employeeData = {
          full_name: row['Nome Completo'],
          cpf: row['CPF'].replace(/\D/g, ''),
          email: row['Email'],
          position: row['Cargo'],
          hire_date: convertDateFormat(row['Data de Contratação']),
          phone: row['Telefone'],
          contract_type: row['Tipo de Contrato'] || 'CLT',
          salary: row['Salário'] ? parseFloat(row['Salário'].toString().replace(/[^\d.,]/g, '').replace(',', '.')) : null,
        };
        
        await createEmployee(employeeData);
      }
    } catch (error) {
      console.error('Erro na importação:', error);
      throw error;
    }
  };

  const handleExportEmployees = () => {
    const csvData = employees.map(employee => ({
      'Nome Completo': employee.full_name,
      'CPF': employee.cpf,
      'Email': employee.email || '',
      'Cargo': employee.position,
      'Departamento': employee.department?.name || '',
      'Data de Contratação': employee.hire_date ? format(new Date(employee.hire_date), 'dd/MM/yyyy') : '',
      'Telefone': employee.phone || '',
      'Tipo de Contrato': employee.contract_type || '',
      'Salário': employee.salary || '',
      'Status': employee.status || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `funcionarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Exportação concluída',
      description: 'Lista de funcionários exportada com sucesso.'
    });
  };

  const convertDateFormat = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const getTemplateData = () => {
    return [
      {
        'Nome Completo': 'João Silva Santos',
        'CPF': '123.456.789-00',
        'Email': 'joao.silva@empresa.com',
        'Cargo': 'Analista de Sistemas',
        'Departamento': 'TI',
        'Data de Contratação': '01/01/2024',
        'Telefone': '(11) 99999-9999',
        'Tipo de Contrato': 'CLT',
        'Salário': '5000.00'
      }
    ];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PermissionGuard pageName="Funcionários" action="view">
      <PageLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie os funcionários da empresa
            </p>
          </div>
          
          <div className="flex gap-2">
            <PermissionGuard pageName="Funcionários" action="modify" hideWhenNoAccess>
              <Button onClick={handleNewEmployee}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Funcionário
              </Button>
            </PermissionGuard>
            
            {(profile?.role === 'admin' || profile?.role === 'director') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowImportExport(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportEmployees}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">funcionários</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
              <p className="text-xs text-muted-foreground">funcionários ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveEmployees + terminatedEmployees}</div>
              <p className="text-xs text-muted-foreground">inativos + demitidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueDepartments}</div>
              <p className="text-xs text-muted-foreground">departamentos ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionários</CardTitle>
            <CardDescription>
              Lista de todos os funcionários da empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Compartilhamento</TableHead>
                  <TableHead>Contratação</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const EmployeeRowContent = () => {
                    const { isShared, sharedCount, hasSharedAccess } = useRecordSharing('employee', employee.id);
                    
                    return (
                      <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.photo_url} />
                          <AvatarFallback>
                            {getInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee.email || 'Sem email'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {employee.employee_code}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      {employee.department ? (
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: employee.department.color,
                            color: employee.department.color 
                          }}
                        >
                          {employee.department.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Sem departamento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(employee.status)}
                    </TableCell>
                        <TableCell>
                          {getContractTypeBadge(employee.contract_type)}
                        </TableCell>
                        <TableCell>
                          <SharedRecordIndicator
                            recordType="employee"
                            recordId={employee.id}
                            isShared={isShared}
                            sharedCount={sharedCount}
                            hasSharedAccess={hasSharedAccess}
                            variant="minimal"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(employee.hire_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canModify && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleChatter(employee)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chatter
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <div className="w-full">
                              <ShareButton
                                recordType="employee"
                                recordId={employee.id}
                                recordName={employee.full_name}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start p-0 h-auto"
                                showText={true}
                              />
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  };
                  
                  return <EmployeeRowContent key={employee.id} />;
                })}
              </TableBody>
            </Table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                  Nenhum funcionário encontrado
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm 
                    ? 'Tente ajustar sua busca.' 
                    : 'Comece criando um novo funcionário.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Form Modal */}
        <EmployeeForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          employee={selectedEmployee}
          onSuccess={handleFormSuccess}
        />


        {/* Import/Export Modal */}
        {showImportExport && (
          <ImportExportModal
            isOpen={showImportExport}
            onClose={() => setShowImportExport(false)}
            entityType="employees"
            onImport={handleImportEmployees}
            onExport={handleExportEmployees}
            templateData={getTemplateData()}
          />
        )}
      </PageLayout>
    </PermissionGuard>
  );
}