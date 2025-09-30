import React from 'react';
import { 
  Phone, 
  Users, 
  Mail, 
  FileText, 
  File, 
  Calendar, 
  Settings, 
  CheckSquare,
  Clock,
  AlertCircle,
  Star,
  Flag,
  Target,
  Briefcase,
  Folder,
  Camera,
  Headphones,
  MessageSquare,
  Bell,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AVAILABLE_ICONS = [
  { name: 'Phone', icon: Phone, label: 'Telefone' },
  { name: 'Users', icon: Users, label: 'Reunião' },
  { name: 'Mail', icon: Mail, label: 'E-mail' },
  { name: 'FileText', icon: FileText, label: 'Formulário' },
  { name: 'File', icon: File, label: 'Documento' },
  { name: 'Calendar', icon: Calendar, label: 'Agenda' },
  { name: 'CheckSquare', icon: CheckSquare, label: 'Checklist' },
  { name: 'Clock', icon: Clock, label: 'Tempo' },
  { name: 'AlertCircle', icon: AlertCircle, label: 'Alerta' },
  { name: 'Star', icon: Star, label: 'Importante' },
  { name: 'Flag', icon: Flag, label: 'Marco' },
  { name: 'Target', icon: Target, label: 'Meta' },
  { name: 'Briefcase', icon: Briefcase, label: 'Negócio' },
  { name: 'Folder', icon: Folder, label: 'Pasta' },
  { name: 'Camera', icon: Camera, label: 'Foto' },
  { name: 'Headphones', icon: Headphones, label: 'Atendimento' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Mensagem' },
  { name: 'Bell', icon: Bell, label: 'Notificação' },
  { name: 'Shield', icon: Shield, label: 'Segurança' },
  { name: 'Settings', icon: Settings, label: 'Configuração' },
];

interface IconSelectorProps {
  selectedIcon: string;
  selectedColor: string;
  onIconSelect: (iconName: string) => void;
  onColorSelect: (color: string) => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export const IconSelector: React.FC<IconSelectorProps> = ({
  selectedIcon,
  selectedColor,
  onIconSelect,
  onColorSelect,
}) => {
  const SelectedIconComponent = AVAILABLE_ICONS.find(icon => icon.name === selectedIcon)?.icon || CheckSquare;

  return (
    <div className="space-y-6">
      {/* Preview do ícone selecionado */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background shadow-sm">
          <SelectedIconComponent 
            className="w-6 h-6" 
            style={{ color: selectedColor }}
          />
        </div>
        <div>
          <p className="font-medium">Ícone selecionado</p>
          <p className="text-sm text-muted-foreground">
            {AVAILABLE_ICONS.find(icon => icon.name === selectedIcon)?.label || 'Ícone personalizado'}
          </p>
        </div>
      </div>

      {/* Seletor de ícones */}
      <div>
        <label className="text-sm font-medium mb-3 block">Escolha o ícone</label>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
          {AVAILABLE_ICONS.map(({ name, icon: IconComponent, label }) => (
            <button
              key={name}
              type="button"
              onClick={() => onIconSelect(name)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 group hover:bg-muted",
                selectedIcon === name
                  ? "bg-primary/10 border-2 border-primary text-primary"
                  : "border border-border bg-background hover:border-primary/50"
              )}
              title={label}
            >
              <IconComponent 
                className={cn(
                  "w-5 h-5 transition-colors",
                  selectedIcon === name ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} 
              />
              <span className="text-xs mt-1 text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Seletor de cores */}
      <div>
        <label className="text-sm font-medium mb-3 block">Escolha a cor</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onColorSelect(color)}
              className={cn(
                "w-8 h-8 rounded-lg transition-all duration-200 border-2",
                selectedColor === color
                  ? "border-foreground scale-110 shadow-lg"
                  : "border-border hover:border-foreground/50 hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};