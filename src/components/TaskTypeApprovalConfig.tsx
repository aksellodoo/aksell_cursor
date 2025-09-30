import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  UserCheck, 
  Settings, 
  Users, 
  Clock,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { AdvancedApproverSelector, ApprovalSelection } from './AdvancedApproverSelector';

interface TaskTypeApprovalConfigProps {
  isOpen: boolean;
  onClose: () => void;
  approvalConfig: any;
  onConfigChange: (config: any) => void;
}

export const TaskTypeApprovalConfig = ({ 
  isOpen, 
  onClose, 
  approvalConfig = {}, 
  onConfigChange 
}: TaskTypeApprovalConfigProps) => {
  const [config, setConfig] = useState({
    approvalFormat: 'single',
    singleApprover: '',
    approverSelection: {
      specificUsers: [],
      roleSelections: [],
      departmentSelections: []
    } as ApprovalSelection,
    expirationDays: 3,
    allowCorrections: false,
    notifyApprovers: true,
    requiresJustification: false,
    escalationDays: null,
    escalationApprover: '',
    autoApproveAfter: null,
    priority: 'medium',
    ...approvalConfig
  });

  const { profiles } = useProfiles();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (approvalConfig) {
      setConfig({
        approvalFormat: 'single',
        singleApprover: '',
        approverSelection: {
          specificUsers: [],
          roleSelections: [],
          departmentSelections: []
        },
        expirationDays: 3,
        allowCorrections: false,
        notifyApprovers: true,
        requiresJustification: false,
        escalationDays: null,
        escalationApprover: '',
        autoApproveAfter: null,
        priority: 'medium',
        ...approvalConfig
      });
    }
  }, [approvalConfig]);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleApproverSelectionChange = (selection: ApprovalSelection) => {
    handleConfigChange('approverSelection', selection);
  };

  const handleSave = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Configurar Aprovação para Tipo de Tarefa
          </DialogTitle>
          <DialogDescription>
            Configure como as aprovações funcionarão para este tipo de tarefa
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="approvers">Aprovadores</TabsTrigger>
              <TabsTrigger value="timing">Prazos</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="general" className="space-y-6 m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configurações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Informação:</strong> O título e descrição específicos da aprovação serão solicitados durante a criação de cada tarefa individual que usar este tipo.
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">
                        Prioridade Padrão da Aprovação
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
                          { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
                          { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
                          { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800' }
                        ].map((priority) => (
                          <button
                            key={priority.value}
                            onClick={() => handleConfigChange('priority', priority.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              config.priority === priority.value
                                ? `${priority.color} border-current`
                                : "bg-muted text-muted-foreground border-border hover:bg-accent"
                            }`}
                          >
                            {priority.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Esta será a prioridade padrão, mas poderá ser alterada na criação da tarefa
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approvers" className="space-y-6 m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Formato de Aprovação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={config.approvalFormat}
                      onValueChange={(value) => handleConfigChange('approvalFormat', value)}
                      className="space-y-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single" className="flex-1">
                          <span className="font-medium">Um único aprovador</span>
                          <span className="block text-sm text-muted-foreground">
                            Apenas um aprovador específico deve aprovar
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="any" id="any" />
                        <Label htmlFor="any" className="flex-1">
                          <span className="font-medium">Qualquer um dos aprovadores</span>
                          <span className="block text-sm text-muted-foreground">
                            Qualquer um dos aprovadores selecionados pode aprovar
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="flex-1">
                          <span className="font-medium">Todos os aprovadores obrigatoriamente</span>
                          <span className="block text-sm text-muted-foreground">
                            Todos os aprovadores selecionados devem aprovar
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {config.approvalFormat === 'single' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aprovador Único</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label className="text-sm font-medium mb-3 block">
                        Selecione o aprovador
                      </Label>
                      <select 
                        value={config.singleApprover}
                        onChange={(e) => handleConfigChange('singleApprover', e.target.value)}
                        className="w-full p-2 border border-border rounded-md bg-background"
                      >
                        <option value="">Selecione um usuário</option>
                        {profiles.map(profile => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name} - {profile.department || 'Sem departamento'}
                          </option>
                        ))}
                      </select>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Seleção de Aprovadores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdvancedApproverSelector
                        value={config.approverSelection}
                        onChange={handleApproverSelectionChange}
                        approvalFormat={config.approvalFormat}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timing" className="space-y-6 m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Configurações de Prazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="expirationDays" className="text-sm font-medium">
                        Prazo para Aprovação (dias)
                      </Label>
                      <Input
                        id="expirationDays"
                        type="number"
                        min="1"
                        value={config.expirationDays}
                        onChange={(e) => handleConfigChange('expirationDays', parseInt(e.target.value))}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Número de dias para expirar a aprovação automaticamente
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enableEscalation"
                          checked={config.escalationDays !== null}
                          onCheckedChange={(checked) => 
                            handleConfigChange('escalationDays', checked ? 2 : null)
                          }
                        />
                        <Label htmlFor="enableEscalation" className="text-sm font-medium">
                          Habilitar Escalação
                        </Label>
                      </div>

                      {config.escalationDays !== null && (
                        <div className="space-y-4 pl-6 border-l-2 border-muted">
                          <div>
                            <Label htmlFor="escalationDays" className="text-sm font-medium">
                              Escalar após (dias)
                            </Label>
                            <Input
                              id="escalationDays"
                              type="number"
                              min="1"
                              value={config.escalationDays || 2}
                              onChange={(e) => handleConfigChange('escalationDays', parseInt(e.target.value))}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              Escalar para
                            </Label>
                            <select 
                              value={config.escalationApprover}
                              onChange={(e) => handleConfigChange('escalationApprover', e.target.value)}
                              className="w-full p-2 border border-border rounded-md bg-background"
                            >
                              <option value="">Selecione um aprovador</option>
                              {profiles.map(profile => (
                                <option key={profile.id} value={profile.id}>
                                  {profile.name} - {profile.department || 'Sem departamento'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 m-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações Avançadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowCorrections"
                        checked={config.allowCorrections}
                        onCheckedChange={(checked) => handleConfigChange('allowCorrections', checked)}
                      />
                      <Label htmlFor="allowCorrections" className="text-sm font-medium">
                        Permitir Correções
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifyApprovers"
                        checked={config.notifyApprovers}
                        onCheckedChange={(checked) => handleConfigChange('notifyApprovers', checked)}
                      />
                      <Label htmlFor="notifyApprovers" className="text-sm font-medium">
                        Notificar Aprovadores
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requiresJustification"
                        checked={config.requiresJustification}
                        onCheckedChange={(checked) => handleConfigChange('requiresJustification', checked)}
                      />
                      <Label htmlFor="requiresJustification" className="text-sm font-medium">
                        Requer Justificativa para Rejeição
                      </Label>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enableAutoApprove"
                          checked={config.autoApproveAfter !== null}
                          onCheckedChange={(checked) => 
                            handleConfigChange('autoApproveAfter', checked ? 7 : null)
                          }
                        />
                        <Label htmlFor="enableAutoApprove" className="text-sm font-medium">
                          Auto-aprovação após prazo
                        </Label>
                      </div>

                      {config.autoApproveAfter !== null && (
                        <div className="pl-6 border-l-2 border-muted">
                          <Label htmlFor="autoApproveAfter" className="text-sm font-medium">
                            Auto-aprovar após (dias)
                          </Label>
                          <Input
                            id="autoApproveAfter"
                            type="number"
                            min="1"
                            value={config.autoApproveAfter || 7}
                            onChange={(e) => handleConfigChange('autoApproveAfter', parseInt(e.target.value))}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Aprovar automaticamente se não houver resposta
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Separator className="flex-shrink-0" />
        
        <div className="flex justify-end gap-3 pt-4 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};