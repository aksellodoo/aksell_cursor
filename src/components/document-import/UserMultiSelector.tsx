import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfiles, Profile } from '@/hooks/useProfiles';

interface UserMultiSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const UserMultiSelector: React.FC<UserMultiSelectorProps> = ({
  value,
  onChange,
  placeholder = "Selecionar usuários...",
  disabled = false,
  className
}) => {
  const { profiles, loading } = useProfiles();
  const [open, setOpen] = React.useState(false);

  const selectedUsers = profiles.filter(profile => value.includes(profile.id));

  const handleSelect = (profileId: string) => {
    if (value.includes(profileId)) {
      onChange(value.filter(id => id !== profileId));
    } else {
      onChange([...value, profileId]);
    }
  };

  const handleRemove = (profileId: string) => {
    onChange(value.filter(id => id !== profileId));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {value.length === 0 
                ? placeholder 
                : `${value.length} usuário${value.length > 1 ? 's' : ''} selecionado${value.length > 1 ? 's' : ''}`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar usuários..." />
            <CommandList>
              <CommandEmpty>
                {loading ? "Carregando..." : "Nenhum usuário encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {profiles.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={`${profile.name} ${profile.email} ${profile.department}`}
                    onSelect={() => handleSelect(profile.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(profile.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {profile.email} • {profile.department}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected users badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="text-xs">{user.name}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => handleRemove(user.id)}
                >
                  <X className="h-2 w-2" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};