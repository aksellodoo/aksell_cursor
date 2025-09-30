
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Inbox, Mail } from "lucide-react";

type MsAccount = {
  id: string;
  user_id: string;
  ms_account_id: string;
  email: string | null;
  display_name: string | null;
};

type SharedMailbox = {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
};

interface SignatureTargetsSelectorProps {
  userId: string;
  selectedMicrosoftIds: string[];
  selectedSharedIds: string[];
  onChange: (msIds: string[], sharedIds: string[]) => void;
}

export const SignatureTargetsSelector = ({
  userId,
  selectedMicrosoftIds,
  selectedSharedIds,
  onChange,
}: SignatureTargetsSelectorProps) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<MsAccount[]>([]);
  const [mailboxes, setMailboxes] = useState<SharedMailbox[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      const [{ data: acc, error: e1 }, { data: mbs, error: e2 }] = await Promise.all([
        supabase.from("microsoft_accounts").select("*").eq("user_id", userId),
        supabase.from("microsoft_shared_mailboxes").select("*").eq("user_id", userId).order("display_name", { ascending: true }),
      ]);
      if (e1) console.error("Erro ao buscar contas MS:", e1);
      if (e2) console.error("Erro ao buscar caixas compartilhadas:", e2);
      setAccounts((acc || []) as any);
      setMailboxes((mbs || []) as any);
      setLoading(false);
    };
    load();
  }, [userId]);

  const toggleMs = (id: string) => {
    const set = new Set(selectedMicrosoftIds);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange([...set], selectedSharedIds);
  };

  const toggleShared = (id: string) => {
    const set = new Set(selectedSharedIds);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange(selectedMicrosoftIds, [...set]);
  };

  return (
    <Card className="p-3 space-y-3">
      <div className="text-sm font-medium">Aplicar a:</div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox className="h-4 w-4" />
          Conta individual
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma conta Microsoft conectada.</div>
          ) : (
            accounts.map((a) => (
              <label key={a.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedMicrosoftIds.includes(a.id)}
                  onCheckedChange={() => toggleMs(a.id)}
                />
                <span className="text-sm">
                  {a.email || "(sem email)"} {a.display_name ? `— ${a.display_name}` : ""}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          Caixas compartilhadas
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : mailboxes.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhuma caixa compartilhada cadastrada.</div>
          ) : (
            mailboxes.map((mb) => (
              <label key={mb.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedSharedIds.includes(mb.id)}
                  onCheckedChange={() => toggleShared(mb.id)}
                />
                <span className="text-sm">
                  {mb.display_name} — {mb.email}
                </span>
              </label>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default SignatureTargetsSelector;
