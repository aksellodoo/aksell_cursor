import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onMentionsChange,
  placeholder,
  rows = 3,
  className
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Buscar usuários do banco
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('status', 'active')
        .order('name');

      if (!error && data) {
        setUsers(data);
      }
    };

    fetchUsers();
  }, []);

  // Filtrar sugestões baseado na busca
  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, users]);

  // Extrair menções do texto
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]); // ID do usuário
    }
    
    console.log('Extracted mentions:', mentions, 'from text:', text);
    return mentions;
  };

  // Detectar @ no texto
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    console.log('Text changed:', newValue);
    
    onChange(newValue);
    
    // Extrair e enviar menções
    if (onMentionsChange) {
      const mentions = extractMentions(newValue);
      console.log('Calling onMentionsChange with:', mentions);
      onMentionsChange(mentions);
    }

    // Verificar se está digitando uma menção
    const textUpToCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textUpToCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textUpToCursor.slice(lastAtIndex + 1);
      
      // Verificar se não há espaços após o @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStart(lastAtIndex);
        setSearchQuery(textAfterAt);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Inserir menção selecionada
  const insertMention = (user: User) => {
    if (mentionStart === -1) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterMention = value.slice(textareaRef.current?.selectionStart || 0);
    const mentionText = `@[${user.name}](${user.id})`;
    
    const newValue = beforeMention + mentionText + afterMention;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionStart(-1);
    setSearchQuery('');
    
    // Focar no textarea após inserir menção
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + mentionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={cn("resize-none", className)}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto shadow-lg"
        >
          <div className="p-1">
            {suggestions.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                  index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => insertMention(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};