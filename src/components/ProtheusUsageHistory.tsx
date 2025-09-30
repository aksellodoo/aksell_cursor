import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Activity, TrendingUp, Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useProtheusLogs, useProtheusLogStats, LogFilters } from '@/hooks/useProtheusLogs';

export const ProtheusUsageHistory: React.FC = () => {
  const [filters, setFilters] = useState<LogFilters>({});
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const { data: logs, isLoading } = useProtheusLogs(filters);
  const { data: stats } = useProtheusLogStats();

  const handleFilterChange = (key: keyof LogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportLogs = () => {
    if (!logs) return;
    
    const csvData = logs.map(log => ({
      'Data/Hora': new Date(log.executed_at).toLocaleString(),
      'Endpoint': log.endpoint_used,
      'Status': log.response_status,
      'Tempo (ms)': log.response_time_ms || 'N/A',
      'Erro': log.error_message || 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protheus_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'timeout':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Resumidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Total de Usos</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Tempo Médio</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Endpoint + Usado</p>
                <p className="text-sm font-bold">
                  {Object.entries(stats.endpointUsage).length > 0 
                    ? Object.entries(stats.endpointUsage).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                    : 'N/A'
                  }
                </p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "PPP") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleFilterChange('startDate', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "PPP") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleFilterChange('endDate', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Endpoint */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Endpoint</label>
              <Select value={filters.endpoint || 'all'} onValueChange={(value) => handleFilterChange('endpoint', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os endpoints" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os endpoints</SelectItem>
                  <SelectItem value="/ping">Ping</SelectItem>
                  <SelectItem value="/consulta">Consulta</SelectItem>
                  <SelectItem value="/sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button variant="outline" onClick={exportLogs} disabled={!logs || logs.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tempo (ms)</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.executed_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {log.endpoint_used}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.response_status)}
                        <Badge variant={getStatusColor(log.response_status) as any}>
                          {log.response_status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.response_time_ms || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Log</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Endpoint:</label>
                                <p className="text-sm">{log.endpoint_used}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status:</label>
                                <p className="text-sm">{log.response_status}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Tempo de Resposta:</label>
                                <p className="text-sm">{log.response_time_ms || 'N/A'}ms</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Data:</label>
                                <p className="text-sm">{new Date(log.executed_at).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            {log.request_data && Object.keys(log.request_data).length > 0 && (
                              <div>
                                <label className="text-sm font-medium">Dados da Requisição:</label>
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                  {JSON.stringify(log.request_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.response_data && Object.keys(log.response_data).length > 0 && (
                              <div>
                                <label className="text-sm font-medium">Dados da Resposta:</label>
                                <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                                  {JSON.stringify(log.response_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.error_message && (
                              <div>
                                <label className="text-sm font-medium">Mensagem de Erro:</label>
                                <p className="text-sm text-red-500">{log.error_message}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};