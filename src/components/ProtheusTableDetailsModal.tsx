import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Clock, Database, Settings } from 'lucide-react';
import { CreateProtheusTableModal } from './CreateProtheusTableModal';
import { useState } from 'react';

interface ProtheusTableDetailsModalProps {
  table: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProtheusTableDetailsModal = ({ 
  table, 
  isOpen, 
  onClose 
}: ProtheusTableDetailsModalProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!table) return null;

  const hasSupabaseTable = Boolean(table.supabase_table_name);

  const getIntervalText = () => {
    const unitLabels = {
      seconds: 'segundo(s)',
      minutes: 'minuto(s)', 
      hours: 'hora(s)',
      days: 'dia(s)'
    };
    
    return `${table.query_interval_value} ${unitLabels[table.query_interval_unit as keyof typeof unitLabels]}`;
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    // Don't close the details modal, just the edit modal
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Tabela Protheus
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Informações Básicas
                  </span>
                  <Badge variant={table.is_active ? "default" : "secondary"}>
                    {table.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground">Nome da Tabela</h4>
                    <p className="text-lg font-mono bg-muted px-3 py-2 rounded-md">
                      {table.table_name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Intervalo de Consulta</h4>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {getIntervalText()}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">Descrição</h4>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">
                    {table.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Badge 
                        variant={table.fetch_all_fields ? "default" : "secondary"}
                        className="px-3 py-1"
                      >
                        {table.fetch_all_fields ? "Sim" : "Não"}
                      </Badge>
                      <p className="text-sm font-medium">Buscar Todos os Campos</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Badge 
                        variant={table.create_supabase_table ? "default" : "secondary"}
                        className="px-3 py-1"
                      >
                        {table.create_supabase_table ? "Sim" : "Não"}
                      </Badge>
                      <p className="text-sm font-medium">Tabela no Supabase</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Badge 
                        variant={table.extra_database_fields ? "default" : "secondary"}
                        className="px-3 py-1"
                      >
                        {table.extra_database_fields ? "Sim" : "Não"}
                      </Badge>
                      <p className="text-sm font-medium">Campos Extras</p>
                    </div>
                  </div>
                </div>

                {/* Hash SHA256 Settings */}
                <div className="pt-6 border-t border-border">
                  <h4 className="text-base font-medium mb-4">Controle de Alterações por Hash</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Badge 
                          variant={table.enable_sha256_hash ? "default" : "secondary"}
                          className="px-3 py-1"
                        >
                          {table.enable_sha256_hash ? "Ativo" : "Inativo"}
                        </Badge>
                        <p className="text-sm font-medium">Hash SHA256 por linha</p>
                      </div>
                    </div>
                    
                    {table.enable_sha256_hash && (
                      <>
                        <div className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge 
                              variant={table.log_hash_changes ? "default" : "secondary"}
                              className="px-3 py-1"
                            >
                              {table.log_hash_changes ? "Sim" : "Não"}
                            </Badge>
                            <p className="text-sm font-medium">Log de alterações</p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge 
                              variant={table.detect_new_records ? "default" : "secondary"}
                              className="px-3 py-1"
                            >
                              {table.detect_new_records ? "Sim" : "Não"}
                            </Badge>
                            <p className="text-sm font-medium">Detectar novos registros</p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Badge 
                              variant={table.detect_deleted_records ? "default" : "secondary"}
                              className="px-3 py-1"
                            >
                              {table.detect_deleted_records ? "Sim" : "Não"}
                            </Badge>
                            <p className="text-sm font-medium">Detectar registros apagados</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Criado em:</span>
                    <p className="text-muted-foreground">
                      {new Date(table.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Última atualização:</span>
                    <p className="text-muted-foreground">
                      {new Date(table.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {table.last_sync_at && (
                    <div>
                      <span className="font-medium">Última sincronização:</span>
                      <p className="text-muted-foreground">
                        {new Date(table.last_sync_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button onClick={() => setIsEditModalOpen(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                {hasSupabaseTable ? 'Editar Campos Extras' : 'Editar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <CreateProtheusTableModal 
          table={table}
          isEdit={true}
          hasSupabaseTable={hasSupabaseTable}
          onClose={handleEditClose}
        />
      )}
    </>
  );
};