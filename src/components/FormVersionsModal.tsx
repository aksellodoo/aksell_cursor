import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, Eye, FileText, Trash2, Archive, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useFormPublication } from '@/hooks/useFormPublication';
import { Form } from '@/hooks/useForms';
import { toast } from 'sonner';

interface FormVersion {
  id: string;
  version_number: number;
  title: string;
  description?: string;
  fields_definition: any;
  settings: any;
  created_at: string;
  created_by: string;
  is_current: boolean;
  response_count: number;
}

interface FormVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  canDelete?: boolean;
}

export const FormVersionsModal = ({ isOpen, onClose, form, canDelete = false }: FormVersionsModalProps) => {
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null);
  const { getFormVersions } = useFormPublication();

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, form.id]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await getFormVersions(form.id);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Erro ao carregar versões');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version: FormVersion) => {
    setSelectedVersion(version);
  };

  const getStatusColor = (version: FormVersion) => {
    if (version.is_current) return 'default';
    if (version.response_count > 0) return 'secondary';
    return 'outline';
  };

  const getStatusLabel = (version: FormVersion) => {
    if (version.is_current) return 'Atual';
    if (version.response_count > 0) return 'Com Respostas';
    return 'Arquivada';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Versões do Formulário: {form.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Form Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Versão Atual</span>
                    <Badge variant="default">v{(form as any).version_number || 1}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(form as any).is_published ? 'Publicado' : 'Rascunho'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Campos:</div>
                    <div className="text-muted-foreground">{form.fields_definition?.length || 0}</div>
                  </div>
                  <div>
                    <div className="font-medium">Atualizado:</div>
                    <div className="text-muted-foreground">{formatDate(form.updated_at)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Status:</div>
                    <Badge variant={(form as any).is_published ? 'default' : 'secondary'}>
                      {(form as any).is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Versions List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Versões Anteriores</h3>
                <Badge variant="outline">{versions.length} versões</Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : versions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Archive className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma versão anterior encontrada.<br />
                      Versões são criadas automaticamente quando um formulário com respostas é editado.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <Card key={version.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Versão {version.version_number}</span>
                                <Badge variant={getStatusColor(version)}>
                                  {getStatusLabel(version)}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {version.title}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {version.response_count} respostas
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(version.created_at)}
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewVersion(version)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {canDelete && version.response_count === 0 && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir Versão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a versão {version.version_number}? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version Details Modal */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                Versão {selectedVersion.version_number} - {selectedVersion.title}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Data de Criação</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedVersion.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Respostas</Label>
                    <p className="text-sm text-muted-foreground">{selectedVersion.response_count}</p>
                  </div>
                </div>

                {selectedVersion.description && (
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm text-muted-foreground">{selectedVersion.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Campos ({selectedVersion.fields_definition?.length || 0})</Label>
                  <div className="mt-2 space-y-2">
                    {selectedVersion.fields_definition?.map((field: any, index: number) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="font-medium">{field.label}</div>
                        <div className="text-muted-foreground">
                          {field.type} {field.required && '(obrigatório)'}
                        </div>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">Nenhum campo definido</p>}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};