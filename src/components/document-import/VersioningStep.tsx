import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronRight, ArrowLeft, Plus, X, Bell, Users, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VersionNotesModal } from './VersionNotesModal';
import { useImportWizard } from './ImportWizard';
import { UserMultiSelector } from './UserMultiSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDepartments } from '@/hooks/useDepartments';
import { useCurrentDocumentVersion } from '@/hooks/useCurrentDocumentVersion';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersioningData {
  effectiveDate: Date;
  expiryDate?: Date;
  versionNumber: number;
  versionNotes?: string;
}

interface NotificationSettings {
  notifyBeforeExpiryDays?: number;
  reviewers?: string[];
  reviewDepartmentId?: string;
  reviewMode: 'users' | 'department';
}

export const VersioningStep: React.FC = () => {
  const { setCurrentStep, setStepCompleted, navigateToStep, wizardData, updateWizardData } = useImportWizard();
  const { departments, loading: departmentsLoading } = useDepartments();
  
  // Get current document version for files to replace
  const firstFileToReplace = wizardData.filesToReplace?.[0];
  const urlParams = new URLSearchParams(window.location.search);
  const folderId = urlParams.get('folder');
  const departmentId = urlParams.get('department');
  
  const { currentVersion, nextVersion, loading: versionLoading } = useCurrentDocumentVersion({
    fileName: firstFileToReplace,
    folderId: folderId || undefined,
    departmentId: departmentId || undefined
  });
  
  const [versioningData, setVersioningData] = useState<VersioningData>({
    effectiveDate: new Date(),
    versionNumber: 1
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    reviewMode: 'users'
  });
  
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [pendingVersion, setPendingVersion] = useState<number>(1);
  const [tagInput, setTagInput] = useState('');
  const [isAutoIncremented, setIsAutoIncremented] = useState(false);

  // Auto-increment version when files are marked for replacement
  useEffect(() => {
    if (wizardData.filesToReplace && wizardData.filesToReplace.length > 0 && nextVersion > 1) {
      setVersioningData(prev => ({ 
        ...prev, 
        versionNumber: nextVersion,
        versionNotes: `Substituição do arquivo anterior (versão ${currentVersion})`
      }));
      setIsAutoIncremented(true);
    }
  }, [wizardData.filesToReplace, nextVersion, currentVersion]);

  const handleVersionChange = (value: string) => {
    const newVersion = parseInt(value);
    if (newVersion > 1 && newVersion !== versioningData.versionNumber) {
      setPendingVersion(newVersion);
      setShowVersionModal(true);
    } else {
      setVersioningData(prev => ({ 
        ...prev, 
        versionNumber: newVersion,
        versionNotes: newVersion === 1 ? undefined : prev.versionNotes
      }));
    }
  };

  const handleVersionNotesConfirm = (notes: string) => {
    setVersioningData(prev => ({
      ...prev,
      versionNumber: pendingVersion,
      versionNotes: notes
    }));
    setShowVersionModal(false);
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !wizardData.tags?.includes(trimmedTag)) {
      updateWizardData({
        tags: [...(wizardData.tags || []), trimmedTag]
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateWizardData({
      tags: wizardData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleContinue = () => {
    // Update wizard data with versioning and notification settings
    updateWizardData({
      effectiveDate: versioningData.effectiveDate,
      expiryDate: versioningData.expiryDate,
      versionNumber: versioningData.versionNumber,
      versionNotes: versioningData.versionNotes,
      notifyBeforeExpiryDays: notificationSettings.notifyBeforeExpiryDays,
      reviewers: versioningData.expiryDate ? {
        type: notificationSettings.reviewMode,
        users: notificationSettings.reviewMode === 'users' ? notificationSettings.reviewers : undefined,
        department: notificationSettings.reviewMode === 'department' ? notificationSettings.reviewDepartmentId : undefined
      } : undefined,
      reviewDepartmentId: notificationSettings.reviewDepartmentId
    });
    
    // Mark current step as completed
    setStepCompleted(4, true);
    // Navigate to step 6 (Approval)
    setCurrentStep(5);
  };

  const handlePrevious = () => {
    navigateToStep(3);
  };

  const isValid = versioningData.effectiveDate && 
    versioningData.versionNumber >= 1 && 
    (!versioningData.expiryDate || (
      notificationSettings.notifyBeforeExpiryDays && 
      notificationSettings.notifyBeforeExpiryDays > 0 &&
      (notificationSettings.reviewMode === 'department' ? 
        notificationSettings.reviewDepartmentId :
        notificationSettings.reviewers && notificationSettings.reviewers.length > 0
      )
    ));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Versionamento e Vigência
        </h2>
        <p className="text-muted-foreground">
          Defina as informações de versão e período de validade do documento
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Effective Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Início da Vigência</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="effective-date">Data de início da vigência *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !versioningData.effectiveDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {versioningData.effectiveDate ? (
                    format(versioningData.effectiveDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={versioningData.effectiveDate}
                  onSelect={(date) => date && setVersioningData(prev => ({ ...prev, effectiveDate: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Expiry Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validade do Arquivo</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="expiry-date">Data de expiração (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !versioningData.expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {versioningData.expiryDate ? (
                    format(versioningData.expiryDate, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={versioningData.expiryDate}
                  onSelect={(date) => setVersioningData(prev => ({ ...prev, expiryDate: date }))}
                  disabled={(date) => date < versioningData.effectiveDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Version Number */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Versão do Arquivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-increment alert for replacement files */}
            {wizardData.filesToReplace && wizardData.filesToReplace.length > 0 && isAutoIncremented && (
              <Alert className="border-blue-200 bg-blue-50/50">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="flex items-center gap-2">
                    {versionLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                    📄 Substituindo arquivo existente - versão incrementada automaticamente de {currentVersion} → {nextVersion}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="version">Número da versão *</Label>
              <Input
                id="version"
                type="number"
                min="1"
                value={versioningData.versionNumber}
                onChange={(e) => {
                  handleVersionChange(e.target.value);
                  setIsAutoIncremented(false); // Remove auto-increment flag when manually changed
                }}
                className="mt-2"
              />
            </div>
            
            {versioningData.versionNumber > 1 && versioningData.versionNotes && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Descrição das alterações:</p>
                <p className="text-sm text-muted-foreground mt-1">{versioningData.versionNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings - Only shows when expiry date is set */}
        {versioningData.expiryDate && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Days before expiry */}
              <div>
                <Label htmlFor="notify-days">Quantidade de dias antes do vencimento para notificar *</Label>
                <Input
                  id="notify-days"
                  type="number"
                  min="1"
                  max="365"
                  placeholder="Ex: 30"
                  value={notificationSettings.notifyBeforeExpiryDays || ''}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    notifyBeforeExpiryDays: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="mt-2"
                />
              </div>

              {/* Review mode selection */}
              <div>
                <Label>Tipo de Revisor</Label>
                <Select
                  value={notificationSettings.reviewMode}
                  onValueChange={(value: 'users' | 'department') => 
                    setNotificationSettings(prev => ({
                      ...prev,
                      reviewMode: value,
                      reviewers: value === 'department' ? undefined : prev.reviewers,
                      reviewDepartmentId: value === 'users' ? undefined : prev.reviewDepartmentId
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Usuários específicos
                      </div>
                    </SelectItem>
                    <SelectItem value="department">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Departamento
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewers selection */}
              {notificationSettings.reviewMode === 'users' && (
                <div>
                  <Label>Revisores que serão notificados *</Label>
                  <UserMultiSelector
                    value={notificationSettings.reviewers || []}
                    onChange={(reviewers) => setNotificationSettings(prev => ({
                      ...prev,
                      reviewers
                    }))}
                    placeholder="Selecione os revisores..."
                    className="mt-2"
                  />
                </div>
              )}

              {/* Department selection placeholder - for future implementation */}
              {notificationSettings.reviewMode === 'department' && (
                <div>
                  <Label>Departamento responsável *</Label>
                  <Select
                    value={notificationSettings.reviewDepartmentId || ''}
                    onValueChange={(value) => setNotificationSettings(prev => ({
                      ...prev,
                      reviewDepartmentId: value
                    }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione o departamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsLoading ? (
                        <SelectItem value="" disabled>Carregando departamentos...</SelectItem>
                      ) : departments.length > 0 ? (
                        departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>Nenhum departamento encontrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descrição (Opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione uma descrição para estes documentos..."
              value={wizardData.description || ''}
              onChange={(e) => updateWizardData({ description: e.target.value })}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Digite uma tag e pressione Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {wizardData.tags && wizardData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {wizardData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button 
            onClick={handleContinue}
            size="lg"
            className="min-w-48"
            disabled={!isValid}
          >
            <ChevronRight className="mr-2 h-5 w-5" />
            Continuar
          </Button>
        </div>
      </div>

      <VersionNotesModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onConfirm={handleVersionNotesConfirm}
        version={pendingVersion}
      />
    </div>
  );
};