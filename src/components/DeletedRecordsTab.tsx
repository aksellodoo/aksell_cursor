import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Download, Search, RotateCcw, Trash2, Calendar } from 'lucide-react';
// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return dateString;
  }
};
import { useToast } from '@/hooks/use-toast';

interface DeletedRecordsTabProps {
  deletedRecordsData: any[];
  deletedRecordsLoading: boolean;
  deletedRecordsCount: number;
  columns: string[];
  visibleColumns: Set<string>;
  fetchDeletedRecords: () => Promise<void>;
  restoreDeletedRecord: (recordId: string) => Promise<void>;
  tableId: string;
}

export function DeletedRecordsTab({
  deletedRecordsData,
  deletedRecordsLoading,
  deletedRecordsCount,
  columns,
  visibleColumns,
  fetchDeletedRecords,
  restoreDeletedRecord,
  tableId
}: DeletedRecordsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const { toast } = useToast();

  // Load deleted records when component mounts
  useEffect(() => {
    fetchDeletedRecords();
  }, [fetchDeletedRecords]);

  // Filter deleted records based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(deletedRecordsData);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = deletedRecordsData.filter((record) => {
      return Object.values(record).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
    setFilteredData(filtered);
  }, [deletedRecordsData, searchTerm]);

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return formatDate(value);
    }
    return String(value);
  };

  const handleRestoreRecord = async (record: any) => {
    if (!record.id) {
      toast({
        title: "Erro",
        description: "ID do registro não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      await restoreDeletedRecord(record.id);
    } catch (error) {
      console.error('Error restoring record:', error);
    }
  };

  const exportDeletedRecordsToCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há registros apagados disponíveis.',
        variant: 'destructive'
      });
      return;
    }

    const allKeysSet = new Set<string>();
    filteredData.forEach((row: any) => Object.keys(row).forEach((k) => allKeysSet.add(k)));
    const allKeys = Array.from(allKeysSet);

    const visibleHeaders = columns.filter((c) => visibleColumns.has(c));
    const remainingHeaders = allKeys.filter((k) => !visibleHeaders.includes(k));
    const headers = ['pending_deletion_at', ...visibleHeaders, ...remainingHeaders];

    const csvContent = [
      headers.join(','),
      ...filteredData.map((row: any) =>
        headers
          .map((header) => {
            const raw = row[header];
            const value = raw === null || raw === undefined ? '' : formatCellValue(raw);
            const stringValue = String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_apagados_${tableId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportação concluída',
      description: `${filteredData.length} registros apagados exportados.`
    });
  };

  if (deletedRecordsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em registros apagados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredData.length} de {deletedRecordsCount} registros apagados
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeletedRecords}
            disabled={deletedRecordsLoading}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${deletedRecordsLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportDeletedRecordsToCSV}
            disabled={filteredData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Content */}
      {deletedRecordsCount === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum registro apagado</h3>
              <p className="text-muted-foreground">
                Não há registros com pending_deletion marcado como true.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Nenhum registro apagado corresponde aos critérios de busca.
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Limpar busca
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-96">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="whitespace-nowrap h-9 px-3 text-xs w-32">
                      Ações
                    </TableHead>
                    <TableHead className="whitespace-nowrap h-9 px-3 text-xs w-40">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Data de Deleção
                      </div>
                    </TableHead>
                    {columns.filter(col => visibleColumns.has(col)).map((column) => (
                      <TableHead key={column} className="whitespace-nowrap h-9 px-3 text-xs">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record, index) => (
                    <TableRow key={index} className="h-9 hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap px-3 py-1 text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreRecord(record)}
                          className="h-7 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restaurar
                        </Button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-1 text-xs text-red-600">
                        {record.pending_deletion_at ? formatDate(record.pending_deletion_at) : '-'}
                      </TableCell>
                      {columns.filter(col => visibleColumns.has(col)).map((column) => (
                        <TableCell key={column} className="whitespace-nowrap px-3 py-1 text-xs">
                          {formatCellValue(record[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information about deleted records */}
      <Alert>
        <Trash2 className="h-4 w-4" />
        <AlertDescription>
          Esta aba mostra registros que foram marcados para deleção (pending_deletion = true). 
          Estes registros foram identificados como deletados no Protheus durante sincronizações anteriores. 
          Você pode restaurar registros individualmente caso tenham sido marcados por engano.
        </AlertDescription>
      </Alert>
    </div>
  );
}