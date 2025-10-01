import React from 'react';
import { Folder, FolderOpen, Lock, Archive, EyeOff, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getDepartmentIcon, getIconComponent } from '@/utils/departmentIcons';

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    type: 'department' | 'folder';
    status?: 'active' | 'archived' | 'hidden';
    department?: string;
    documentCount?: number;
    lastModified?: string;
    hasSubfolders?: boolean;
    color?: string;
    icon?: string;
  };
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onClick,
  className,
  variant = 'default'
}) => {
  const getDepartmentIconComponent = () => {
    if (folder.type === 'department') {
      // Use icon from department if available, otherwise fallback to name-based icon
      if (folder.icon) {
        const IconComponent = getIconComponent(folder.icon);
        return <IconComponent className="h-8 w-8" style={{ color: folder.color || 'currentColor' }} />;
      } else if (folder.department) {
        const IconComponent = getDepartmentIcon(folder.department);
        return <IconComponent className="h-8 w-8" style={{ color: folder.color || 'currentColor' }} />;
      }
    }
    return null;
  };

  const getFolderIcon = () => {
    if (folder.type === 'department') {
      return getDepartmentIconComponent();
    }

    // For folders, also use department icon if available
    if (folder.icon) {
      const IconComponent = getIconComponent(folder.icon);
      return <IconComponent className="h-8 w-8" style={{ color: folder.color || 'currentColor' }} />;
    }

    switch (folder.status) {
      case 'archived':
        return <Archive className="h-8 w-8 text-muted-foreground" />;
      case 'hidden':
        return <EyeOff className="h-8 w-8 text-muted-foreground" />;
      default:
        return folder.hasSubfolders ?
          <FolderOpen className="h-8 w-8" style={{ color: folder.color || 'currentColor' }} /> :
          <Folder className="h-8 w-8" style={{ color: folder.color || 'currentColor' }} />;
    }
  };

  const getStatusBadge = () => {
    if (folder.type === 'department') return null;
    
    switch (folder.status) {
      case 'archived':
        return <Badge variant="secondary" className="text-xs">Arquivado</Badge>;
      case 'hidden':
        return <Badge variant="outline" className="text-xs">Oculto</Badge>;
      default:
        return <Badge variant="default" className="text-xs">Ativo</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          "hover-lift cursor-pointer transition-all duration-200 border-0 bg-card/90 backdrop-blur-sm relative overflow-hidden",
          "hover:shadow-md hover:scale-[1.02]",
          className
        )}
        onClick={onClick}
        style={{
          borderLeft: folder.color ? `4px solid ${folder.color}` : undefined,
        }}
      >
        {folder.color && (
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${folder.color}10 0%, transparent 100%)`
            }}
          />
        )}
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getFolderIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground truncate">{folder.name}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {folder.documentCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{folder.documentCount} arquivo{folder.documentCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {folder.lastModified && (
                  <span>{formatDate(folder.lastModified)}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "hover-lift cursor-pointer transition-all duration-200 border-0 bg-card/90 backdrop-blur-sm relative overflow-hidden",
        "hover:shadow-md hover:scale-[1.02] group",
        className
      )}
      onClick={onClick}
      style={{
        borderLeft: folder.color ? `4px solid ${folder.color}` : undefined,
      }}
    >
      {folder.color && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${folder.color}10 0%, transparent 100%)`
          }}
        />
      )}
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col gap-4">
          {/* Header with icon and status */}
          <div className="flex items-start justify-between">
            <div
              className="flex-shrink-0 p-3 rounded-lg transition-colors"
              style={{
                backgroundColor: folder.color ? `${folder.color}15` : 'rgba(var(--primary), 0.1)',
              }}
            >
              {getFolderIcon()}
            </div>
            {getStatusBadge()}
          </div>

          {/* Folder name */}
          <div>
            <h3
              className="font-semibold text-lg text-foreground transition-colors truncate"
              style={{
                color: folder.color || undefined
              }}
            >
              {folder.name}
            </h3>
            {folder.type === 'department' && (
              <p className="text-sm text-muted-foreground mt-1">Departamento</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {folder.documentCount !== undefined ?
                  `${folder.documentCount} arquivo${folder.documentCount !== 1 ? 's' : ''}` :
                  'Carregando...'
                }
              </span>
            </div>
            {folder.lastModified && (
              <span className="text-muted-foreground">
                {formatDate(folder.lastModified)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};