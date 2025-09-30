import { useCallback, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle, Download, Info, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSiteCitiesCSVImport } from "@/hooks/useSiteCitiesCSVImport";

export interface SiteCitiesCSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

interface CsvRow {
  name?: string;
  cod_munic?: string;
  cod_uf?: string;
  uf?: string;
  country?: string;
  population_est?: string | number;
  codigo_ibge?: string;
  latitude?: string | number;
  longitude?: string | number;
  capital?: string | number;
  siafi_id?: string;
  ddd?: string;
  fuso_horario?: string;
}

interface ImportResult {
  rowIndex: number;
  status: 'created' | 'updated' | 'ignored' | 'error' | 'duplicate';
  cityName: string;
  message: string;
  action?: 'created' | 'updated' | 'ignored';
}

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  ignored: number;
  errors: number;
  csvDuplicates: number;
  results: ImportResult[];
}

export default function SiteCitiesCSVImportModal({ open, onOpenChange, onImported }: SiteCitiesCSVImportModalProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  
  const { importCitiesFromCSV, isImporting, progress } = useSiteCitiesCSVImport();

  const templateCsv = useMemo(() => {
    const example: CsvRow[] = [
      {
        name: "São Paulo",
        cod_munic: "3550308",
        codigo_ibge: "3550308",
        cod_uf: "35",
        uf: "SP",
        country: "Brasil",
        population_est: 12396372,
        latitude: -23.550520,
        longitude: -46.633309,
        capital: 1,
        siafi_id: "7107",
        ddd: "11",
        fuso_horario: "America/Sao_Paulo",
      },
      {
        name: "Rio de Janeiro",
        cod_munic: "3304557",
        codigo_ibge: "3304557",
        cod_uf: "33",
        uf: "RJ",
        country: "Brasil",
        population_est: 6775561,
        latitude: -22.906847,
        longitude: -43.172896,
        capital: 1,
        siafi_id: "6001",
        ddd: "21",
        fuso_horario: "America/Sao_Paulo",
      },
      {
        name: "Campinas",
        cod_munic: "3509502",
        codigo_ibge: "3509502",
        cod_uf: "35",
        uf: "SP",
        country: "Brasil",
        population_est: 1223237,
        latitude: -22.90556,
        longitude: -47.06083,
        capital: 0,
        siafi_id: "6291",
        ddd: "19",
        fuso_horario: "America/Sao_Paulo",
      },
    ];
    
    const csvData = Papa.unparse(example, {
      header: true,
      delimiter: ",",
    });
    
    return csvData + "\n# Coordenadas podem ser em formato decimal (-23.5505) ou escalonado 1:10000 (-235505)";
  }, []);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([templateCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_cidades.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [templateCsv]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parse results:", results);
        
        if (results.errors.length > 0) {
          toast({
            title: "Erro no parse do CSV",
            description: `Erros encontrados: ${results.errors.map(e => e.message).join(", ")}`,
            variant: "destructive",
          });
        }

        const validRows = results.data.filter((row: any) => 
          row.name && row.name.trim() !== ""
        ) as CsvRow[];

        setRows(validRows);
        setParsing(false);

        if (validRows.length === 0) {
          toast({
            title: "Nenhum dado válido",
            description: "O arquivo CSV não contém dados válidos de cidades.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Arquivo processado",
            description: `${validRows.length} linha(s) encontrada(s)`,
          });
        }
      },
      error: (error) => {
        console.error("Erro no parse:", error);
        toast({
          title: "Erro ao processar arquivo",
          description: error.message,
          variant: "destructive",
        });
        setParsing(false);
      },
    });
  }, [toast]);

  const handleImport = useCallback(async () => {
    if (rows.length === 0) return;

    await importCitiesFromCSV(rows, updateExisting, dryRun, (summary) => {
      setImportSummary(summary);
      if (!dryRun && summary.created > 0) {
        onImported?.();
      }
    });
  }, [rows, updateExisting, dryRun, importCitiesFromCSV, onImported]);

  const downloadReport = useCallback((format: 'csv' | 'json') => {
    if (!importSummary) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      content = Papa.unparse(importSummary.results.map(result => ({
        linha: result.rowIndex,
        status: result.status,
        cidade: result.cityName,
        acao: result.action || '',
        mensagem: result.message,
      })), { header: true });
      filename = 'relatorio_importacao_cidades.csv';
      mimeType = 'text/csv;charset=utf-8;';
    } else {
      content = JSON.stringify(importSummary, null, 2);
      filename = 'relatorio_importacao_cidades.json';
      mimeType = 'application/json;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [importSummary]);

  const resetImport = useCallback(() => {
    setFile(null);
    setRows([]);
    setImportSummary(null);
    setDryRun(false);
    setUpdateExisting(true);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'updated':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'ignored':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'duplicate':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Criada';
      case 'updated': return 'Atualizada';
      case 'ignored': return 'Ignorada';
      case 'duplicate': return 'Duplicada no CSV';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Cidades via CSV</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!importSummary ? (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Faça upload de um arquivo CSV com dados de cidades. Use o template para ver o formato correto.
                  <br />
                  <strong>Campos disponíveis:</strong> name, cod_munic, codigo_ibge, cod_uf, uf, country, population_est, latitude, longitude, capital (0 ou 1), siafi_id, ddd, fuso_horario
                  <br />
                  <strong className="text-amber-600">Nota:</strong> Se a latitude/longitude forem inválidas, a cidade será importada mesmo assim, e as coordenadas serão deixadas em branco.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">Arquivo CSV</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={parsing || isImporting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
                    disabled={parsing || isImporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Template
                  </Button>
                </div>
              </div>

              {file && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Arquivo selecionado:</div>
                  <div className="text-sm text-muted-foreground">{file.name}</div>
                  {rows.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {rows.length} linha(s) encontrada(s)
                    </div>
                  )}
                </div>
              )}

              {rows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="updateExisting"
                        checked={updateExisting}
                        onCheckedChange={(checked) => setUpdateExisting(checked === true)}
                        disabled={isImporting}
                      />
                      <Label htmlFor="updateExisting">Atualizar cidades existentes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dryRun"
                        checked={dryRun}
                        onCheckedChange={(checked) => setDryRun(checked === true)}
                        disabled={isImporting}
                      />
                      <Label htmlFor="dryRun">Simulação (não salvar dados)</Label>
                    </div>
                  </div>

                  {/* Progress Display */}
                  {isImporting && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Processadas: {progress.processed} / {progress.total}</span>
                        <span>{Math.round((progress.processed / progress.total) * 100)}%</span>
                      </div>
                      
                      <Progress 
                        value={(progress.processed / progress.total) * 100} 
                        className="w-full"
                      />
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
                          <div className="font-medium text-green-700">{progress.created}</div>
                          <div className="text-green-600">Criadas</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="font-medium text-blue-700">{progress.updated}</div>
                          <div className="text-blue-600">Atualizadas</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 border border-gray-200 rounded">
                          <div className="font-medium text-gray-700">{progress.ignored}</div>
                          <div className="text-gray-600">Ignoradas</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 border border-red-200 rounded">
                          <div className="font-medium text-red-700">{progress.errors}</div>
                          <div className="text-red-600">Erros</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="font-medium text-yellow-700">{progress.csvDuplicates}</div>
                          <div className="text-yellow-600">Duplicadas no CSV</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Preview */}
                  {!isImporting && (
                    <ScrollArea className="h-48 border rounded-md p-3">
                      <div className="space-y-2">
                        {rows.slice(0, 10).map((row, index) => (
                          <div key={index} className="text-sm p-2 bg-muted/50 rounded border">
                            <div className="font-medium">{row.name}</div>
                            <div className="text-muted-foreground text-xs grid grid-cols-2 gap-1">
                              <div>Cód. Municipal: {row.cod_munic}</div>
                              <div>Cód. IBGE: {row.codigo_ibge || row.cod_munic}</div>
                              <div>UF: {row.uf}</div>
                              <div>Capital: {row.capital === '1' || row.capital === 1 ? 'Sim' : 'Não'}</div>
                              <div>DDD: {row.ddd || '-'}</div>
                              <div>População: {row.population_est || '-'}</div>
                              {row.latitude && row.longitude && (
                                <div className="col-span-2">Coordenadas: {row.latitude}, {row.longitude}</div>
                              )}
                              {row.fuso_horario && (
                                <div className="col-span-2">Fuso: {row.fuso_horario}</div>
                              )}
                            </div>
                          </div>
                        ))}
                        {rows.length > 10 && (
                          <div className="text-center text-muted-foreground text-sm">
                            ... e mais {rows.length - 10} linha(s)
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-3 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importSummary.created}</div>
                  <div className="text-xs text-muted-foreground">Criadas</div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importSummary.updated}</div>
                  <div className="text-xs text-muted-foreground">Atualizadas</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importSummary.ignored}</div>
                  <div className="text-xs text-muted-foreground">Ignoradas</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{importSummary.csvDuplicates}</div>
                  <div className="text-xs text-muted-foreground">Duplicadas no CSV</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importSummary.errors}</div>
                  <div className="text-xs text-muted-foreground">Erros</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                  <div className="text-2xl font-bold">{importSummary.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Relatório CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport('json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Relatório JSON
                </Button>
              </div>

              <ScrollArea className="h-64 border rounded-md">
                <div className="p-3 space-y-2">
                  {importSummary.results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2 border rounded-md text-sm"
                    >
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          Linha {result.rowIndex}: {result.cityName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {getStatusText(result.status)} - {result.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {!importSummary ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={parsing || isImporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={rows.length === 0 || parsing || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {dryRun ? 'Simulando...' : 'Importando...'}
                  </>
                ) : (
                  dryRun ? 'Simular' : 'Importar'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetImport}>
                Nova Importação
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
