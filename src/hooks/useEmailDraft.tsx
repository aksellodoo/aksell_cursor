import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EmailDraft {
  id: string;
  owner_id: string;
  subject: string | null;
  html: string | null;
  to_recipients: string[];
  cc_recipients: string[];
  bcc_recipients: string[];
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface DraftShare {
  id: string;
  draft_id: string;
  user_id: string;
  created_at: string;
}

export const useEmailDraft = (enabled: boolean) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const createDraft = useCallback(async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from("email_drafts")
      .insert({ owner_id: user.id })
      .select("*")
      .single();
    if (error) {
      console.error("Erro ao criar rascunho:", error);
      return null;
    }
    setDraft(data as EmailDraft);
    return data as EmailDraft;
  }, [user?.id]);

  useEffect(() => {
    if (!enabled) return;
    if (!user?.id) return;
    // cria um rascunho ao abrir
    createDraft();
    // cleanup cancela debounce
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [enabled, user?.id, createDraft]);

  const updateDraft = useCallback((patch: Partial<EmailDraft>) => {
    if (!draft) return;
    const payload: Partial<EmailDraft> = { ...patch } as any;
    // debounce persistência
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_drafts")
        .update(payload)
        .eq("id", draft.id)
        .select("*")
        .single();
      if (error) {
        console.warn("Falha ao salvar rascunho:", error);
      } else {
        setDraft(data as EmailDraft);
      }
      setLoading(false);
    }, 500);
  }, [draft]);

  const deleteDraft = useCallback(async () => {
    if (!draft) return;
    await supabase.from("email_drafts").delete().eq("id", draft.id);
    setDraft(null);
  }, [draft]);

  // Sharing
  const listShares = useCallback(async (): Promise<DraftShare[]> => {
    if (!draft) return [];
    const { data, error } = await supabase
      .from("email_draft_shares")
      .select("*")
      .eq("draft_id", draft.id);
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []) as DraftShare[];
  }, [draft]);

  const addShare = useCallback(async (userId: string) => {
    if (!draft) return;
    await supabase.from("email_draft_shares").insert({ draft_id: draft.id, user_id: userId });
  }, [draft]);

  const removeShare = useCallback(async (userId: string) => {
    if (!draft) return;
    await supabase.from("email_draft_shares").delete().eq("draft_id", draft.id).eq("user_id", userId);
  }, [draft]);

  return {
    draft,
    setDraft,
    createDraft,
    updateDraft,
    deleteDraft,
    loading,
    listShares,
    addShare,
    removeShare,
  };
};