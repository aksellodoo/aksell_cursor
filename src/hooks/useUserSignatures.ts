
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type EmailSignature = {
  id: string;
  user_id: string;
  name: string;
  html: string;
  created_at: string;
  updated_at: string;
  targets?: SignatureTarget[];
};

export type SignatureTarget = {
  id: string;
  signature_id: string;
  user_id: string;
  microsoft_account_id: string | null;
  shared_mailbox_id: string | null;
  created_at: string;
};

type SetTargetsInput = {
  microsoftIds: string[];
  sharedIds: string[];
};

export const useUserSignatures = (userId?: string) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id || null;

  const [signatures, setSignatures] = useState<EmailSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!effectiveUserId) {
      setSignatures([]);
      return;
    }
    setLoading(true);

    const [{ data: sigs, error: sigErr }, { data: tgs, error: tgtErr }] = await Promise.all([
      supabase.from("email_signatures").select("*").eq("user_id", effectiveUserId).order("created_at", { ascending: true }),
      supabase.from("email_signature_targets").select("*").eq("user_id", effectiveUserId),
    ]);

    if (sigErr) {
      console.error("Erro ao buscar assinaturas:", sigErr);
      setSignatures([]);
      setLoading(false);
      return;
    }
    if (tgtErr) {
      console.error("Erro ao buscar alvos de assinaturas:", tgtErr);
      setSignatures((sigs || []) as any);
      setLoading(false);
      return;
    }

    const groupedTargets = new Map<string, SignatureTarget[]>();
    (tgs || []).forEach((t: any) => {
      const arr = groupedTargets.get(t.signature_id) || [];
      arr.push(t);
      groupedTargets.set(t.signature_id, arr);
    });

    const merged = (sigs || []).map((s: any) => ({
      ...s,
      targets: groupedTargets.get(s.id) || [],
    })) as EmailSignature[];

    setSignatures(merged);
    setLoading(false);
  }, [effectiveUserId]);

  const createSignature = useCallback(
    async (name = "Assinatura", html = "") => {
      if (!effectiveUserId) return { error: new Error("Usuário não autenticado") };
      setSaving(true);
      const { data, error } = await supabase
        .from("email_signatures")
        .insert({ user_id: effectiveUserId, name, html })
        .select("*")
        .single();

      if (!error && data) {
        setSignatures((prev) => [...prev, { ...(data as any), targets: [] }]);
      }
      setSaving(false);
      return { data, error };
    },
    [effectiveUserId]
  );

  const updateSignature = useCallback(
    async (id: string, payload: Partial<Pick<EmailSignature, "name" | "html">>) => {
      if (!effectiveUserId) return { error: new Error("Usuário não autenticado") };
      setSaving(true);
      const { data, error } = await supabase
        .from("email_signatures")
        .update(payload)
        .eq("id", id)
        .eq("user_id", effectiveUserId)
        .select("*")
        .single();

      if (!error && data) {
        setSignatures((prev) =>
          prev.map((s) => (s.id === id ? { ...(s as any), ...(data as any) } : s))
        );
      }
      setSaving(false);
      return { data, error };
    },
    [effectiveUserId]
  );

  const deleteSignature = useCallback(
    async (id: string) => {
      if (!effectiveUserId) return { error: new Error("Usuário não autenticado") };
      setSaving(true);
      const { error } = await supabase.from("email_signatures").delete().eq("id", id).eq("user_id", effectiveUserId);
      if (!error) {
        setSignatures((prev) => prev.filter((s) => s.id !== id));
      }
      setSaving(false);
      return { error };
    },
    [effectiveUserId]
  );

  const setTargets = useCallback(
    async (signatureId: string, input: SetTargetsInput) => {
      if (!effectiveUserId) return { error: new Error("Usuário não autenticado") };

      const sig = signatures.find((s) => s.id === signatureId);
      const existing = sig?.targets || [];

      const existingMs = new Set(
        existing.filter((t) => t.microsoft_account_id).map((t) => t.microsoft_account_id as string)
      );
      const existingShared = new Set(
        existing.filter((t) => t.shared_mailbox_id).map((t) => t.shared_mailbox_id as string)
      );

      const desiredMs = new Set(input.microsoftIds);
      const desiredShared = new Set(input.sharedIds);

      const toAddMs = [...desiredMs].filter((id) => !existingMs.has(id));
      const toAddShared = [...desiredShared].filter((id) => !existingShared.has(id));
      const toRemoveMs = existing.filter(
        (t) => t.microsoft_account_id && !desiredMs.has(t.microsoft_account_id)
      );
      const toRemoveShared = existing.filter(
        (t) => t.shared_mailbox_id && !desiredShared.has(t.shared_mailbox_id)
      );

      setSaving(true);

      const inserts = [
        ...toAddMs.map((msId) => ({
          signature_id: signatureId,
          user_id: effectiveUserId,
          microsoft_account_id: msId,
          shared_mailbox_id: null,
        })),
        ...toAddShared.map((smId) => ({
          signature_id: signatureId,
          user_id: effectiveUserId,
          microsoft_account_id: null,
          shared_mailbox_id: smId,
        })),
      ];

      let insertError: any = null;
      let deleteError: any = null;

      if (inserts.length) {
        const { error } = await supabase.from("email_signature_targets").insert(inserts);
        insertError = error;
      }

      if (toRemoveMs.length || toRemoveShared.length) {
        const idsToRemove = [...toRemoveMs, ...toRemoveShared].map((t) => t.id);
        const { error } = await supabase
          .from("email_signature_targets")
          .delete()
          .in("id", idsToRemove);
        deleteError = error;
      }

      const error = insertError || deleteError;

      if (!error) {
        await fetchAll();
      }

      setSaving(false);
      return { error };
    },
    [effectiveUserId, signatures, fetchAll]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const hasAnySignature = useMemo(() => signatures.length > 0, [signatures]);

  return {
    signatures,
    loading,
    saving,
    refresh: fetchAll,
    createSignature,
    updateSignature,
    deleteSignature,
    setTargets,
    hasAnySignature,
  };
};
