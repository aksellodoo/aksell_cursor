import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface FormVersionFooterProps {
  version: number;
  createdAt: string;
  hasResponses?: boolean;
  responseCount?: number;
}

export const FormVersionFooter = ({ 
  version, 
  createdAt, 
  hasResponses = false, 
  responseCount = 0 
}: FormVersionFooterProps) => {
  return (
    <Card className="mt-6 border-t-0 rounded-t-none bg-muted/30">
      <CardContent className="py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Versão:</span>
              <Badge variant="secondary" className="text-xs">
                v{version}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>Criado em:</span>
              <span>{new Date(createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          
          {hasResponses && (
            <div className="flex items-center gap-2">
              <span>Respostas:</span>
              <Badge variant="outline" className="text-xs">
                {responseCount}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};