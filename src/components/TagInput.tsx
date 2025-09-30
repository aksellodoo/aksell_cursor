
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useEmailTags, EmailTag } from '@/hooks/useEmailTags';
import { toast } from 'sonner';

interface TagInputProps {
  selectedTags: EmailTag[];
  onTagsChange: (tags: EmailTag[]) => void;
  placeholder?: string;
}

export const TagInput = ({ selectedTags, onTagsChange, placeholder = "Digite uma tag e pressione Enter..." }: TagInputProps) => {
  const { tags, createTag } = useEmailTags();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<EmailTag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar sugestões baseadas no input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = tags.filter(tag =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.find(selected => selected.id === tag.id)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, tags, selectedTags]);

  const addTag = async (tagName: string) => {
    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    // Verificar se já está selecionada
    const alreadySelected = selectedTags.find(tag => 
      tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (alreadySelected) {
      toast.error('Tag já foi adicionada');
      return;
    }

    // Buscar tag existente
    let existingTag = tags.find(tag => 
      tag.name.toLowerCase() === trimmedName.toLowerCase()
    );

    // Criar nova tag se não existir
    if (!existingTag) {
      try {
        existingTag = await createTag(trimmedName);
        if (!existingTag) {
          toast.error('Erro ao criar tag');
          return;
        }
      } catch (error) {
        console.error('Erro ao criar tag:', error);
        toast.error('Erro ao criar tag');
        return;
      }
    }

    onTagsChange([...selectedTags, existingTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex].name);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const selectSuggestion = (tag: EmailTag) => {
    addTag(tag.name);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
      />

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
          {suggestions.map((tag, index) => (
            <div
              key={tag.id}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedSuggestionIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => selectSuggestion(tag)}
            >
              {tag.name}
            </div>
          ))}
        </div>
      )}

      {/* Tags selecionadas */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
