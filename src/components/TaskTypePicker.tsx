import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TASK_TYPES, type FixedTaskType } from '@/lib/taskTypesFixed';
import { FileText, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTypePickerProps {
  onSelectType: (type: FixedTaskType) => void;
  onSelectTemplates: () => void;
  recentTypes?: FixedTaskType[];
}

export const TaskTypePicker: React.FC<TaskTypePickerProps> = ({
  onSelectType,
  onSelectTemplates,
  recentTypes = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSearch, setShowSearch] = useState(false);

  // Organizar tipos por recentes + outros
  const { recentTaskTypes, otherTaskTypes } = useMemo(() => {
    const all = Object.entries(TASK_TYPES);
    const recent = recentTypes.slice(0, 3).map(type => 
      all.find(([key]) => key === type)
    ).filter(Boolean) as [string, typeof TASK_TYPES[FixedTaskType]][];
    
    const recentKeys = recent.map(([key]) => key);
    const other = all.filter(([key]) => !recentKeys.includes(key));
    
    return { recentTaskTypes: recent, otherTaskTypes: other };
  }, [recentTypes]);

  // Filtrar tipos baseado na busca
  const filteredTypes = useMemo(() => {
    if (!searchTerm) {
      return [...recentTaskTypes, ...otherTaskTypes];
    }
    
    const filtered = Object.entries(TASK_TYPES).filter(([key, type]) =>
      type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
  }, [searchTerm, recentTaskTypes, otherTaskTypes]);

  // Total de cards (tipos + templates)
  const totalCards = filteredTypes.length + 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearch) {
        if (e.key === 'Escape') {
          setShowSearch(false);
          setSearchTerm('');
          setSelectedIndex(-1);
        }
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          setShowSearch(true);
          break;
        case 'Escape':
          setSelectedIndex(-1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(-1, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(totalCards - 1, prev + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev - 3; // 3 colunas
            return newIndex < 0 ? prev : newIndex;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = prev + 3; // 3 colunas
            return newIndex >= totalCards ? prev : newIndex;
          });
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < filteredTypes.length) {
            const [typeKey] = filteredTypes[selectedIndex];
            onSelectType(typeKey as FixedTaskType);
          } else if (selectedIndex === filteredTypes.length) {
            onSelectTemplates();
          }
          break;
        default:
          // Números 1-9 para seleção rápida
          const num = parseInt(e.key);
          if (num >= 1 && num <= 9 && num <= totalCards) {
            const index = num - 1;
            if (index < filteredTypes.length) {
              const [typeKey] = filteredTypes[index];
              onSelectType(typeKey as FixedTaskType);
            } else if (index === filteredTypes.length) {
              onSelectTemplates();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, totalCards, filteredTypes, onSelectType, onSelectTemplates, showSearch]);

  return (
    <div className="space-y-6">
      {/* Busca */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipo de tarefa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
            onBlur={() => {
              if (!searchTerm) setShowSearch(false);
            }}
          />
        </div>
      )}

      {/* Instruções */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Selecione o tipo de tarefa</h2>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">1-9: Seleção rápida</Badge>
          <Badge variant="outline">/: Buscar</Badge>
          <Badge variant="outline">Esc: Limpar seleção</Badge>
        </div>
      </div>

      {/* Recentes (se existirem) */}
      {recentTaskTypes.length > 0 && !searchTerm && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Utilizados recentemente</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recentTaskTypes.map(([typeKey, typeConfig], index) => (
              <TaskTypeCard
                key={`recent-${typeKey}`}
                typeKey={typeKey as FixedTaskType}
                typeConfig={typeConfig}
                index={index}
                isSelected={selectedIndex === index}
                onClick={() => onSelectType(typeKey as FixedTaskType)}
                isRecent
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="space-y-3">
        {!searchTerm && recentTaskTypes.length > 0 && (
          <h3 className="text-sm font-medium text-muted-foreground">Todos os tipos</h3>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Tipos de tarefa */}
          {(searchTerm ? filteredTypes : otherTaskTypes).map(([typeKey, typeConfig], index) => {
            const actualIndex = searchTerm ? index : index + recentTaskTypes.length;
            return (
              <TaskTypeCard
                key={typeKey}
                typeKey={typeKey as FixedTaskType}
                typeConfig={typeConfig}
                index={actualIndex + 1} // +1 para mostrar números corretos
                isSelected={selectedIndex === actualIndex}
                onClick={() => onSelectType(typeKey as FixedTaskType)}
              />
            );
          })}

          {/* Card Templates */}
          <Card 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:border-primary",
              selectedIndex === filteredTypes.length && "ring-2 ring-primary border-primary shadow-md"
            )}
            role="button"
            tabIndex={0}
            onClick={onSelectTemplates}
          >
            <CardContent className="p-4 text-center space-y-3 h-full flex flex-col justify-center">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mx-auto">
                  <FileText className="h-5 w-5 text-accent-foreground" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {filteredTypes.length + 1}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm">Templates</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Usar template pré-configurado
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface TaskTypeCardProps {
  typeKey: FixedTaskType;
  typeConfig: typeof TASK_TYPES[FixedTaskType];
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isRecent?: boolean;
}

const TaskTypeCard: React.FC<TaskTypeCardProps> = ({
  typeKey,
  typeConfig,
  index,
  isSelected,
  onClick,
  isRecent = false
}) => {
  const IconComponent = typeConfig.icon;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary",
        isSelected && "ring-2 ring-primary border-primary shadow-md"
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center space-y-3 h-full flex flex-col justify-center">
        <div className="flex justify-between items-start">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto"
            style={{ backgroundColor: typeConfig.color + '20' }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: typeConfig.color }}
            />
          </div>
          <div className="flex flex-col gap-1">
            {isRecent && (
              <Badge variant="outline" className="text-xs">Recente</Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {index}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-medium text-sm">{typeConfig.label}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {typeConfig.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};