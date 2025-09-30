import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { useApplicationsCSVImport } from "@/hooks/useApplicationsCSVImport";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApplicationsCSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const ApplicationsCSVImportModal = ({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: ApplicationsCSVImportModalProps) => {
  const [csvData, setCsvData] = useState("");
  const { importApplicationsFromCSV, isImporting, progress } = useApplicationsCSVImport();

  const handleImport = async () => {
    if (!csvData.trim()) return;
    
    await importApplicationsFromCSV(csvData, () => {
      setCsvData("");
      onOpenChange(false);
      onImportComplete?.();
    });
  };

  const handleDownloadTemplate = () => {
    const template = `# Template para Import de Aplicações
# Uma aplicação por linha
# Linhas que começam com # são ignoradas
Produtos de limpeza
Tratamento de água
Cosméticos e higiene pessoal
Alimentação animal
Fertilizantes e agricultura
Produtos farmacêuticos
Tintas e revestimentos
Processamento de petróleo
Mineração e metalurgia
Tratamento de efluentes`;

    const blob = new Blob([template], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_aplicacoes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCsvData("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Aplicações via CSV/Texto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cole uma lista de aplicações, uma por linha. O sistema irá criar automaticamente as aplicações que não existem e traduzir para o inglês em background.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="csvData">Lista de Aplicações</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar Template
              </Button>
            </div>
            <Textarea
              id="csvData"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Cole aqui a lista de aplicações, uma por linha:&#10;Produtos de limpeza&#10;Tratamento de água&#10;Cosméticos e higiene pessoal"
              className="min-h-[200px] font-mono text-sm"
              disabled={isImporting}
            />
            <div className="text-xs text-muted-foreground">
              💡 Dica: Linhas que começam com # são tratadas como comentários e ignoradas
            </div>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando aplicações...</span>
                <span>{progress.processed}/{progress.total}</span>
              </div>
              <Progress 
                value={progress.total > 0 ? (progress.processed / progress.total) * 100 : 0} 
                className="h-2" 
              />
              {progress.translated > 0 && (
                <div className="text-xs text-muted-foreground">
                  {progress.translated} tradução(ões) em background
                </div>
              )}
              {progress.errors.length > 0 && (
                <div className="text-xs text-red-500">
                  {progress.errors.length} erro(s) encontrado(s)
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-medium">Formato Simples</div>
              <div className="text-xs text-muted-foreground">Uma aplicação por linha</div>
            </div>
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">Criação Automática</div>
              <div className="text-xs text-muted-foreground">Aplicações novas são criadas</div>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 text-purple-500 font-bold text-lg">EN</div>
              <div className="text-sm font-medium">Tradução Automática</div>
              <div className="text-xs text-muted-foreground">Português → Inglês</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isImporting}
          >
            Limpar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!csvData.trim() || isImporting}
          >
            {isImporting ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};