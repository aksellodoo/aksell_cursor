import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type EmailSyncUnit = "days" | "months" | "years";

export interface UserEmailPreferences {
  id?: string;
  user_id: string;
  email_sync_value: number;
  email_sync_unit: EmailSyncUnit;
  signature_html: string | null;
  created_at?: string;
  updated_at?: string;
  signature_updated_at?: string;
}

export const useUserEmailPreferences = (userId?: string) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id || null;

  const [prefs, setPrefs] = useState<UserEmailPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!effectiveUserId) {
      setPrefs(null);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_email_preferences")
      .select("*")
      .eq("user_id", effectiveUserId)
      .limit(1);

    if (error) {
      console.error("Erro ao buscar preferências de email:", error);
      setPrefs(null);
    } else {
      const row = data && data.length > 0 ? (data[0] as any) : null;
      setPrefs(
        row || {
          user_id: effectiveUserId,
          email_sync_value: 30,
          email_sync_unit: "days",
          signature_html: null,
        }
      );
    }
    setLoading(false);
  }, [effectiveUserId]);

  const saveSyncSettings = useCallback(
    async (value: number, unit: EmailSyncUnit) => {
      if (!effectiveUserId) return { error: new Error("Usuário não autenticado") };
      setSaving(true);
      const payload = {
        user_id: effectiveUserId,
        email_sync_value: value,
        email_sync_unit: unit,
      };
      const { data, error } = await supabase
        .from("user_email_preferences")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .limit(1);
      if (!error && data && data.length) {
        setPrefs(prev => ({ ...(prev || ({} as any)), ...data[0] }));
      }
      setSaving(false);
      return { data, error };
    },
    [effectiveUserId]
  );

  const saveSignature = useCallback(
    async (html: string) => {
      if (!effectiveUserId) return { error: new Error("Usuário não autenticado") };
      setSaving(true);
      const payload = {
        user_id: effectiveUserId,
        signature_html: html,
        signature_updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("user_email_preferences")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .limit(1);
      if (!error && data && data.length) {
        setPrefs(prev => ({ ...(prev || ({} as any)), ...data[0] }));
      }
      setSaving(false);
      return { data, error };
    },
    [effectiveUserId]
  );

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  return { prefs, loading, saving, refresh: fetchPrefs, saveSyncSettings, saveSignature };
};