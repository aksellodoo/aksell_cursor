import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Filter, Download, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  timestamp: string;
  changer_name?: string;
}

interface UserHistoryModalProps {
  userId: string | null;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const fieldLabels: Record<string, string> = {
  name: 'Nome',
  email: 'Email',
  role: 'Função',
  department: 'Departamento',
  status: 'Status',
  is_leader: 'Liderança'
};

const fieldColors: Record<string, string> = {
  name: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  email: 'bg-green-500/10 text-green-700 border-green-500/20',
  role: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  department: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  status: 'bg-red-500/10 text-red-700 border-red-500/20',
  is_leader: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
};

export const UserHistoryModal = ({ userId, userName, isOpen, onClose }: UserHistoryModalProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    if (isOpen && userId) {
      fetchAuditLogs();
    }
  }, [isOpen, userId]);

  const fetchAuditLogs = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('field_audit_log')
        .select(`
          id,
          field_name,
          old_value,
          new_value,
          changed_by,
          timestamp,
          changer:profiles!field_audit_log_changed_by_fkey(name)
        `)
        .eq('record_id', userId)
        .eq('record_type', 'user')
        .order('timestamp', { ascending: false });

      // Apply period filter
      if (selectedPeriod !== 'all') {
        const daysAgo = parseInt(selectedPeriod);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        query = query.gte('timestamp', cutoffDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }

      const logsWithChanger = data?.map(log => ({
        ...log,
        changer_name: (log as any).changer?.name || 'Sistema'
      })) || [];

      setAuditLogs(logsWithChanger);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.old_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.new_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesField = selectedField === 'all' || log.field_name === selectedField;
    
    return matchesSearch && matchesField;
  });

  const exportHistory = () => {
    const csvContent = [
      ['Data/Hora', 'Campo', 'Valor Anterior', 'Valor Novo', 'Alterado Por'],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        fieldLabels[log.field_name] || log.field_name,
        log.old_value || '-',
        log.new_value || '-',
        log.changer_name || 'Sistema'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico_${userName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Histórico de Alterações - {userName}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nas alterações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os campos</SelectItem>
              {Object.entries(fieldLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportHistory} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Timeline */}
        <ScrollArea className="flex-1 max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              Nenhuma alteração encontrada para os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="relative">
                  {index < filteredLogs.length - 1 && (
                    <div className="absolute left-4 top-12 bottom-0 w-px bg-border" />
                  )}
                  
                  <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={fieldColors[log.field_name] || 'bg-gray-500/10 text-gray-700 border-gray-500/20'}
                        >
                          {fieldLabels[log.field_name] || log.field_name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          por {log.changer_name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-700 font-mono">
                          {log.old_value || 'vazio'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="px-2 py-1 rounded bg-green-500/10 text-green-700 font-mono">
                          {log.new_value || 'vazio'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};