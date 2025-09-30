import { useCallback, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle, Download, Info, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface SiteProductsCSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

interface CsvRow {
  name?: string;
  name_en?: string;
  family?: string;
  segments?: string; // ";"-separated
  applications?: string; // ";"-separated
  groups?: string; // ";"-separated - new field
  compound_type?: string;
  compound_type_en?: string;
  molecular_formula?: string;
  molecular_weight?: string | number;
  molecular_structure_image_url?: string;
  product_format?: string; // solid/liquid - new field
  product_image_url?: string; // new field
  cas_number?: string;
  cas_note?: string;
  cas_note_en?: string;
  is_active?: string | boolean;
}

interface ImportResult {
  rowIndex: number;
  status: 'success' | 'error' | 'warning' | 'ignored' | 'duplicate';
  productName: string;
  compoundType?: string;
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

export default function SiteProductsCSVImportModal({ open, onOpenChange, onImported }: SiteProductsCSVImportModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const templateCsv = useMemo(() => {
    const example: CsvRow[] = [
      {
        name: "Peróxido de Hidrogênio",
        name_en: "Hydrogen Peroxide",
        family: "Oxidantes",
        segments: "Tratamento de Água;Papel e Celulose",
        applications: "Branqueamento;Desinfecção;Tratamento de Água",
        groups: "Químicos Industriais;Oxidantes",
        compound_type: "Anidro",
        compound_type_en: "Anhydrous",
        molecular_formula: "H2O2",
        molecular_weight: 34.0147,
        molecular_structure_image_url: "https://example.com/h2o2-structure.png",
        product_format: "liquid",
        product_image_url: "https://example.com/h2o2-product.jpg",
        cas_number: "7722-84-1",
        cas_note: "Solução 50%",
        cas_note_en: "50% solution",
        is_active: true,
      },
      {
        name: "Peróxido de Hidrogênio",
        name_en: "Hydrogen Peroxide",
        family: "Oxidantes",
        segments: "Tratamento de Água;Papel e Celulose",
        applications: "Branqueamento;Desinfecção;Tratamento de Água",
        groups: "Químicos Industriais;Oxidantes",
        compound_type: "Hidratado",
        compound_type_en: "Hydrated",
        molecular_formula: "H2O2·H2O",
        molecular_weight: 52.03,
        molecular_structure_image_url: "https://example.com/h2o2-hydrated-structure.png",
        product_format: "liquid",
        product_image_url: "https://example.com/h2o2-hydrated-product.jpg",
        cas_number: "7722-84-1",
        cas_note: "Solução hidratada",
        cas_note_en: "Hydrated solution",
        is_active: true,
      },
      {
        name: "Hipoclorito de Sódio",
        name_en: "Sodium Hypochlorite",
        family: "Desinfetantes",
        segments: "Tratamento de Água",
        applications: "Desinfecção;Limpeza;Branqueamento",
        groups: "Desinfetantes;Produtos Químicos",
        compound_type: "Anidro",
        compound_type_en: "Anhydrous",
        molecular_formula: "NaClO",
        molecular_weight: 74.44,
        molecular_structure_image_url: "",
        product_format: "solid",
        product_image_url: "",
        cas_number: "7681-52-9",
        cas_note: "12%",
        cas_note_en: "12%",
        is_active: true,
      },
    ];
    const csv = Papa.unparse(example, { header: true, delimiter: "," });
    return csv;
  }, []);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([templateCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_produtos_site.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [templateCsv]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setRows([]);
    setImportSummary(null);
    if (!f) return;
    setParsing(true);
    Papa.parse<CsvRow>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cleaned = (res.data || []).filter(r => Object.values(r).some(v => (v ?? "").toString().trim() !== ""));
        setRows(cleaned);
        setParsing(false);
      },
      error: (err) => {
        console.error(err);
        toast({ title: "Erro ao ler CSV", description: err.message, variant: "destructive" });
        setParsing(false);
      },
    });
  };

  const ensureFamily = async (name?: string): Promise<string | null> => {
    if (!name || !name.trim()) return null;
    const trimmed = name.trim();
    console.log(`🔍 CSV Import: Procurando família "${trimmed}"`);
    
    const { data, error } = await supabase
      .from("site_product_families")
      .select("id, name")
      .eq("name", trimmed)
      .maybeSingle();
    
    if (error && error.code !== "PGRST116") {
      console.error(`❌ CSV Import: Erro ao buscar família "${trimmed}":`, error);
      throw error;
    }
    
    if (data?.id) {
      console.log(`✅ CSV Import: Família "${trimmed}" encontrada com ID ${data.id}`);
      return data.id;
    }
    
    console.log(`➕ CSV Import: Criando nova família "${trimmed}"`);
    const { data: ins, error: e2 } = await supabase
      .from("site_product_families")
      .insert({ name: trimmed, name_en: trimmed, created_by: user!.id })
      .select("id")
      .maybeSingle();
    
    if (e2) {
      console.error(`❌ CSV Import: Erro ao criar família "${trimmed}":`, e2);
      throw e2;
    }
    
    console.log(`✅ CSV Import: Família "${trimmed}" criada com ID ${ins?.id}`);
    return ins?.id ?? null;
  };

  const ensureSegments = async (segmentsField?: string): Promise<string[]> => {
    if (!segmentsField) return [];
    const parts = segmentsField.split(/;|,/).map(s => s.trim()).filter(Boolean);
    const ids: string[] = [];
    console.log(`🔍 CSV Import: Processando segmentos:`, parts);
    
    for (const segName of parts) {
      const { data, error } = await supabase
        .from("site_product_segments")
        .select("id, name")
        .eq("name", segName)
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") {
        console.error(`❌ CSV Import: Erro ao buscar segmento "${segName}":`, error);
        throw error;
      }
      
      if (data?.id) {
        console.log(`✅ CSV Import: Segmento "${segName}" encontrado com ID ${data.id}`);
        ids.push(data.id);
      } else {
        console.log(`➕ CSV Import: Criando novo segmento "${segName}"`);
        const { data: ins, error: e2 } = await supabase
          .from("site_product_segments")
          .insert({ name: segName, name_en: segName, created_by: user!.id })
          .select("id")
          .maybeSingle();
        if (e2) {
          console.error(`❌ CSV Import: Erro ao criar segmento "${segName}":`, e2);
          throw e2;
        }
        if (ins?.id) {
          console.log(`✅ CSV Import: Segmento "${segName}" criado com ID ${ins.id}`);
          ids.push(ins.id);
        }
      }
    }
    return ids;
  };

  const ensureName = async (productName: string, productNameEn?: string): Promise<string> => {
    console.log(`🔍 CSV Import: Processando nome do produto: "${productName}"`);
    
    const { data, error } = await supabase
      .from("site_product_names")
      .select("id, name")
      .eq("name", productName)
      .maybeSingle();
      
    if (error && error.code !== "PGRST116") {
      console.error(`❌ CSV Import: Erro ao buscar nome "${productName}":`, error);
      throw error;
    }
    
    if (data?.id) {
      console.log(`✅ CSV Import: Nome "${productName}" encontrado com ID ${data.id}`);
      return data.id;
    } else {
      console.log(`➕ CSV Import: Criando novo nome "${productName}"`);
      const { data: ins, error: e2 } = await supabase
        .from("site_product_names")
        .insert({ 
          name: productName, 
          name_en: productNameEn || productName,
          created_by: user!.id 
        })
        .select("id")
        .single();
      if (e2) {
        console.error(`❌ CSV Import: Erro ao criar nome "${productName}":`, e2);
        throw e2;
      }
      console.log(`✅ CSV Import: Nome "${productName}" criado com ID ${ins.id}`);
      return ins.id;
    }
  };

  const ensureApplications = async (applicationsField?: string): Promise<string[]> => {
    if (!applicationsField) return [];
    const parts = applicationsField.split(/;|,/).map(s => s.trim()).filter(Boolean);
    const ids: string[] = [];
    console.log(`🔍 CSV Import: Processando aplicações:`, parts);
    
    for (const appName of parts) {
      const { data, error } = await supabase
        .from("site_product_applications")
        .select("id, name")
        .eq("name", appName)
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") {
        console.error(`❌ CSV Import: Erro ao buscar aplicação "${appName}":`, error);
        throw error;
      }
      
      if (data?.id) {
        console.log(`✅ CSV Import: Aplicação "${appName}" encontrada com ID ${data.id}`);
        ids.push(data.id);
      } else {
        console.log(`➕ CSV Import: Criando nova aplicação "${appName}"`);
        const { data: ins, error: e2 } = await supabase
          .from("site_product_applications")
          .insert({ 
            name: appName, 
            name_en: appName, 
            color: '#3b82f6', // Default blue color
            created_by: user!.id 
          })
          .select("id")
          .maybeSingle();
        if (e2) {
          console.error(`❌ CSV Import: Erro ao criar aplicação "${appName}":`, e2);
          throw e2;
        }
        if (ins?.id) {
          console.log(`✅ CSV Import: Aplicação "${appName}" criada com ID ${ins.id}`);
          ids.push(ins.id);
        }
      }
    }
    return ids;
  };

  const ensureGroups = async (groupsField?: string): Promise<string[]> => {
    if (!groupsField) return [];
    const parts = groupsField.split(/;|,/).map(s => s.trim()).filter(Boolean);
    const ids: string[] = [];
    console.log(`🔍 CSV Import: Processando grupos:`, parts);
    
    for (const groupName of parts) {
      const { data, error } = await supabase
        .from("site_product_groups")
        .select("id, name")
        .eq("name", groupName)
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") {
        console.error(`❌ CSV Import: Erro ao buscar grupo "${groupName}":`, error);
        throw error;
      }
      
      if (data?.id) {
        console.log(`✅ CSV Import: Grupo "${groupName}" encontrado com ID ${data.id}`);
        ids.push(data.id);
      } else {
        console.log(`➕ CSV Import: Criando novo grupo "${groupName}"`);
        const { data: ins, error: e2 } = await supabase
          .from("site_product_groups")
          .insert({ 
            name: groupName, 
            name_en: groupName, 
            created_by: user!.id 
          })
          .select("id")
          .maybeSingle();
        if (e2) {
          console.error(`❌ CSV Import: Erro ao criar grupo "${groupName}":`, e2);
          throw e2;
        }
        if (ins?.id) {
          console.log(`✅ CSV Import: Grupo "${groupName}" criado com ID ${ins.id}`);
          ids.push(ins.id);
        }
      }
    }
    return ids;
  };

  const importRows = useCallback(async () => {
    if (!user) {
      toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
      return;
    }
    if (!rows.length) {
      toast({ title: "Nenhum dado", description: "Selecione um CSV com dados.", variant: "destructive" });
      return;
    }
    
    setImporting(true);
    console.log(`📥 CSV Import: Iniciando ${dryRun ? 'validação' : 'importação'} de ${rows.length} linha(s)`);
    
    const results: ImportResult[] = [];
    const summary: ImportSummary = {
      total: rows.length,
      created: 0,
      updated: 0,
      ignored: 0,
      errors: 0,
      csvDuplicates: 0,
      results: []
    };

    // Check for CSV duplicates using composite key (name + compound_type)
    const compositeKeyMap = new Map<string, number[]>();
    rows.forEach((row, index) => {
      const name = (row.name || "").trim().toLowerCase();
      const compoundType = (row.compound_type || "").trim().toLowerCase();
      const compositeKey = `${name}|${compoundType}`;
      
      if (name) { // Only track rows with valid names
        if (!compositeKeyMap.has(compositeKey)) {
          compositeKeyMap.set(compositeKey, []);
        }
        compositeKeyMap.get(compositeKey)!.push(index);
      }
    });

    const duplicateRows = new Set<number>();
    compositeKeyMap.forEach((indices, compositeKey) => {
      if (indices.length > 1) {
        // Mark all except the first as duplicates
        for (let i = 1; i < indices.length; i++) {
          duplicateRows.add(indices[i]);
        }
        summary.csvDuplicates += indices.length - 1;
      }
    });
    
    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 1;
        
        try {
          const name = (row.name || "").trim();
          const compoundType = (row.compound_type || "").trim();
          
          // Check for CSV duplicate
          if (duplicateRows.has(i)) {
            results.push({
              rowIndex: i,
              status: 'duplicate',
              productName: name || `Linha ${rowNumber}`,
              compoundType: compoundType || undefined,
              message: 'Combinação nome+compound_type duplicada no CSV - apenas primeira ocorrência será processada'
            });
            summary.ignored++;
            continue;
          }
          
          if (!name) {
            results.push({
              rowIndex: i,
              status: 'ignored',
              productName: `Linha ${rowNumber}`,
              compoundType: compoundType || undefined,
              message: 'Nome do produto vazio'
            });
            summary.ignored++;
            continue;
          }
          
          console.log(`📝 CSV Import: Processando linha ${rowNumber}/${rows.length}: "${name}" (${compoundType || 'sem compound_type'})`);
          
          if (!dryRun) {
            const name_id = await ensureName(name, (row.name_en || "").trim() || name);
            const family_id = await ensureFamily(row.family);
            const segmentIds = await ensureSegments(row.segments);
            const applicationIds = await ensureApplications(row.applications);
            const groupIds = await ensureGroups(row.groups);
            
            const is_active = ((): boolean => {
              const v = row.is_active;
              if (typeof v === "boolean") return v;
              const s = (v || "").toString().trim().toLowerCase();
              if (s === "" || s === "undefined" || s === "null") return true;
              return s === "true" || s === "1" || s === "sim" || s === "ativo";
            })();
            
            const normalizeProductFormat = (format?: string): 'solid' | 'liquid' | null => {
              if (!format) return null;
              const f = format.toLowerCase().trim();
              if (f === 'solid' || f === 'solido' || f === 'sólido') return 'solid';
              if (f === 'liquid' || f === 'liquido' || f === 'líquido') return 'liquid';
              return null;
            };
            const product_format = normalizeProductFormat(row.product_format);

            // Check existing by composite key (name + compound_type)
            const { data: existing } = await supabase
              .from("site_products")
              .select("id")
              .eq("name", name)
              .eq("compound_type", compoundType || null)
              .maybeSingle();

            const payload: any = {
              name,
              name_en: (row.name_en || "").trim() || null,
              name_id,
              family_id: family_id,
              compound_type: compoundType || null,
              compound_type_en: (row.compound_type_en || "").trim() || null,
              molecular_formula: (row.molecular_formula || "").trim() || null,
              molecular_weight: row.molecular_weight === undefined || row.molecular_weight === null || (row.molecular_weight as any) === "" ? null : Number(row.molecular_weight),
              molecular_structure_image_url: (row.molecular_structure_image_url || "").trim() || null,
              product_format: product_format,
              product_image_url: (row.product_image_url || "").trim() || null,
              cas_number: (row.cas_number || "").trim() || null,
              cas_note: (row.cas_note || "").trim() || null,
              cas_note_en: (row.cas_note_en || "").trim() || null,
              is_active,
              created_by: user.id,
            };

            let productId: string | undefined;
            let action: 'created' | 'updated' | 'ignored' = 'ignored';

            if (existing?.id) {
              if (updateExisting) {
                console.log(`🔄 CSV Import: Atualizando produto existente "${name}" (${compoundType}) (ID: ${existing.id})`);
                const { error } = await supabase.from("site_products").update(payload).eq("id", existing.id);
                if (error) throw error;
                productId = existing.id;
                action = 'updated';
                summary.updated++;
              } else {
                results.push({
                  rowIndex: i,
                  status: 'ignored',
                  productName: name,
                  compoundType: compoundType || undefined,
                  message: 'Produto já existe - atualização desabilitada',
                  action: 'ignored'
                });
                summary.ignored++;
                continue;
              }
            } else {
              console.log(`➕ CSV Import: Criando novo produto "${name}" (${compoundType})`);
              const { data: inserted, error } = await supabase.from("site_products").insert(payload).select("id").maybeSingle();
              if (error) throw error;
              productId = inserted?.id;
              action = 'created';
              summary.created++;
            }

            if (productId) {
              console.log(`🔗 CSV Import: Atualizando mapeamentos para produto ID ${productId}`);
              
              await supabase.from("site_product_segments_map").delete().eq("product_id", productId);
              if (segmentIds.length) {
                const insertRows = segmentIds.map(segment_id => ({ product_id: productId!, segment_id }));
                const { error } = await supabase.from("site_product_segments_map").insert(insertRows);
                if (error) throw error;
              }

              await supabase.from("site_product_applications_map").delete().eq("product_id", productId);
              if (applicationIds.length) {
                const appInsertRows = applicationIds.map(application_id => ({ 
                  product_id: productId!, 
                  application_id, 
                  created_by: user.id 
                }));
                const { error } = await supabase.from("site_product_applications_map").insert(appInsertRows);
                if (error) throw error;
              }

              await supabase.from("site_product_groups_map").delete().eq("product_id", productId);
              if (groupIds.length) {
                const groupInsertRows = groupIds.map(group_id => ({ 
                  product_id: productId!, 
                  group_id, 
                  created_by: user.id 
                }));
                const { error } = await supabase.from("site_product_groups_map").insert(groupInsertRows);
                if (error) throw error;
              }
            }

            results.push({
              rowIndex: i,
              status: 'success',
              productName: name,
              compoundType: compoundType || undefined,
              message: action === 'created' ? 'Produto criado com sucesso' : 'Produto atualizado com sucesso',
              action
            });
          } else {
            // Dry run - check if exists using composite key
            const { data: existing } = await supabase
              .from("site_products")
              .select("id")
              .eq("name", name)
              .eq("compound_type", compoundType || null)
              .maybeSingle();

            if (existing?.id) {
              if (updateExisting) {
                results.push({
                  rowIndex: i,
                  status: 'warning',
                  productName: name,
                  compoundType: compoundType || undefined,
                  message: 'Produto existente - seria atualizado',
                  action: 'updated'
                });
                summary.updated++;
              } else {
                results.push({
                  rowIndex: i,
                  status: 'ignored',
                  productName: name,
                  compoundType: compoundType || undefined,
                  message: 'Produto já existe - seria ignorado',
                  action: 'ignored'
                });
                summary.ignored++;
              }
            } else {
              results.push({
                rowIndex: i,
                status: 'success',
                productName: name,
                compoundType: compoundType || undefined,
                message: 'Novo produto - seria criado',
                action: 'created'
              });
              summary.created++;
            }
          }
          
          console.log(`✅ CSV Import: Linha ${rowNumber} processada`);
          
        } catch (rowError: any) {
          console.error(`❌ CSV Import: Erro na linha ${rowNumber}:`, rowError);
          results.push({
            rowIndex: i,
            status: 'error',
            productName: (row.name || "").trim() || `Linha ${rowNumber}`,
            compoundType: (row.compound_type || "").trim() || undefined,
            message: rowError.message || 'Erro desconhecido'
          });
          summary.errors++;
        }
      }

      summary.results = results;
      setImportSummary(summary);

      const verb = dryRun ? 'Validação' : 'Importação';
      if (summary.errors > 0) {
        toast({ 
          title: `${verb} concluída com avisos`, 
          description: `${summary.created} criados, ${summary.updated} atualizados, ${summary.ignored} ignorados, ${summary.errors} erros, ${summary.csvDuplicates} duplicados no CSV.`,
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: `${verb} concluída`, 
          description: `${summary.created} criados, ${summary.updated} atualizados, ${summary.ignored} ignorados, ${summary.csvDuplicates} duplicados no CSV.`
        });
      }
      
      if (!dryRun) {
        onImported?.();
      }
      
    } catch (error: any) {
      console.error(`❌ CSV Import: Erro geral na ${dryRun ? 'validação' : 'importação'}:`, error);
      toast({ 
        title: `Erro na ${dryRun ? 'validação' : 'importação'}`, 
        description: error.message || "Erro inesperado.", 
        variant: "destructive" 
      });
    } finally {
      setImporting(false);
    }
  }, [rows, user, toast, onImported, updateExisting, dryRun]);

  const downloadReport = (format: 'csv' | 'json') => {
    if (!importSummary) return;
    
    if (format === 'csv') {
      const csvData = Papa.unparse(importSummary.results.map(r => ({
        Linha: r.rowIndex + 1,
        Produto: r.productName,
        'Tipo de Composto': r.compoundType || '',
        Status: r.status,
        Acao: r.action || '',
        Mensagem: r.message
      })));
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio_importacao.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonData = JSON.stringify(importSummary, null, 2);
      const blob = new Blob([jsonData], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio_importacao.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetImport = () => {
    setFile(null);
    setRows([]);
    setImportSummary(null);
    setDryRun(false);
  };

  const getStatusIcon = (status: ImportResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'ignored': return <Info className="w-4 h-4 text-gray-500" />;
      case 'duplicate': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: ImportResult['status']) => {
    switch (status) {
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      case 'warning': return 'Aviso';
      case 'ignored': return 'Ignorado';
      case 'duplicate': return 'Duplicado CSV';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Produtos do Site via CSV</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-4">
          {!importSummary ? (
            <>
              <div>
                <Label htmlFor="csv-file">Arquivo CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing || parsing}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  disabled={importing || parsing}
                >
                  Baixar Modelo CSV
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Chave Única: Nome + Tipo de Composto</div>
                  <div className="text-sm">
                    O sistema agora permite múltiplos produtos com o mesmo nome, desde que tenham tipos de composto diferentes. 
                    Por exemplo: "Peróxido de Hidrogênio Anidro" e "Peróxido de Hidrogênio Hidratado" são produtos distintos.
                  </div>
                </AlertDescription>
              </Alert>
              
              {file && (
                <div className="text-sm text-muted-foreground">
                  Arquivo: {file.name}
                  {parsing && " (analisando...)"}
                  {!parsing && rows.length > 0 && ` - ${rows.length} produtos encontrados`}
                </div>
              )}
              
              {rows.length > 0 && !importing && (
                <>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Dados a importar:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>{rows.length} linha(s) no CSV</div>
                      <div>Com compound_type: {rows.filter(r => r.compound_type?.trim()).length} produtos</div>
                      <div>Família definida: {rows.filter(r => r.family?.trim()).length} produtos</div>
                      <div>Segmentos definidos: {rows.filter(r => r.segments?.trim()).length} produtos</div>
                      <div>Aplicações definidas: {rows.filter(r => r.applications?.trim()).length} produtos</div>
                      <div>Grupos definidos: {rows.filter(r => r.groups?.trim()).length} produtos</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="update-existing" 
                        checked={updateExisting}
                        onCheckedChange={(checked) => setUpdateExisting(checked === true)}
                      />
                      <Label htmlFor="update-existing" className="text-sm">
                        Atualizar produtos existentes (mesmo nome + compound_type)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="dry-run" 
                        checked={dryRun}
                        onCheckedChange={(checked) => setDryRun(checked === true)}
                      />
                      <Label htmlFor="dry-run" className="text-sm">
                        Apenas validar (não importar)
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Relatório de Importação</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div>Total: {importSummary.total}</div>
                    <div>Criados: {importSummary.created}</div>
                    <div>Atualizados: {importSummary.updated}</div>
                    <div>Ignorados: {importSummary.ignored}</div>
                    <div>Erros: {importSummary.errors}</div>
                    <div>Duplicados CSV: {importSummary.csvDuplicates}</div>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport('csv')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReport('json')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="space-y-1 p-2">
                  {importSummary.results
                    .filter(r => r.status !== 'success' || importSummary.errors > 0)
                    .map((result, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 text-sm border-b">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">Linha {result.rowIndex + 1}:</span>
                      <span className="flex-1">
                        {result.productName}
                        {result.compoundType && (
                          <span className="text-muted-foreground"> ({result.compoundType})</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getStatusText(result.status)}
                      </span>
                      <span className="text-xs text-muted-foreground max-w-xs truncate">
                        {result.message}
                      </span>
                    </div>
                  ))}
                  {importSummary.results.filter(r => r.status !== 'success' || importSummary.errors > 0).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Todos os produtos foram processados com sucesso!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {importSummary ? (
            <>
              <Button 
                variant="outline" 
                onClick={resetImport}
              >
                Nova Importação
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={importing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={importRows}
                disabled={importing || parsing || rows.length === 0}
              >
                {importing ? (dryRun ? "Validando..." : "Importando...") : `${dryRun ? 'Validar' : 'Importar'} ${rows.length} produto(s)`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
