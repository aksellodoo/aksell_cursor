import { useState, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { FixedTaskType } from '@/lib/taskTypesFixed';
import { useToast } from '@/hooks/use-toast';

interface TaskDraftData {
  id?: string;
  origin: 'fixed' | 'template';
  fixed_type?: FixedTaskType;
  template_id?: string;
  form_state: Record<string, any>;
  status: 'open' | 'submitted' | 'discarded';
  updated_at?: string;
}

interface DraftStore {
  drafts: Record<string, TaskDraftData>;
  setDraft: (key: string, draft: TaskDraftData) => void;
  removeDraft: (key: string) => void;
  clearDrafts: () => void;
}

const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, draft) => 
        set((state) => ({ 
          drafts: { ...state.drafts, [key]: draft }
        })),
      removeDraft: (key) =>
        set((state) => {
          const { [key]: removed, ...rest } = state.drafts;
          return { drafts: rest };
        }),
      clearDrafts: () => set({ drafts: {} }),
    }),
    {
      name: 'task-drafts-v1',
      partialize: (state) => ({ drafts: state.drafts }),
    }
  )
);

// Utilities para debounce e throttle
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

interface UseTaskDraftProps {
  origin: 'fixed' | 'template';
  fixed_type?: FixedTaskType;
  template_id?: string;
}

