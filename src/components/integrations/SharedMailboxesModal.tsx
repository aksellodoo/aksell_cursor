
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Inbox, Trash2, Plus, Mail } from "lucide-react";

type SharedMailbox = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

interface SharedMailboxesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const SharedMailboxesModal = ({ open, onOpenChange, userId }: SharedMailboxesModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mailboxes, setMailboxes] = useState<SharedMailbox[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const canSubmit = useMemo(() => {
    return displayName.trim().length > 1 && /\S+@\S+\.\S+/.test(email.trim());
  }, [displayName, email]);

  const fetchMailboxes = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("microsoft_shared_mailboxes")
      .select("*")
      .eq("user_id", userId)
      .order("display_name", { ascending: true });

    if (error) {
      console.error("Erro ao buscar caixas compartilhadas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as caixas compartilhadas.",
        variant: "destructive",
      });
    } else {
      setMailboxes(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      display_name: displayName.trim(),
      email: email.trim(),
    };
    const { error } = await supabase.from("microsoft_shared_mailboxes").insert(payload);
    if (error) {
      console.error("Erro ao adicionar caixa compartilhada:", error);
      toast({
        title: "Erro",
        description:
          error.message?.includes("already exists") || error.code === "23505"
            ? "Já existe uma caixa com este e-mail."
            : "Não foi possível adicionar a caixa compartilhada.",
        variant: "destructive",
      });
    } else {
      setDisplayName("");
      setEmail("");
      await fetchMailboxes();
      toast({ title: "Caixa adicionada", description: "Caixa compartilhada cadastrada com sucesso." });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta caixa compartilhada?")) return;
    const { error } = await supabase.from("microsoft_shared_mailboxes").delete().eq("id", id);
    if (error) {
      console.error("Erro ao remover caixa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a caixa.",
        variant: "destructive",
      });
    } else {
      setMailboxes((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Removida", description: "Caixa compartilhada removida." });
    }
  };

  useEffect(() => {
    if (open) {
      fetchMailboxes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            Caixas compartilhadas
          </DialogTitle>
          <DialogDescription>
            Cadastre e gerencie caixas de e-mail compartilhadas vinculadas à sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="display_name">Nome</Label>
              <Input
                id="display_name"
                placeholder="Ex: Suporte"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="md:col-span-3 space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: suporte@aksell.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="md:col-span-5 flex justify-end">
              <Button onClick={handleAdd} disabled={!canSubmit || saving}>
                <Plus className="h-4 w-4 mr-1" />
                {saving ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {loading ? "Carregando..." : `${mailboxes.length} caixa(s) cadastrada(s)`}
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {mailboxes.length === 0 && !loading ? (
                <div className="text-sm text-muted-foreground">Nenhuma caixa cadastrada ainda.</div>
              ) : (
                mailboxes.map((mb) => (
                  <div
                    key={mb.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{mb.display_name}</div>
                        <div className="text-sm text-muted-foreground">{mb.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(mb.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharedMailboxesModal;
