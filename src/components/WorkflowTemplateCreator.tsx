import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkflowTemplates } from "@/hooks/useWorkflowTemplates";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useToast } from "@/hooks/use-toast";
import { Save, X, Plus } from "lucide-react";

interface WorkflowTemplateCreatorProps {
  onSave: () => void;
  onCancel: () => void;
}

export const WorkflowTemplateCreator = ({ onSave, onCancel }: WorkflowTemplateCreatorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [complexityLevel, setComplexityLevel] = useState<"basic" | "intermediate" | "advanced">("basic");
  const [confidentialityLevel, setConfidentialityLevel] = useState<"public" | "private">("public");
  const [instructions, setInstructions] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [exampleUsage, setExampleUsage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [saving, setSaving] = useState(false);

  const { createTemplateFromWorkflow } = useWorkflowTemplates();
  const { workflows } = useWorkflows();
  const { toast } = useToast();

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o template.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkflow) {
      toast({
        title: "Workflow obrigatório",
        description: "Por favor, selecione um workflow para criar o template.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const workflow = workflows.find(w => w.id === selectedWorkflow);
      if (!workflow) {
        throw new Error("Workflow não encontrado");
      }

      await createTemplateFromWorkflow(workflow, {
        name,
        description,
        category,
        complexity_level: complexityLevel,
        confidentiality_level: confidentialityLevel as any, // Cast durante migração
        instructions,
        prerequisites,
        example_usage: exampleUsage,
        tags,
      });

      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      });

      onSave();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Erro ao criar template",
        description: "Não foi possível criar o template. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Processo de Contratação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rh">👥 Recursos Humanos</SelectItem>
                  <SelectItem value="financeiro">💰 Financeiro</SelectItem>
                  <SelectItem value="ti">💻 Tecnologia da Informação</SelectItem>
                  <SelectItem value="marketing">📢 Marketing</SelectItem>
                  <SelectItem value="vendas">📈 Vendas</SelectItem>
                  <SelectItem value="operacional">⚙️ Operacional</SelectItem>
                  <SelectItem value="geral">📋 Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Nível de Complexidade</Label>
              <Select value={complexityLevel} onValueChange={(value) => setComplexityLevel(value as "basic" | "intermediate" | "advanced")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Básico</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidentiality">Confidencialidade</Label>
              <Select value={confidentialityLevel} onValueChange={(value) => setConfidentialityLevel(value as "public" | "private")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow">Workflow Base*</Label>
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que este template faz..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções de Configuração</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Passo a passo para configurar este template..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Pré-requisitos</Label>
              <Textarea
                id="prerequisites"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="O que precisa estar configurado antes de usar..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="example">Exemplo de Uso</Label>
              <Textarea
                id="example"
                value={exampleUsage}
                onChange={(e) => setExampleUsage(e.target.value)}
                placeholder="Exemplo prático de quando usar este template..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Adicionar tag..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button type="button" onClick={handleAddTag} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                {tag} ×
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Criando..." : "Criar Template"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};