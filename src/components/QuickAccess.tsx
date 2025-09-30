import React from 'react';
import { Clock, Star, TrendingUp, Folder, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickAccessItem {
  id: string;
  name: string;
  type: 'folder' | 'document';
  path?: string;
  lastAccessed?: string;
  isFavorite?: boolean;
  downloadCount?: number;
  size?: string;
}

interface QuickAccessProps {
  recentItems: QuickAccessItem[];
  favoriteItems: QuickAccessItem[];
  popularItems: QuickAccessItem[];
  onItemClick: (item: QuickAccessItem) => void;
  onToggleFavorite?: (itemId: string) => void;
  className?: string;
}

export const QuickAccess: React.FC<QuickAccessProps> = ({
  recentItems,
  favoriteItems,
  popularItems,
  onItemClick,
  onToggleFavorite,
  className
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const renderItemIcon = (item: QuickAccessItem) => {
    return item.type === 'folder' ? (
      <Folder className="h-4 w-4 text-primary" />
    ) : (
      <FileText className="h-4 w-4 text-muted-foreground" />
    );
  };

  const renderQuickAccessCard = (
    title: string,
    icon: React.ReactNode,
    items: QuickAccessItem[],
    emptyMessage: string
  ) => (
    <Card className="border-0 bg-card/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => onItemClick(item)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {renderItemIcon(item)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    {item.isFavorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  {item.path && (
                    <span className="text-xs text-muted-foreground truncate block">
                      {item.path}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {item.lastAccessed && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.lastAccessed)}
                      </span>
                    )}
                    {item.size && (
                      <Badge variant="outline" className="text-xs h-4 px-1">
                        {item.size}
                      </Badge>
                    )}
                    {item.downloadCount && item.downloadCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Download className="h-3 w-3" />
                        <span>{item.downloadCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                >
                  <Star 
                    className={cn(
                      "h-3 w-3",
                      item.isFavorite ? "text-yellow-500 fill-current" : "text-muted-foreground"
                    )} 
                  />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {/* Recent Items */}
      {renderQuickAccessCard(
        "Recentes",
        <Clock className="h-4 w-4" />,
        recentItems,
        "Nenhum item acessado recentemente"
      )}

      {/* Favorite Items */}
      {renderQuickAccessCard(
        "Favoritos",
        <Star className="h-4 w-4" />,
        favoriteItems,
        "Nenhum item marcado como favorito"
      )}

      {/* Popular Items */}
      {renderQuickAccessCard(
        "Mais Acessados",
        <TrendingUp className="h-4 w-4" />,
        popularItems,
        "Nenhum item popular no momento"
      )}
    </div>
  );
};