export const useTaskDraft = ({ origin, fixed_type, template_id }: UseTaskDraftProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraftState] = useState<TaskDraftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const { setDraft: setStoreDraft, removeDraft } = useDraftStore();
  
  // Refs para controlar salvamentos
  const saveInProgress = useRef(false);
  const lastFormState = useRef<Record<string, any>>({});
  const currentFormStateRef = useRef<Record<string, any>>({});

  // Gerar chave única para o rascunho
  const draftKey = `${user?.id || 'anonymous'}:${origin}:${
    origin === 'fixed' ? fixed_type || '-' : template_id || '-'
  }`;

  // Carregar rascunho inicial
  const loadDraft = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Verificar se temos os dados necessários para buscar no servidor
      const hasRequiredData = origin === 'fixed' ? fixed_type : template_id;
      
      if (!hasRequiredData) {
        // Se não temos dados suficientes, carregar apenas do store local
        const localDraft = useDraftStore.getState().drafts[draftKey];
        if (localDraft && localDraft.status === 'open') {
          setDraftState(localDraft);
          lastFormState.current = localDraft.form_state;
          setLoading(false);
          return localDraft;
        }
        setLoading(false);
        return null;
      }
      
      // Buscar rascunho no servidor
      const { data: serverDraft, error } = await supabase
        .from('task_drafts')
        .select('*')
        .eq('user_id', user.id)
        .eq('origin', origin)
        .eq('status', 'open')
        .eq(origin === 'fixed' ? 'fixed_type' : 'template_id', 
            origin === 'fixed' ? fixed_type : template_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (serverDraft) {
        const draftData: TaskDraftData = {
          id: serverDraft.id,
          origin: serverDraft.origin as 'fixed' | 'template',
          fixed_type: serverDraft.fixed_type as FixedTaskType,
          template_id: serverDraft.template_id || undefined,
          form_state: (serverDraft.form_state as Record<string, any>) || {},
          status: serverDraft.status as 'open' | 'submitted' | 'discarded',
          updated_at: serverDraft.updated_at,
        };
        
        setDraftState(draftData);
        setStoreDraft(draftKey, draftData);
        lastFormState.current = draftData.form_state as Record<string, any>;
        currentFormStateRef.current = draftData.form_state as Record<string, any>;
        setLastSaved(new Date(serverDraft.updated_at));
        
        return draftData;
      } else {
        // Tentar carregar do store local como fallback
        const localDraft = useDraftStore.getState().drafts[draftKey];
        if (localDraft && localDraft.status === 'open') {
          setDraftState(localDraft);
          lastFormState.current = localDraft.form_state;
          currentFormStateRef.current = localDraft.form_state;
          return localDraft;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar rascunho",
        description: "Não foi possível carregar o rascunho salvo."
      });
    } finally {
      setLoading(false);
    }

    return null;
  };

  // Salvar rascunho com optimistic concurrency control
  const saveDraft = async (form_state: Record<string, any>, force = false) => {
    if (!user || saveInProgress.current || loading) return;
    
    try {
      saveInProgress.current = true;
      setSaving(true);

      const draftData: TaskDraftData = {
        origin,
        fixed_type,
        template_id,
        form_state,
        status: 'open'
      };

      // Salvar no store local primeiro (fallback offline)
      setStoreDraft(draftKey, draftData);

      // Verificar se temos os dados necessários para salvar no servidor
      const hasRequiredData = origin === 'fixed' ? fixed_type : template_id;
      
      if (!hasRequiredData) {
        // Se não temos dados suficientes, salvar apenas localmente
        setDraftState(draftData);
        lastFormState.current = form_state;
        setIsDirty(false);
        return;
      }

      // Salvar no servidor
      if (draft?.id) {
        // Update existente com controle de concorrência
        const { data, error } = await supabase
          .from('task_drafts')
          .update({
            form_state,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id)
          .eq('updated_at', draft.updated_at || new Date(0).toISOString())
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Conflito de concorrência - recarregar
            toast({
              title: "Rascunho atualizado por outra sessão",
              description: "Recarregando a versão mais recente..."
            });
            await loadDraft();
            return;
          }
          throw error;
        }

        if (data) {
          const updatedDraft = {
            ...draftData,
            id: data.id,
            updated_at: data.updated_at
          };
          setDraftState(updatedDraft);
          setStoreDraft(draftKey, updatedDraft);
          setLastSaved(new Date(data.updated_at));
        }
      } else {
        // Insert novo
        const { data, error } = await supabase
          .from('task_drafts')
          .insert({
            user_id: user.id,
            origin,
            fixed_type,
            template_id,
            form_state,
            status: 'open'
          })
          .select()
          .single();

        if (error) {
          // Tratar erro de draft duplicado (já existe um rascunho aberto)
          if (error.code === 'P0001' || error.message?.includes('open draft')) {
            console.log('Draft já existe, recarregando e tentando novamente...');
            await loadDraft();
            // Tentar salvar novamente com o estado atual
            const currentState = currentFormStateRef.current;
            if (Object.keys(currentState).length > 0) {
              setTimeout(() => saveDraft(currentState, true), 500);
            }
            return;
          }
          throw error;
        }

        const newDraft = {
          ...draftData,
          id: data.id,
          updated_at: data.updated_at
        };
        setDraftState(newDraft);
        setStoreDraft(draftKey, newDraft);
        setLastSaved(new Date(data.updated_at));
      }

      lastFormState.current = form_state;
      setIsDirty(false);

    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      if (force) {
        toast({
          variant: "destructive",
          title: "Erro ao salvar rascunho",
          description: "Não foi possível salvar o rascunho no servidor."
        });
      }
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };

  // Descartar rascunho
  const discardDraft = async () => {
    if (!user) return;

    // Se não tem ID do servidor, apenas remover localmente
    if (!draft?.id) {
      setDraftState(null);
      removeDraft(draftKey);
      setIsDirty(false);
      setLastSaved(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('task_drafts')
        .update({ status: 'discarded' })
        .eq('id', draft.id);

      if (error) throw error;

      setDraftState(null);
      removeDraft(draftKey);
      setIsDirty(false);
      setLastSaved(null);

      toast({
        title: "Rascunho descartado",
        description: "O rascunho foi removido com sucesso."
      });
    } catch (error) {
      console.error('Erro ao descartar rascunho:', error);
      toast({
        variant: "destructive",
        title: "Erro ao descartar rascunho",
        description: "Não foi possível descartar o rascunho."
      });
    }
  };

  // Submeter rascunho (marcar como usado)
  const submitFromDraft = async () => {
    // Se não tem ID do servidor, apenas remover localmente
    if (!draft?.id) {
      removeDraft(draftKey);
      setIsDirty(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('task_drafts')
        .update({ status: 'submitted' })
        .eq('id', draft.id);

      if (error) throw error;

      removeDraft(draftKey);
      setIsDirty(false);
    } catch (error) {
      console.error('Erro ao submeter rascunho:', error);
    }
  };

  // Debounced save
  const saveDraftDebounced = useRef(
    debounce((form_state: Record<string, any>) => {
      saveDraft(form_state);
    }, 800)
  ).current;

  // Throttled save
  const saveDraftThrottled = useRef(
    throttle((form_state: Record<string, any>) => {
      saveDraft(form_state);
    }, 5000)
  ).current;

  // Verificar se o form mudou
  const updateFormState = (form_state: Record<string, any>) => {
    // Atualizar a referência atual do form state imediatamente
    currentFormStateRef.current = form_state;
    
    const hasChanged = JSON.stringify(form_state) !== JSON.stringify(lastFormState.current);
    
    if (hasChanged) {
      setIsDirty(true);
      
      // Usar throttled para evitar muitas requisições
      saveDraftThrottled(form_state);
      
      // E debounced para capturar a versão final
      saveDraftDebounced(form_state);
    }
  };

  // Salvar imediatamente (para Ctrl+S)
  const saveImmediate = () => {
    const currentState = currentFormStateRef.current;
    if (Object.keys(currentState).length > 0) {
      saveDraft(currentState, true);
    }
  };

  // Auto-save quando a aba perde foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isDirty && !loading) {
        const currentState = currentFormStateRef.current;
        if (Object.keys(currentState).length > 0) {
          saveDraft(currentState, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDirty, loading]);

  // Carregar rascunho no mount
  useEffect(() => {
    if (user) {
      loadDraft();
    }
  }, [user, draftKey]);

  return {
    draft,
    loading,
    saving,
    lastSaved,
    isDirty,
    loadDraft,
    updateFormState,
    saveImmediate,
    discardDraft,
    submitFromDraft,
  };
};