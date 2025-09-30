import * as React from "react";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface ProtheusCSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  columns: string[];
  onImported?: () => void;
}

export function ProtheusCSVImportModal({ open, onOpenChange, tableId, columns, onImported }: ProtheusCSVImportModalProps) {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [rows, setRows] = React.useState<any[]>([]);
  const [parsing, setParsing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const reset = () => {
    setFile(null);
    setRows([]);
    setParsing(false);
    setImporting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) parseCSV(f);
  };

  const parseCSV = (f: File) => {
    setParsing(true);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = (results.data as any[]).filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));
        setRows(data);
        setParsing(false);
        toast({ title: "Arquivo lido", description: `${data.length} registros identificados.` });
      },
      error: (err) => {
        console.error(err);
        setParsing(false);
        toast({ title: "Erro ao ler CSV", description: err.message, variant: "destructive" });
      }
    });
  };

  const downloadTemplate = () => {
    const headers = columns;
    const csvContent = [headers.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `modelo_${tableId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      toast({ title: "Nada para importar", description: "Selecione um arquivo CSV primeiro.", variant: "destructive" });
      return;
    }
    try {
      setImporting(true);
      const { data, error } = await supabase.functions.invoke('import-protheus-csv', {
        body: { tableId, rows }
      });
      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Falha ao importar');
      }

      // Finalizar flags usando o log desta importação
      const syncLogId = data.syncLogId as string | undefined;
      if (syncLogId) {
        const { data: finData, error: finErr } = await supabase.functions.invoke('finalize-protheus-sync-flags', {
          body: { tableId, syncLogId }
        });
        if (finErr || !finData?.success) {
          console.warn('Finalize flags após import retornou aviso:', finErr || finData?.error);
        }
      }

      toast({ title: 'Importação concluída', description: `${data?.stats?.created || 0} novos, ${data?.stats?.updated || 0} atualizados.` });
      onOpenChange(false);
      reset();
      onImported?.();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro na importação', description: e.message || 'Falha ao importar CSV', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>
            A primeira linha do arquivo deve conter os nomes dos campos. A partir da segunda linha, os registros. Esta importação contará como uma sincronização (CSV) e seguirá as métricas e funções normais da sincronização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input type="file" accept=".csv" onChange={handleFileChange} disabled={parsing || importing} />
              <Button variant="outline" onClick={downloadTemplate} disabled={importing}>Baixar modelo</Button>
            </div>
            <div className="text-sm text-muted-foreground">Campos do modelo:</div>
            <ScrollArea className="h-28 rounded border p-2">
              <div className="text-xs break-words">{columns.join(', ')}</div>
            </ScrollArea>
            {file && (
              <div className="text-sm text-foreground">Arquivo: {file.name} {parsing ? '(lendo...)' : rows.length ? `- ${rows.length} linhas` : null}</div>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }} disabled={importing}>Cancelar</Button>
          <Button onClick={handleImport} disabled={parsing || importing || rows.length === 0}>
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
