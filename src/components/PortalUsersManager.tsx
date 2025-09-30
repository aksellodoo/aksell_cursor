
import { useMemo, useState } from "react";
import { X, Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { FullscreenDialogContent } from "@/components/ui/fullscreen-dialog";
import { useToast } from "@/hooks/use-toast";
import { usePortalUsers } from "@/hooks/usePortalUsers";
import type { Portal } from "@/hooks/usePortals";
import { PortalUserAddModal } from "./PortalUserAddModal";

interface Props {
  portal: Portal;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PortalUsersManager({ portal, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { listQuery, createMutation, updateActiveMutation, deleteMutation } = usePortalUsers(portal?.id);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const items = listQuery.data || [];
    if (!term) return items;
    return items.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
  }, [listQuery.data, search]);

  const handleAdd = async (data: { name: string; email: string }) => {
    await createMutation.mutateAsync(data)
      .then(() => {
        toast({ title: "Usuário adicionado", description: "Usuário do portal criado com sucesso." });
      })
      .catch((err: any) => {
        toast({ title: "Erro ao adicionar", description: err?.message || "Tente novamente.", variant: "destructive" });
      });
  };

  const toggleActive = async (id: string, value: boolean) => {
    await updateActiveMutation.mutateAsync({ id, is_active: value })
      .then(() => {
        toast({ title: "Atualizado", description: value ? "Usuário ativado." : "Usuário inativado." });
      })
      .catch((err: any) => {
        toast({ title: "Erro ao atualizar", description: err?.message || "Tente novamente.", variant: "destructive" });
      });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
      .then(() => {
        toast({ title: "Removido", description: "Usuário do portal removido com sucesso." });
      })
      .catch((err: any) => {
        toast({ title: "Erro ao remover", description: err?.message || "Tente novamente.", variant: "destructive" });
      });
  };

  return (
    <FullscreenDialogContent open={open} onOpenChange={onOpenChange} className="flex flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Usuários do Portal</h2>
          <p className="text-sm text-muted-foreground">Portal: {portal?.name}</p>
        </div>
        <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-6 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Adicionar usuário
          </Button>
          <div className="ml-auto">
            <Badge variant="secondary">{(listQuery.data || []).length} usuários</Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-md border">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum usuário do portal encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={u.is_active} onCheckedChange={(v) => toggleActive(u.id, v)} />
                        <Badge variant={u.is_active ? "default" : "secondary"}>
                          {u.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="border-t px-6 py-3 flex items-center justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
      </div>

      <PortalUserAddModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={handleAdd}
      />
    </FullscreenDialogContent>
  );
}
