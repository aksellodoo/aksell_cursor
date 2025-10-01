import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileText } from 'lucide-react';
import { useTaskTemplates, type TaskTemplate } from '@/hooks/useTaskTemplates';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/hooks/useAuth';
import { TASK_TYPES } from '@/lib/taskTypesFixed';
import { cn } from '@/lib/utils';

interface TemplatePickerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
  onCreateNew: () => void;
}

export const TemplatePickerDrawer: React.FC<TemplatePickerDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCreateNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { templates, loading } = useTaskTemplates();
  const { departments } = useDepartments();
  const { user } = useAuth();

  // Filtrar templates do usuário
  const myTemplates = useMemo(() => {
    return templates.filter(template => template.created_by === user?.id);
  }, [templates, user?.id]);

  // Agrupar templates por departamento
  const templatesByDepartment = useMemo(() => {
    const grouped = templates.reduce((acc, template) => {
      const deptName = template.departments?.name || 'Sem departamento';
      if (!acc[deptName]) {
        acc[deptName] = [];
      }
      acc[deptName].push(template);
      return acc;
    }, {} as Record<string, TaskTemplate[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [templates]);

  // Filtrar baseado na busca
  const filteredTemplatesByDepartment = useMemo(() => {
    if (!searchTerm) return templatesByDepartment;

    return templatesByDepartment.map(([deptName, templates]) => [
      deptName,
      templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        TASK_TYPES[template.fixed_type]?.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ]).filter(([, templates]) => (templates as TaskTemplate[]).length > 0) as [string, TaskTemplate[]][];
  }, [templatesByDepartment, searchTerm]);

  const filteredMyTemplates = useMemo(() => {
    if (!searchTerm) return myTemplates;

    return myTemplates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      TASK_TYPES[template.fixed_type]?.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myTemplates, searchTerm]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Escolher Template</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Botão criar novo */}
          <Button 
            onClick={onCreateNew}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar novo template
          </Button>

          {/* Tabs */}
          <Tabs defaultValue="department" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="department">Por departamento</TabsTrigger>
              <TabsTrigger value="my">Meus</TabsTrigger>
            </TabsList>

            {/* Tab Por departamento */}
            <TabsContent value="department" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando templates...</p>
                </div>
              ) : filteredTemplatesByDepartment.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {filteredTemplatesByDepartment.map(([deptName, deptTemplates]) => (
                    <div key={deptName} className="space-y-3">
                      <h3 className="font-medium text-sm text-muted-foreground border-b pb-1">
                        {deptName}
                      </h3>
                      <div className="grid gap-3">
                        {deptTemplates.map(template => (
                          <TemplateCard
                            key={template.id}
                            template={template}
                            onClick={() => onSelectTemplate(template)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Meus */}
            <TabsContent value="my" className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando templates...</p>
                </div>
              ) : filteredMyTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum template encontrado' : 'Você ainda não criou templates'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredMyTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => onSelectTemplate(template)}
                      showOwnership={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface TemplateCardProps {
  template: TaskTemplate;
  onClick: () => void;
  showOwnership?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onClick, 
  showOwnership = true 
}) => {
  const taskTypeConfig = TASK_TYPES[template.fixed_type];
  const IconComponent = taskTypeConfig?.icon || FileText;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone do tipo */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: taskTypeConfig?.color + '20' || 'hsl(var(--muted))' }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: taskTypeConfig?.color || 'hsl(var(--muted-foreground))' }}
            />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{template.name}</h4>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {taskTypeConfig?.label || template.fixed_type}
              </Badge>
            </div>

            {template.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {template.departments?.name && (
                  <span>{template.departments.name}</span>
                )}
                {template.departments?.name && showOwnership && <span>•</span>}
                {showOwnership && (
                  <span>Por você</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};