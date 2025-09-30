import React, { useState, useEffect } from 'react';
import { Search, UserPlus, AlertCircle, Info, Users, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateFriendFamilyLinkData } from '@/hooks/useFriendsFamilyLinks';
import { useEmployees } from '@/hooks/useEmployees';

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
}

interface FriendsFamilyLinkingFlowProps {
  onConfirm: (data: CreateFriendFamilyLinkData) => void;
  onCancel: () => void;
}

const relationshipOptions = [
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'filho_filha', label: 'Filho(a)' },
  { value: 'pai_mae', label: 'Pai/Mãe' },
  { value: 'amigo', label: 'Amigo' },
  { value: 'companheiro', label: 'Companheiro(a)' },
  { value: 'outro', label: 'Outro' }
];

const usageTypeOptions = [
  { value: 'emergencia', label: 'Emergência' },
  { value: 'convites_eventos', label: 'Convites & Eventos' },
  { value: 'beneficios', label: 'Benefícios' },
  { value: 'comunicacao_institucional', label: 'Comunicação Institucional' },
  { value: 'outro', label: 'Outro' }
];

const legalBasisOptions = [
  { value: 'consentimento', label: 'Consentimento' },
  { value: 'legitimo_interesse', label: 'Legítimo Interesse' },
  { value: 'obrigacao_legal', label: 'Obrigação Legal' }
];

