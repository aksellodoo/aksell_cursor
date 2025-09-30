import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteDocument {
  id: string;
  slug: string;
  locale: string;
  title: string;
  content_html: string;
  is_published: boolean;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteDocuments = () => {
  const [loading, setLoading] = useState(false);

  const getDocument = useCallback(async (slug: string, locale: string = 'pt'): Promise<SiteDocument | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_documents')
        .select('*')
        .eq('slug', slug)
        .eq('locale', locale)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - document doesn't exist yet
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDocument = useCallback(async (
    slug: string,
    title: string,
    content_html: string,
    locale: string = 'pt',
    is_published: boolean = true
  ): Promise<SiteDocument | null> => {
    try {
      setLoading(true);

      // Try to get existing document first
      const existing = await getDocument(slug, locale);

      let result;
      if (existing) {
        // Update existing document
        const { data, error } = await supabase
          .from('site_documents')
          .update({
            title,
            content_html,
            is_published,
            version: existing.version + 1,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Documento atualizado com sucesso!');
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('site_documents')
          .insert({
            slug,
            locale,
            title,
            content_html,
            is_published,
            version: 1,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Documento criado com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Erro ao salvar documento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getDocument]);

  const getPublicDocument = useCallback(async (slug: string, locale: string = 'pt'): Promise<SiteDocument | null> => {
    try {
      const { data, error } = await supabase
        .from('site_documents')
        .select('*')
        .eq('slug', slug)
        .eq('locale', locale)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching public document:', error);
      return null;
    }
  }, []);

  return {
    loading,
    getDocument,
    saveDocument,
    getPublicDocument,
  };
};