import React, { useState, useEffect } from 'react';
import { X, Search, RefreshCw, Download, Database, Calendar, Hash, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useProtheusSyncedData } from '@/hooks/useProtheusSyncedData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RecordStatusPanel } from './RecordStatusPanel';

interface FullScreenTableViewerProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
}

export const FullScreenTableViewer = ({ 
  isOpen, 
  onClose, 
  tableId, 
  tableName 
}: FullScreenTableViewerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  
  const {
    data,
    columns,
    loading,
    error,
    totalCount,
    lastSyncAt,
    pagination,
    setPagination,
    setSearchTerm: updateSearchTerm,
    refreshData,
    forceSyncTable,
    fetchAllDataForExport
  } = useProtheusSyncedData(tableId);

  // Initialize visible columns when columns data loads
  useEffect(() => {
    if (columns.length > 0 && visibleColumns.size === 0) {
      setVisibleColumns(new Set(columns.slice(0, 10))); // Show first 10 columns by default
    }
  }, [columns, visibleColumns.size]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateSearchTerm(value);
    setPagination(1, pagination.limit);
  };

  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  const handlePageSizeChange = (value: string) => {
    const newLimit = parseInt(value);
    setPagination(1, newLimit);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(pagination.page - 1, pagination.limit);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(pagination.page + 1, pagination.limit);
    }
  };

  const exportToCSV = async () => {
    if (totalCount === 0) {
      return;
    }

    try {
      setIsExporting(true);
      
      const allData = await fetchAllDataForExport();
      
      if (allData.length === 0) {
        return;
      }

      // Montar cabeçalhos: primeiro colunas visíveis (na ordem de 'columns'), depois quaisquer campos restantes
      const allKeysSet = new Set<string>();
      allData.forEach((row: any) => Object.keys(row).forEach((k) => allKeysSet.add(k)));
      const allKeys = Array.from(allKeysSet);

      const visibleHeaders = columns.filter((c) => visibleColumns.has(c));
      const remainingHeaders = allKeys.filter((k) => !visibleHeaders.includes(k));
      const headers = [...visibleHeaders, ...remainingHeaders];

      const csvContent = [
        headers.join(','),
        ...allData.map((row: any) =>
          headers.map((col) => `"${(row[col] === null || row[col] === undefined ? '' : formatCellValue(row[col])).toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      a.download = `${tableName}_${allData.length}_registros_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error: any) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Dados da Tabela: {tableName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {totalCount} registros encontrados
                </p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-4 p-4 border-b bg-muted/30">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos registros..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Column Visibility Selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Colunas ({visibleColumns.size})
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Selecionar Colunas Visíveis</h4>
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {columns.map((column) => (
                            <div key={column} className="flex items-center space-x-2">
                              <Checkbox
                                id={column}
                                checked={visibleColumns.has(column)}
                                onCheckedChange={() => toggleColumnVisibility(column)}
                              />
                              <label htmlFor={column} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {column}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={forceSyncTable}
                  disabled={loading}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Sincronizar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToCSV}
                  disabled={isExporting}
                  className="bg-primary/5 hover:bg-primary/10 border-primary/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar CSV"}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20">
            <Card className="shadow-sm border-0 bg-gradient-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total de Registros</p>
                    <p className="text-lg font-bold text-foreground">{totalCount}</p>
                  </div>
                  <Hash className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-gradient-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Campos</p>
                    <p className="text-lg font-bold text-foreground">{columns.length}</p>
                  </div>
                  <Eye className="h-4 w-4 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-gradient-card">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Última Sincronização</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(lastSyncAt)}
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Carregando dados..." />
              </div>
            ) : error ? (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum registro encontrado</p>
                <p className="text-sm mt-2">
                  Execute uma sincronização para carregar os dados
                </p>
              </div>
            ) : (
              <div className="flex-1 border rounded-lg overflow-hidden bg-card flex">
                {/* Tabela Principal */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full w-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                        <TableRow>
                          {Array.from(visibleColumns).map((column) => (
                            <TableHead key={column}>
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((record, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            {Array.from(visibleColumns).map((column) => (
                              <TableCell key={column}>
                                {formatCellValue(record[column])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                {/* Status Panel */}
                <RecordStatusPanel
                  data={data}
                  loading={loading}
                  hoveredRowIndex={undefined}
                  onRowHover={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};