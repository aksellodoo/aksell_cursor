import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'employees' | 'departments' | 'users';
  onImport: (data: any[]) => Promise<void>;
  onExport: () => void;
  templateData: any[];
}

interface ImportResult {
  success: number;
  errors: { row: number; message: string }[];
  data: any[];
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onImport,
  onExport,
  templateData
}) => {
  const [activeTab, setActiveTab] = useState('export');
  const [importData, setImportData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const getEntityConfig = () => {
    switch (entityType) {
      case 'employees':
        return {
          name: 'Funcionários',
          templateHeaders: ['Nome Completo', 'CPF', 'Email', 'Cargo', 'Departamento', 'Data de Contratação', 'Telefone', 'Tipo de Contrato', 'Salário'],
          requiredFields: ['Nome Completo', 'CPF', 'Cargo', 'Data de Contratação']
        };
      case 'departments':
        return {
          name: 'Departamentos',
          templateHeaders: ['Nome', 'Descrição', 'Cor'],
          requiredFields: ['Nome']
        };
      case 'users':
        return {
          name: 'Usuários',
          templateHeaders: ['Nome', 'Email', 'Cargo', 'Departamento'],
          requiredFields: ['Nome', 'Email']
        };
      default:
        return { name: '', templateHeaders: [], requiredFields: [] };
    }
  };

  const config = getEntityConfig();

  const validateData = (data: any[]): ImportResult => {
    const errors: { row: number; message: string }[] = [];
    const validData: any[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque começamos na linha 2 (linha 1 é cabeçalho)
      
      // Verificar campos obrigatórios
      config.requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: rowNumber,
            message: `Campo obrigatório "${field}" está vazio`
          });
        }
      });

      // Validações específicas para funcionários
      if (entityType === 'employees') {
        // Validar CPF
        if (row['CPF'] && !isValidCPF(row['CPF'])) {
          errors.push({
            row: rowNumber,
            message: 'CPF inválido'
          });
        }

        // Validar email
        if (row['Email'] && !isValidEmail(row['Email'])) {
          errors.push({
            row: rowNumber,
            message: 'Email inválido'
          });
        }

        // Validar data
        if (row['Data de Contratação'] && !isValidDate(row['Data de Contratação'])) {
          errors.push({
            row: rowNumber,
            message: 'Data de contratação inválida (use formato DD/MM/AAAA)'
          });
        }
      }

      if (errors.filter(e => e.row === rowNumber).length === 0) {
        validData.push(row);
      }
    });

    return {
      success: validData.length,
      errors,
      data: validData
    };
  };

  const isValidCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validar dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = (sum * 10) % 11;
    if (digit2 === 10) digit2 = 0;
    
    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidDate = (date: string): boolean => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(date)) return false;
    
    const [, day, month, year] = date.match(regex)!;
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.getDate() === parseInt(day) && 
           dateObj.getMonth() === parseInt(month) - 1 && 
           dateObj.getFullYear() === parseInt(year);
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let parsedData: any[] = [];

        if (file.name.endsWith('.csv')) {
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              parsedData = results.data as any[];
              setProgress(50);
              
              const validation = validateData(parsedData);
              setImportResult(validation);
              setImportData(validation.data);
              setProgress(100);
              setIsProcessing(false);
            }
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          
          setProgress(50);
          
          const validation = validateData(parsedData);
          setImportResult(validation);
          setImportData(validation.data);
          setProgress(100);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast({
          title: 'Erro no arquivo',
          description: 'Não foi possível processar o arquivo. Verifique se está no formato correto.',
          variant: 'destructive'
        });
        setIsProcessing(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (importData.length === 0) return;

    try {
      setIsProcessing(true);
      await onImport(importData);
      toast({
        title: 'Importação concluída',
        description: `${importData.length} registros importados com sucesso.`
      });
      onClose();
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar os dados.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      config.templateHeaders.join(','),
      ...templateData.map(row => config.templateHeaders.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_${entityType}.csv`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar / Exportar {config.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Dados
                </CardTitle>
                <CardDescription>
                  Baixe todos os dados de {config.name.toLowerCase()} em formato CSV ou Excel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={onExport} className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importar Dados
                </CardTitle>
                <CardDescription>
                  Faça upload de um arquivo CSV ou Excel para importar {config.name.toLowerCase()}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Campos obrigatórios:</strong> {config.requiredFields.join(', ')}
                  </AlertDescription>
                </Alert>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Clique ou arraste um arquivo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Suporta arquivos CSV, XLS e XLSX (máx. 10MB)
                  </p>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Processando arquivo...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {importResult && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Badge variant={importResult.errors.length === 0 ? 'default' : 'destructive'}>
                        {importResult.success} registros válidos
                      </Badge>
                      {importResult.errors.length > 0 && (
                        <Badge variant="destructive">
                          {importResult.errors.length} erros
                        </Badge>
                      )}
                    </div>

                    {importResult.errors.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-destructive">Erros Encontrados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {importResult.errors.map((error, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">Linha {error.row}:</span> {error.message}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {importResult.success > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span>Pronto para importar {importResult.success} registros</span>
                        </div>
                        <Button 
                          onClick={handleImport}
                          disabled={isProcessing}
                          className="flex items-center gap-2"
                        >
                          {isProcessing ? 'Importando...' : 'Confirmar Importação'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};