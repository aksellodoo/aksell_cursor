
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { name: string; email: string }) => Promise<void> | void;
}

export function PortalUserAddModal({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    await Promise.resolve(onSubmit({ name: name.trim(), email: email.trim() }));
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Novo usuário do portal</DialogTitle>
          <DialogDescription>Informe nome e email do usuário do portal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Usuário</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Maria Silva" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email do Usuário</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@aksel.com.br" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSave} disabled={submitting || !name.trim() || !email.trim()}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
