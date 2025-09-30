import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullscreenDialogContent } from "@/components/ui/fullscreen-dialog";
import { PortalUserAddModal } from "@/components/PortalUserAddModal";

export type DraftPortalUser = { name: string; email: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  users: DraftPortalUser[];
  onUsersChange: (users: DraftPortalUser[]) => void;
}

export function PortalUsersDraftManager({ open, onOpenChange, users, onUsersChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = async (u: { name: string; email: string }) => {
    const exists = users.some((x) => x.email.trim().toLowerCase() === u.email.trim().toLowerCase());
    if (exists) {
      // Ignora duplicados por email de forma simples
      return;
    }
    onUsersChange([...users, { name: u.name.trim(), email: u.email.trim() }]);
  };

  const handleRemove = (index: number) => {
    const next = [...users];
    next.splice(index, 1);
    onUsersChange(next);
  };

  return (
    <FullscreenDialogContent open={open} onOpenChange={onOpenChange}>
      <header className="border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-semibold">Usuários do Portal (rascunho)</h2>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)}>Adicionar usuário</Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 overflow-y-auto">
        {users.length === 0 ? (
          <p className="text-muted-foreground">Nenhum usuário em rascunho. Clique em “Adicionar usuário”.</p>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium bg-muted/50">
              <div className="col-span-5">Nome</div>
              <div className="col-span-5">Email</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            <div className="divide-y">
              {users.map((u, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                  <div className="col-span-5 truncate" title={u.name}>{u.name}</div>
                  <div className="col-span-5 truncate" title={u.email}>{u.email}</div>
                  <div className="col-span-2 flex justify-end">
                    <Button variant="destructive" size="sm" onClick={() => handleRemove(i)}>Remover</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t bg-card/95">
        <div className="container mx-auto px-4 md:px-6 py-3 text-sm text-muted-foreground">
          {users.length} usuário(s) em rascunho
        </div>
      </footer>

      <PortalUserAddModal open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />
    </FullscreenDialogContent>
  );
}
