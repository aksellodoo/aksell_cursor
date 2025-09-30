import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ChatterTabs } from "./ChatterTabs";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export const ChatterFullScreen = () => {
  const navigate = useNavigate();
  const { recordType, recordId } = useParams<{ recordType: string; recordId: string }>();

  const [density, setDensity] = useState<'compact' | 'comfortable'>(
    () => (localStorage.getItem('chatterDensity') as 'compact' | 'comfortable') || 'compact'
  );
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatterDensity', density);
  }, [density]);
  
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!recordType || !recordId) return;
      try {
        let table: 'profiles' | 'departments' | 'employees' | 'tasks' | null = null;
        let select = "*";
        switch (recordType) {
          case 'user':
            table = 'profiles';
            select = 'name,email';
            break;
          case 'department':
            table = 'departments';
            select = 'name';
            break;
          case 'employee':
            table = 'employees';
            select = 'full_name,email';
            break;
          case 'task':
            table = 'tasks';
            select = 'title,name';
            break;
          default:
            table = null;
        }
        if (!table) return;
        const { data, error } = await supabase
          .from(table)
          .select(select)
          .eq('id', recordId)
          .single();

        if (error) throw error;

        if (!cancelled) {
          const label =
            (data as any)?.name ||
            (data as any)?.full_name ||
            (data as any)?.title ||
            (data as any)?.email ||
            null;
          setDisplayName(label);
        }
      } catch (e) {
        console.warn('Failed to fetch display name:', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [recordType, recordId]);
  if (!recordType || !recordId) {
    navigate(-1);
    return null;
  }

  const handleBack = () => {
    console.log('handleBack called, recordType:', recordType);
    try {
      // Navigate specifically to the correct routes
      if (recordType === 'department') {
        navigate('/departamentos'); // Fixed: departments page uses '/departamentos'
      } else if (recordType === 'user') {
        navigate('/usuarios');
      } else if (recordType === 'task') {
        navigate('/tasks');
      } else if (recordType === 'employee') {
        navigate('/employees');
      } else {
        // Fallback to history back
        navigate(-1);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Ultimate fallback
      window.history.back();
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'Usuário';
      case 'department': return 'Departamento';
      case 'employee': return 'Colaborador';
      case 'task': return 'Tarefa';
      default: return type;
    }
  };

  const shortId = (id: string) => (id && id.length > 8 ? `${id.slice(0, 8)}…` : id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <div className="sticky top-0 z-30 border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="text-[10px] md:text-xs text-muted-foreground">
                Chatter • {getTypeLabel(recordType)} • {displayName ?? shortId(recordId)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={density} onValueChange={(v: any) => setDensity(v)}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Densidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="comfortable">Confortável</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(recordId);
                    toast.success('ID copiado');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch (e) {
                    toast.error('Não foi possível copiar o ID');
                  }
                }}
                aria-label="Copiar ID"
                title="Copiar ID"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          
          
          
          {/* Chatter Content */}
          <Card className="p-3">
            <ChatterTabs recordType={recordType} recordId={recordId} density={density} />
          </Card>
        </div>
      </div>
    </div>
  );
};