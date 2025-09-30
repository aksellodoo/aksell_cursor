import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EmailTag { id: string; name: string; }

export const useEmailTags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState<EmailTag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("email_tags").select("id,name").order("name");
    if (error) {
      console.error("Erro ao buscar tags:", error);
    } else {
      setTags((data || []) as EmailTag[]);
    }
    setLoading(false);
  }, []);

  const createTag = useCallback(async (name: string) => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from("email_tags")
      .insert({ name, created_by: user.id })
      .select("id,name")
      .single();
    if (error) {
      console.error("Erro ao criar tag:", error);
      return null;
    }
    await fetchTags();
    return data as EmailTag;
  }, [user?.id, fetchTags]);

  const updateTag = useCallback(async (id: string, name: string) => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from("email_tags")
      .update({ name })
      .eq("id", id)
      .eq("created_by", user.id)
      .select("id,name")
      .single();
    if (error) {
      console.error("Erro ao atualizar tag:", error);
      return null;
    }
    await fetchTags();
    return data as EmailTag;
  }, [user?.id, fetchTags]);

  const deleteTag = useCallback(async (id: string) => {
    if (!user?.id) return false;
    const { error } = await supabase
      .from("email_tags")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id);
    if (error) {
      console.error("Erro ao deletar tag:", error);
      return false;
    }
    await fetchTags();
    return true;
  }, [user?.id, fetchTags]);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag };
};