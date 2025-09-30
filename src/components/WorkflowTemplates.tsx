import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWorkflowTemplates, WorkflowTemplate } from "@/hooks/useWorkflowTemplates";
import { Download, Eye, Star, User, Calendar, Tag, MoreHorizontal, Plus, HelpCircle, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { WorkflowTemplatePreview } from "./WorkflowTemplatePreview";
import { WorkflowTemplateCustomizer } from "./WorkflowTemplateCustomizer";
import { WorkflowTemplateCreator } from "./WorkflowTemplateCreator";
import { WorkflowTemplateHelp } from "./WorkflowTemplateHelp";

export const WorkflowTemplates = ({ onWorkflowCreated }: { onWorkflowCreated?: () => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterComplexity, setFilterComplexity] = useState<string>("all");
  const [filterTags, setFilterTags] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("usage");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showCustomizerDialog, setShowCustomizerDialog] = useState(false);
  const [showCreatorDialog, setShowCreatorDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const { templates, loading, useTemplate, fetchTemplates } = useWorkflowTemplates();
  const { toast } = useToast();

  // Get unique categories and tags from templates
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(templates.map(t => t.category))];
    return uniqueCategories.sort();
  }, [templates]);

  const tags = useMemo(() => {
    const allTags = templates.flatMap(t => t.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.sort();
  }, [templates]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = filterCategory === "all" || template.category === filterCategory;
      const matchesComplexity = filterComplexity === "all" || template.complexity_level === filterComplexity;
      const matchesTags = filterTags === "all" || template.tags?.includes(filterTags);

      return matchesSearch && matchesCategory && matchesComplexity && matchesTags;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return (b.usage_count || 0) - (a.usage_count || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "complexity":
          const complexityOrder = { basic: 1, intermediate: 2, advanced: 3 };
          return complexityOrder[a.complexity_level] - complexityOrder[b.complexity_level];
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchTerm, filterCategory, filterComplexity, filterTags, sortBy]);

  const getCategoryLabel = (category: string) => {
    const labels = {
      'rh': 'Recursos Humanos',
      'financeiro': 'Financeiro',
      'geral': 'Geral',
      'ti': 'Tecnologia da Informação',
      'marketing': 'Marketing',
      'vendas': 'Vendas',
      'operacional': 'Operacional'
    };
    return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'rh': '👥',
      'financeiro': '💰',
      'geral': '📋',
      'ti': '💻',
      'marketing': '📢',
      'vendas': '📈',
      'operacional': '⚙️'
    };
    return icons[category] || '📋';
  };

  const getComplexityLabel = (level: string) => {
    const labels = {
      'basic': 'Básico',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado'
    };
    return labels[level] || level;
  };

  const getComplexityColor = (level: string) => {
    const colors = {
      'basic': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const handlePreviewTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewDialog(true);
  };

  const handleUseTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowCustomizerDialog(true);
  };

  const handleTemplateUsed = async () => {
    setShowCustomizerDialog(false);
    setSelectedTemplate(null);
    fetchTemplates(); // Refresh to update usage count
    
    // Notify parent component to refresh workflows list
    if (onWorkflowCreated) {
      await onWorkflowCreated();
    }
    
    toast({
      title: "Workflow criado",
      description: "O workflow foi criado com sucesso baseado no template.",
    });
  };

  const handleTemplateCreated = () => {
    setShowCreatorDialog(false);
    fetchTemplates(); // Refresh templates list
    toast({
      title: "Template criado",
      description: "O novo template foi criado com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Complexidade</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Modelos / Templates</h2>
          <p className="text-muted-foreground">
            Escolha um modelo pronto para criar workflows rapidamente ou crie seus próprios templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelpDialog(true)}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Manual
          </Button>
          <Button onClick={() => setShowCreatorDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:max-w-xs"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="lg:w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterComplexity} onValueChange={setFilterComplexity}>
          <SelectTrigger className="lg:w-[160px]">
            <SelectValue placeholder="Complexidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="intermediate">Intermediário</SelectItem>
            <SelectItem value="advanced">Avançado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTags} onValueChange={setFilterTags}>
          <SelectTrigger className="lg:w-[160px]">
            <SelectValue placeholder="Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="lg:w-[140px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usage">Mais usado</SelectItem>
            <SelectItem value="name">Nome A-Z</SelectItem>
            <SelectItem value="created">Mais recente</SelectItem>
            <SelectItem value="complexity">Complexidade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-2">
            {searchTerm || filterCategory !== "all" || filterComplexity !== "all" || filterTags !== "all"
              ? "Nenhum template encontrado"
              : "Nenhum template disponível"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchTerm || filterCategory !== "all" || filterComplexity !== "all" || filterTags !== "all"
              ? "Tente ajustar os filtros para encontrar o que procura."
              : "Crie seu primeiro template clicando em 'Criar Template'."}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Complexidade</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </div>
                      {template.example_usage && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Exemplo:</span> {template.example_usage}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(template.category)}</span>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(template.category)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getComplexityColor(template.complexity_level)}>
                      {getComplexityLabel(template.complexity_level)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {template.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags && template.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{template.usage_count || 0}</span>
                      <span className="text-sm text-muted-foreground">usos</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(template.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Usar Template
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <WorkflowTemplatePreview
              template={selectedTemplate}
              onUse={() => {
                setShowPreviewDialog(false);
                handleUseTemplate(selectedTemplate);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Customizer Dialog */}
      <Dialog open={showCustomizerDialog} onOpenChange={setShowCustomizerDialog}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Personalizar: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <WorkflowTemplateCustomizer
              template={selectedTemplate}
              onSave={handleTemplateUsed}
              onCancel={() => setShowCustomizerDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Creator Dialog */}
      <Dialog open={showCreatorDialog} onOpenChange={setShowCreatorDialog}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Criar Novo Template
            </DialogTitle>
          </DialogHeader>
          <WorkflowTemplateCreator
            onSave={handleTemplateCreated}
            onCancel={() => setShowCreatorDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Manual de Templates e Workflows
            </DialogTitle>
          </DialogHeader>
          <WorkflowTemplateHelp />
        </DialogContent>
      </Dialog>
    </div>
  );
};