import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showToolbar?: boolean;
  onReady?: (quill: any) => void;
  minHeight?: number;
}

// Componente simplificado de rich text que será carregado dinamicamente
export const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Digite seu texto aqui...', 
  disabled = false,
  showToolbar = false,
  onReady,
  minHeight = 280,
}: RichTextEditorProps) => {
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // Carregamento dinâmico do ReactQuill para evitar problemas de SSR
    const loadQuill = async () => {
      try {
        const { default: Quill } = await import('react-quill');
        await import('react-quill/dist/quill.snow.css');
        setReactQuill(() => Quill);
      } catch (error) {
        console.error('Erro ao carregar editor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuill();
  }, []);

  useEffect(() => {
    if (onReady && editorRef.current && typeof editorRef.current.getEditor === 'function') {
      try {
        const ed = editorRef.current.getEditor();
        if (ed) onReady(ed);
      } catch { /* noop */ }
    }
  }, [onReady, editorRef.current]);

  const modules = {
    toolbar: showToolbar ? [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ] : false as any,
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'align', 'link', 'image'
  ];

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!ReactQuill) {
    // Fallback para textarea simples se o Quill não carregar
    return (
      <Card className="p-4">
        <div className="border border-border rounded">
          <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
            <div className="w-6 h-4 bg-muted rounded-sm" />
            <div className="w-6 h-4 bg-muted rounded-sm" />
            <div className="w-6 h-4 bg-muted rounded-sm" />
          </div>
<textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full p-3 border-none resize-none focus:outline-none"
            style={{ minHeight }}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={disabled}
        modules={modules}
        formats={formats}
style={{
          backgroundColor: 'white',
          border: '1px solid hsl(var(--border))',
          borderRadius: '6px',
          minHeight,
        }}
      />
    </Card>
  );
};