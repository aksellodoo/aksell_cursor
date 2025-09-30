import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, ArrowLeft, Wand2, AlertTriangle, CheckCircle2, RefreshCw, Scan } from 'lucide-react';
import { useImportWizard } from './ImportWizard';
import { usePdfTextExtraction } from "@/hooks/usePdfTextExtraction";
import { usePdfQualityAnalysis } from "@/hooks/usePdfQualityAnalysis";
import { toast } from 'sonner';

interface ProcessingOptions {
  mode: 'auto' | 'ocr_all' | 'text_only';
  languageHints: string[];
  customLanguage?: string;
  autoDetectLanguage: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: 'Japonês' },
  { value: 'zh', label: 'Chinês' },
  { value: 'custom', label: 'Outro idioma...' }
];

export const ProcessingOptionsStep: React.FC = () => {
  const { setCurrentStep, setStepCompleted, navigateToStep, updateWizardData, wizardData } = useImportWizard();
  const { analyzePdfQuality, isAnalyzing } = usePdfQualityAnalysis();
  const { extractTextFromPdf } = usePdfTextExtraction();
  const [analysisResults, setAnalysisResults] = useState<Map<string, any>>(new Map());
  const [isAnalyzingFiles, setIsAnalyzingFiles] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [options, setOptions] = useState<ProcessingOptions>(
    wizardData.processingOptions || {
      mode: 'auto',
      languageHints: ['pt'],
      autoDetectLanguage: true
    }
  );
  const [showCustomLanguage, setShowCustomLanguage] = useState(false);

  const handleLanguageToggle = (language: string) => {
    if (options.autoDetectLanguage) return; // Disable when auto-detect is on
    
    if (language === 'custom') {
      setShowCustomLanguage(true);
      return;
    }
    
    setOptions(prev => ({
      ...prev,
      languageHints: prev.languageHints.includes(language)
        ? prev.languageHints.filter(l => l !== language)
        : [...prev.languageHints, language]
    }));
  };

  const handleAutoDetectToggle = () => {
    setOptions(prev => ({
      ...prev,
      autoDetectLanguage: !prev.autoDetectLanguage,
      languageHints: !prev.autoDetectLanguage ? [] : ['pt'] // Clear or reset languages
    }));
    setShowCustomLanguage(false);
  };

  const handleCommonLanguagesPreset = () => {
    if (options.autoDetectLanguage) return;
    
    setOptions(prev => ({
      ...prev,
      languageHints: ['pt', 'en']
    }));
  };

  // Memoizar arquivos PDF para evitar re-renders desnecessários
  const pdfFileNames = useMemo(() => {
    if (!wizardData.files) return [];
    return wizardData.files
      .filter(file => file.type === 'application/pdf')
      .map(file => file.name)
      .sort();
  }, [wizardData.files]);

  // Função para analisar PDFs e determinar se precisam de OCR
  const analyzePdfsForOcr = useCallback(async (files: File[], mode: string) => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setIsAnalyzingFiles(false);
      return;
    }

    setIsAnalyzingFiles(true);
    const results = new Map();
    let autoOcrFiles: string[] = [];

    try {
      if (mode === 'ocr_all') {
        // Modo OCR All: todos os PDFs usam OCR
        autoOcrFiles = pdfFiles.map(file => file.name);
        console.log(`🎯 Modo OCR All: todos os PDFs usarão OCR`);
        
        // Simular delay mínimo para feedback visual
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (mode === 'text_only') {
        // Modo Text Only: nenhum PDF usa OCR
        autoOcrFiles = [];
        console.log(`🎯 Modo Text Only: nenhum PDF usará OCR`);
        
        // Simular delay mínimo para feedback visual
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (mode === 'auto') {
        // Modo Auto: analisar cada PDF de forma assíncrona
        for (let i = 0; i < pdfFiles.length; i++) {
          const file = pdfFiles[i];
          
          try {
            console.log(`🔍 Analisando PDF ${i + 1}/${pdfFiles.length}: ${file.name}`);
            
            // Yield para não bloquear a UI
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Primeira tentativa: análise de qualidade
            const qualityAnalysis = await analyzePdfQuality(file);
            console.log(`📊 Análise de qualidade para ${file.name}:`, qualityAnalysis);
            
            if (qualityAnalysis.processingStrategy === 'ocr') {
              autoOcrFiles.push(file.name);
              console.log(`✅ ${file.name} marcado para OCR automático (qualidade baixa)`);
            } else {
              // Segunda tentativa: extração de texto para validar
              const textExtraction = await extractTextFromPdf(file);
              console.log(`📝 Extração de texto para ${file.name}:`, {
                chars: textExtraction.text.length,
                pages: textExtraction.pageCount,
                charsPerPage: textExtraction.text.length / textExtraction.pageCount
              });
              
              // Se texto muito pequeno, usar OCR
              const avgCharsPerPage = textExtraction.text.length / textExtraction.pageCount;
              if (avgCharsPerPage < 100 || textExtraction.text.length < 200) {
                autoOcrFiles.push(file.name);
                console.log(`✅ ${file.name} marcado para OCR automático (texto insuficiente: ${avgCharsPerPage} chars/página)`);
              }
            }
            
            results.set(file.name, {
              qualityAnalysis,
              needsOcr: autoOcrFiles.includes(file.name)
            });
            
            // Yield após cada arquivo para manter responsividade
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`❌ Erro ao analisar ${file.name}:`, error);
            // Em caso de erro, marcar para OCR por segurança
            autoOcrFiles.push(file.name);
            results.set(file.name, {
              error: error,
              needsOcr: true
            });
          }
        }
      }
      
      setAnalysisResults(results);
      
      // Atualizar wizard data com arquivos que precisam de OCR automático
      updateWizardData({
        autoModeOcrFiles: autoOcrFiles
      });
      
      console.log(`🎯 Análise completa. Arquivos para OCR automático:`, autoOcrFiles);
      
    } catch (error) {
      console.error('❌ Erro geral na análise de PDFs:', error);
      toast.error('Erro ao analisar PDFs para OCR automático');
    } finally {
      setIsAnalyzingFiles(false);
    }
  }, [analyzePdfQuality, extractTextFromPdf, updateWizardData]);

  // Executar análise com debounce quando modo mudar ou arquivos mudarem
  useEffect(() => {
    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se não há arquivos PDF, não executar análise
    if (!wizardData.files || pdfFileNames.length === 0) {
      setIsAnalyzingFiles(false);
      setAnalysisResults(new Map());
      return;
    }

    // Debounce para evitar múltiplas execuções
    debounceTimerRef.current = setTimeout(() => {
      analyzePdfsForOcr(wizardData.files!, options.mode);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [options.mode, pdfFileNames.length, pdfFileNames.join(','), analyzePdfsForOcr, wizardData.files]);


  const handleNext = () => {
    // Save processing options to wizard data
    updateWizardData({ processingOptions: options });
    setStepCompleted(3, true);
    setCurrentStep(4); // Go to versioning step
  };

  const handlePrevious = () => {
    navigateToStep(2);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações de Processamento
        </h2>
        <p className="text-muted-foreground">
          Configure como os documentos e imagens serão processados para extração de texto e conteúdo
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Processing Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Modo de Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={options.mode}
              onValueChange={(value: 'auto' | 'ocr_all' | 'text_only') => 
                setOptions(prev => ({ ...prev, mode: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="auto" 
                  id="auto"
                />
                <Label htmlFor="auto" className="flex-1">
                  <div>
                    <div className="font-medium">
                      Automático (Recomendado)
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Detecta automaticamente o melhor método para PDFs, imagens e idiomas usando GPT-5
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="ocr_all" 
                  id="ocr_all"
                />
                <Label htmlFor="ocr_all" className="flex-1">
                  <div>
                    <div className="font-medium">
                      OCR Completo
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Força OCR com GPT-5 Vision em todos os arquivos, incluindo imagens e PDFs
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text_only" id="text_only" />
                <Label htmlFor="text_only" className="flex-1">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      Apenas Texto
                      <Badge variant="secondary" className="text-xs">PDFs apenas</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Extrai apenas texto já presente em PDFs (não disponível para imagens)
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Language Hints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurações de OCR</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure idiomas e opções avançadas para melhor precisão na extração de texto
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-detect option */}
            <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <Label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.autoDetectLanguage}
                  onChange={handleAutoDetectToggle}
                  className="rounded h-4 w-4"
                />
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Detectar idiomas automaticamente</span>
                </div>
              </Label>
              <p className="text-sm text-blue-700 mt-2 ml-7">
                ✨ Recomendado: O sistema identifica automaticamente os idiomas presentes no documento
              </p>
            </div>

            {/* Manual language selection */}
            <div className={`space-y-3 ${options.autoDetectLanguage ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Você pode selecionar múltiplos idiomas para melhor precisão
                  </p>
                  {!options.autoDetectLanguage && options.languageHints.length > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {options.languageHints.length} idioma{options.languageHints.length > 1 ? 's' : ''} selecionado{options.languageHints.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {!options.autoDetectLanguage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCommonLanguagesPreset}
                    className="text-xs"
                  >
                    Idiomas Comuns (PT+EN)
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Label
                    key={lang.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={lang.value === 'custom' ? showCustomLanguage : options.languageHints.includes(lang.value)}
                      onChange={() => handleLanguageToggle(lang.value)}
                      className="rounded"
                      disabled={options.autoDetectLanguage}
                    />
                    <span>{lang.label}</span>
                  </Label>
                ))}
              </div>
              
              {showCustomLanguage && !options.autoDetectLanguage && (
                <Input
                  placeholder="Digite o código do idioma (ex: de, it, ja)"
                  value={options.customLanguage || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, customLanguage: e.target.value }))}
                />
              )}

              {!options.autoDetectLanguage && options.languageHints.length === 0 && !showCustomLanguage && (
                <div className="p-3 border border-amber-200 rounded-lg bg-amber-50">
                  <p className="text-sm text-amber-800">
                    ⚠️ Nenhum idioma selecionado. Recomendamos selecionar pelo menos Português.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Análise de PDFs */}
        {(isAnalyzingFiles || analysisResults.size > 0) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-4 h-4" />
                Análise de PDFs
              </CardTitle>
              <CardDescription>
                Determinando método de processamento para arquivos PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzingFiles ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">
                    Analisando PDFs para determinar método de processamento...
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Resultados da Análise:
                  </h4>
                  {Array.from(analysisResults.entries()).map(([filename, result]) => (
                    <div key={filename} className="text-sm flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="font-medium">{filename}</span>
                      {result.needsOcr ? (
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs">
                          OCR será aplicado
                        </span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                          Extração de texto
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button onClick={handleNext} disabled={isAnalyzingFiles} size="lg" className="min-w-32">
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};