import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, Search, X, Database, Clock, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SQLResultsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  sqlQuery: string;
  sqlData: any;
  responseTime: number;
  timestamp: string;
}

export const SQLResultsViewer: React.FC<SQLResultsViewerProps> = ({
  isOpen,
  onClose,
  sqlQuery,
  sqlData,
  responseTime,
  timestamp
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Processar dados para extrair headers e rows
  const { headers, rows, totalRecords } = useMemo(() => {
    console.log('SQLResultsViewer - sqlData:', sqlData);
    console.log('SQLResultsViewer - sqlData type:', typeof sqlData);
    console.log('SQLResultsViewer - sqlData length:', Array.isArray(sqlData) ? sqlData.length : 'not array');
    if (!sqlData) return { headers: [], rows: [], totalRecords: 0 };

    const data = sqlData;
    
    // Se os dados vêm como array de arrays
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      const firstRow = data[0];
      const generatedHeaders = firstRow.map((_: any, index: number) => `Coluna ${index + 1}`);
      
      return {
        headers: generatedHeaders,
        rows: data,
        totalRecords: data.length
      };
    }
    
    // Se os dados vêm como array de objetos
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const objectHeaders = Object.keys(data[0]);
      const objectRows = data.map(item => objectHeaders.map(header => item[header]));
      
      return {
        headers: objectHeaders,
        rows: objectRows,
        totalRecords: data.length
      };
    }

    return { headers: [], rows: [], totalRecords: 0 };
  }, [sqlData]);

  // Filtrar dados baseado na busca
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    
    return rows.filter((row: any[]) => 
      row.some(cell => 
        String(cell || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [rows, searchTerm]);

  // Paginação
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);

  // Função para exportar CSV
  const exportToCSV = () => {
    if (!headers.length || !filteredRows.length) return;

    const csvContent = [
      headers.join(','),
      ...filteredRows.map((row: any[]) => 
        row.map(cell => {
          const value = String(cell || '');
          // Escapar aspas e envolver em aspas se contém vírgula
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sql-results-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' && value.trim() === '') return '';
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-col space-y-2">
            <DialogTitle className="text-xl font-semibold">Resultados da Consulta SQL</DialogTitle>
            <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded max-w-4xl overflow-x-auto">
              {sqlQuery}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Registros</p>
                  <p className="text-2xl font-bold">{totalRecords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Colunas</p>
                  <p className="text-2xl font-bold">{headers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Tempo</p>
                  <p className="text-2xl font-bold">{responseTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Filtrados</p>
                  <p className="text-2xl font-bold">{filteredRows.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between space-x-4 mb-4">
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos resultados..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-sm"
            />
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                Limpar
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {filteredRows.length} registros
            </Badge>
            <Button onClick={exportToCSV} disabled={!filteredRows.length}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <div className="flex-1 border rounded-lg overflow-hidden">
          <ScrollArea className="h-[calc(95vh-350px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row: any[], rowIndex: number) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="max-w-xs">
                          <div className="truncate" title={formatCellValue(cell)}>
                            {formatCellValue(cell)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={headers.length} className="h-24 text-center">
                      {searchTerm ? 'Nenhum resultado encontrado para a busca.' : 'Nenhum dado disponível.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredRows.length)} até{' '}
                {Math.min(currentPage * pageSize, filteredRows.length)} de {filteredRows.length} registros
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};