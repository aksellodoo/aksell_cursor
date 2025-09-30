import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EmailTag } from "@/hooks/useEmailTags";

export const useContactEntityTags = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getTags = useCallback(async (entityId: string): Promise<EmailTag[]> => {
    if (!entityId) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_entity_tags")
        .select(`
          tag_id,
          email_tags!inner(id, name)
        `)
        .eq("entity_id", entityId);

      if (error) {
        console.error("Erro ao buscar tags da entidade:", error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.email_tags.id,
        name: item.email_tags.name
      }));
    } catch (error) {
      console.error("Erro ao buscar tags da entidade:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const setTags = useCallback(async (entityId: string, tags: EmailTag[]): Promise<boolean> => {
    if (!user?.id || !entityId) return false;

    setLoading(true);
    try {
      // Get current tags for this entity
      const currentTags = await getTags(entityId);
      
      // Calculate what to add and remove
      const currentTagIds = new Set(currentTags.map(t => t.id));
      const newTagIds = new Set(tags.map(t => t.id));
      
      const toAdd = tags.filter(tag => !currentTagIds.has(tag.id));
      const toRemove = currentTags.filter(tag => !newTagIds.has(tag.id));

      console.log("Tags delta:", { toAdd: toAdd.length, toRemove: toRemove.length });
      
      // If no changes needed, return success
      if (toAdd.length === 0 && toRemove.length === 0) {
        console.log('No tag changes needed');
        return true;
      }

      // Add new tags
      if (toAdd.length > 0) {
        const tagInserts = toAdd.map(tag => ({
          entity_id: entityId,
          tag_id: tag.id,
          created_by: user.id
        }));

        const { error: insertError } = await supabase
          .from("contact_entity_tags")
          .upsert(tagInserts, { 
            onConflict: 'entity_id,tag_id',
            ignoreDuplicates: false 
          });

        if (insertError) {
          console.error("Erro ao adicionar tags:", insertError);
          return false;
        }
      }

      // Remove old tags (only those created by current user due to RLS)
      if (toRemove.length > 0) {
        for (const tag of toRemove) {
          const { error: deleteError } = await supabase
            .from("contact_entity_tags")
            .delete()
            .eq("entity_id", entityId)
            .eq("tag_id", tag.id)
            .eq("created_by", user.id);

          if (deleteError) {
            console.warn("Não foi possível remover tag (RLS):", tag.name, deleteError);
            // Continue with other operations even if some deletions fail
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar tags da entidade:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, getTags]);

  const addTag = useCallback(async (entityId: string, tagId: string): Promise<boolean> => {
    if (!user?.id || !entityId || !tagId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("contact_entity_tags")
        .insert({
          entity_id: entityId,
          tag_id: tagId,
          created_by: user.id
        });

      if (error) {
        console.error("Erro ao adicionar tag à entidade:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao adicionar tag à entidade:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const removeTag = useCallback(async (entityId: string, tagId: string): Promise<boolean> => {
    if (!entityId || !tagId) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("contact_entity_tags")
        .delete()
        .eq("entity_id", entityId)
        .eq("tag_id", tagId);

      if (error) {
        console.error("Erro ao remover tag da entidade:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao remover tag da entidade:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getTags,
    setTags,
    addTag,
    removeTag
  };
};