export function FriendsFamilyLinkingFlow({ onConfirm, onCancel }: FriendsFamilyLinkingFlowProps) {
  const { employees: employeesList, loading: employeesLoading } = useEmployees();
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [relationship, setRelationship] = useState('');
  const [relationshipOther, setRelationshipOther] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [legalGuardianName, setLegalGuardianName] = useState('');
  const [legalGuardianContact, setLegalGuardianContact] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [usageTypes, setUsageTypes] = useState<string[]>([]);
  const [usageOther, setUsageOther] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [consentDate, setConsentDate] = useState('');
  const [contactRestrictions, setContactRestrictions] = useState('');
  const [dncList, setDncList] = useState(false);
  const [conflictNotes, setConflictNotes] = useState('');

  // Convert employeesList to Employee format and filter
  useEffect(() => {
    if (employeesList) {
      const convertedEmployees: Employee[] = employeesList.map(emp => ({
        id: emp.id,
        name: emp.full_name || 'Sem nome',
        department: emp.department?.name || 'Sem departamento',
        role: emp.position || 'Funcionário'
      }));
      
      const filtered = convertedEmployees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employeesList]);

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleUsageTypeToggle = (usageType: string) => {
    setUsageTypes(prev => 
      prev.includes(usageType) 
        ? prev.filter(type => type !== usageType)
        : [...prev, usageType]
    );
  };

  const validateForm = () => {
    if (!relationship) {
      toast.error('Selecione o tipo de relacionamento');
      return false;
    }
    
    if (relationship === 'outro' && !relationshipOther.trim()) {
      toast.error('Especifique o tipo de relacionamento');
      return false;
    }
    
    if (isMinor && (!legalGuardianName.trim() || !legalGuardianContact.trim())) {
      toast.error('Para menores de idade, informe os dados do responsável legal');
      return false;
    }
    
    if (selectedEmployees.length === 0) {
      toast.error('Selecione pelo menos um funcionário relacionado');
      return false;
    }
    
    if (usageTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de uso');
      return false;
    }
    
    if (usageTypes.includes('outro') && !usageOther.trim()) {
      toast.error('Especifique o tipo de uso personalizado');
      return false;
    }
    
    if (!legalBasis) {
      toast.error('Selecione a base legal');
      return false;
    }
    
    if (hasConsent && !consentDate) {
      toast.error('Informe a data do consentimento');
      return false;
    }
    
    return true;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    const linkData: CreateFriendFamilyLinkData = {
      relationship: relationship as any,
      relationship_other: relationship === 'outro' ? relationshipOther.trim() : undefined,
      is_minor: isMinor,
      legal_guardian_name: isMinor ? legalGuardianName.trim() : undefined,
      legal_guardian_contact: isMinor ? legalGuardianContact.trim() : undefined,
      usage_types: usageTypes as any,
      usage_other: usageTypes.includes('outro') ? usageOther.trim() : undefined,
      legal_basis: legalBasis as any,
      has_consent: hasConsent,
      consent_date: hasConsent ? consentDate : undefined,
      contact_restrictions: contactRestrictions.trim() || undefined,
      dnc_list: dncList,
      conflict_notes: conflictNotes.trim() || undefined,
      employee_ids: selectedEmployees
    };

    onConfirm(linkData);
  };

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando funcionários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure o vínculo de amigos e familiares seguindo as diretrizes de LGPD e compliance.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="relationship">Relação com o Funcionário *</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a relação..." />
              </SelectTrigger>
              <SelectContent>
                {relationshipOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {relationship === 'outro' && (
            <div>
              <Label htmlFor="relationshipOther">Especificar Relação *</Label>
              <Input
                id="relationshipOther"
                value={relationshipOther}
                onChange={(e) => setRelationshipOther(e.target.value)}
                placeholder="Especifique a relação..."
                className="mt-1"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMinor"
              checked={isMinor}
              onCheckedChange={(checked) => setIsMinor(checked as boolean)}
            />
            <Label htmlFor="isMinor">É menor de idade?</Label>
          </div>

          {isMinor && (
            <div className="space-y-4 p-4 border rounded-lg bg-amber-50">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para menores de idade, é obrigatório informar os dados do responsável legal.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="legalGuardianName">Nome do Responsável Legal *</Label>
                <Input
                  id="legalGuardianName"
                  value={legalGuardianName}
                  onChange={(e) => setLegalGuardianName(e.target.value)}
                  placeholder="Nome completo do responsável..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="legalGuardianContact">Contato do Responsável Legal *</Label>
                <Input
                  id="legalGuardianContact"
                  value={legalGuardianContact}
                  onChange={(e) => setLegalGuardianContact(e.target.value)}
                  placeholder="Telefone ou email do responsável..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funcionário(s) Relacionado(s) *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="employeeSearch">Buscar Funcionários</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="employeeSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou departamento..."
                className="pl-10"
              />
            </div>
          </div>

          {selectedEmployees.length > 0 && (
            <div>
              <Label>Funcionários Selecionados</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedEmployees.map(empId => {
                  const employee = filteredEmployees.find(emp => emp.id === empId) || 
                                  employeesList?.find(emp => emp.id === empId);
                  const employeeName = employee ? 
                    ('name' in employee ? employee.name : employee.full_name) || 'Sem nome' : 
                    'Funcionário não encontrado';
                  return (
                    <Badge key={empId} variant="secondary" className="flex items-center gap-1">
                      {employeeName}
                      <button
                        onClick={() => handleEmployeeToggle(empId)}
                        className="ml-1 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto border rounded-lg">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {employeesList?.length === 0 ? 'Nenhum funcionário cadastrado' : 'Nenhum funcionário encontrado'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-muted",
                      selectedEmployees.includes(employee.id) && "bg-primary/10"
                    )}
                    onClick={() => handleEmployeeToggle(employee.id)}
                  >
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeToggle(employee.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.department} • {employee.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage and Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance & LGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tipo de Uso *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {usageTypeOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`usage-${option.value}`}
                    checked={usageTypes.includes(option.value)}
                    onCheckedChange={() => handleUsageTypeToggle(option.value)}
                  />
                  <Label htmlFor={`usage-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {usageTypes.includes('outro') && (
            <div>
              <Label htmlFor="usageOther">Especificar Tipo de Uso *</Label>
              <Input
                id="usageOther"
                value={usageOther}
                onChange={(e) => setUsageOther(e.target.value)}
                placeholder="Especifique o tipo de uso..."
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="legalBasis">Base Legal *</Label>
            <Select value={legalBasis} onValueChange={setLegalBasis}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione a base legal..." />
              </SelectTrigger>
              <SelectContent>
                {legalBasisOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasConsent"
              checked={hasConsent}
              onCheckedChange={(checked) => setHasConsent(checked as boolean)}
            />
            <Label htmlFor="hasConsent">Consentimento obtido</Label>
          </div>

          {hasConsent && (
            <div>
              <Label htmlFor="consentDate">Data do Consentimento *</Label>
              <Input
                id="consentDate"
                type="date"
                value={consentDate}
                onChange={(e) => setConsentDate(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="contactRestrictions">Restrições de Contato</Label>
            <Textarea
              id="contactRestrictions"
              value={contactRestrictions}
              onChange={(e) => setContactRestrictions(e.target.value)}
              placeholder="Descreva restrições específicas de contato..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dncList"
              checked={dncList}
              onCheckedChange={(checked) => setDncList(checked as boolean)}
            />
            <Label htmlFor="dncList">Incluir na lista de não contato (DNC)</Label>
          </div>

          <div>
            <Label htmlFor="conflictNotes">Observações sobre Conflito de Interesse</Label>
            <Textarea
              id="conflictNotes"
              value={conflictNotes}
              onChange={(e) => setConflictNotes(e.target.value)}
              placeholder="Descreva possíveis conflitos de interesse..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>
          Confirmar Vínculo
        </Button>
      </div>
    </div>
  );
}