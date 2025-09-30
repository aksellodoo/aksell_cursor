import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityMetrics {
  overallScore: number; // 0-100
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  totalPages: number;
  pagesRequiringOcr: number;
  pagesNativeText: number;
  averageConfidence: number;
  processingTime: number;
  estimatedCost: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ProcessingDecision {
  decision: 'text_extraction' | 'ocr_required' | 'hybrid_approach';
  reasoning: string[];
  confidence: number;
  estimatedTime: number;
  estimatedCost: number;
}

interface QualityDashboardProps {
  metrics?: QualityMetrics;
  decision?: ProcessingDecision;
  isAnalyzing?: boolean;
  fileName?: string;
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({
  metrics,
  decision,
  isAnalyzing = false,
  fileName
}) => {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getQualityIcon = (level: string) => {
    switch (level) {
      case 'excellent':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'good':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'fair':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'poor':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'text_extraction':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'ocr_required':
        return <Eye className="h-5 w-5 text-warning" />;
      case 'hybrid_approach':
        return <Zap className="h-5 w-5 text-info" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDecisionBadgeVariant = (decision: string) => {
    switch (decision) {
      case 'text_extraction':
        return 'default';
      case 'ocr_required':
        return 'secondary';
      case 'hybrid_approach':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Analisando Qualidade do PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Analisando: {fileName}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Em progresso...</span>
              </div>
            </div>
            <Progress value={0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {metrics && getQualityIcon(metrics.qualityLevel)}
            Score de Qualidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: getQualityColor(metrics.overallScore) }}>
                  {metrics.overallScore}%
                </div>
                <Badge 
                  variant={
                    metrics.qualityLevel === 'excellent' ? 'default' :
                    metrics.qualityLevel === 'good' ? 'secondary' :
                    metrics.qualityLevel === 'fair' ? 'outline' : 'destructive'
                  }
                  className="mb-4"
                >
                  {metrics.qualityLevel === 'excellent' ? 'Excelente' :
                   metrics.qualityLevel === 'good' ? 'Boa' :
                   metrics.qualityLevel === 'fair' ? 'Regular' : 'Baixa'}
                </Badge>
              </div>

              <Progress 
                value={metrics.overallScore} 
                className="h-3"
                style={{ 
                  '--progress-background': getQualityColor(metrics.overallScore)
                } as any}
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total de Páginas</span>
                  <div className="font-semibold">{metrics.totalPages}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Confiança Média</span>
                  <div className="font-semibold">{(metrics.averageConfidence * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Texto Nativo</span>
                  <div className="font-semibold text-success">{metrics.pagesNativeText} páginas</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Requer OCR</span>
                  <div className="font-semibold text-warning">{metrics.pagesRequiringOcr} páginas</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aguardando análise de qualidade...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Decision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {decision && getDecisionIcon(decision.decision)}
            Decisão de Processamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {decision ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getDecisionBadgeVariant(decision.decision)}>
                  {decision.decision === 'text_extraction' ? 'Extração de Texto' :
                   decision.decision === 'ocr_required' ? 'OCR Necessário' :
                   'Abordagem Híbrida'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Confiança: {(decision.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Justificativa:</h4>
                <ul className="space-y-1">
                  {decision.reasoning.map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                <div>
                  <span className="text-muted-foreground">Tempo Estimado</span>
                  <div className="font-semibold">{decision.estimatedTime}s</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Custo Estimado</span>
                  <div className="font-semibold">${decision.estimatedCost.toFixed(3)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aguardando decisão de processamento...</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};