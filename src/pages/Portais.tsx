import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { usePortals } from "@/hooks/usePortals";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PortalUsersManager } from "@/components/PortalUsersManager";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

const stakeholderLabel: Record<string, string> = {
  cliente: "Cliente",
  fornecedor: "Fornecedor",
  funcionario: "Funcionário",
  outro: "Outro",
};

export default function Portais() {
  const navigate = useNavigate();
  const { listQuery } = usePortals();
  const { toast } = useToast();
  const [usersOpen, setUsersOpen] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<import("@/hooks/usePortals").Portal | null>(null);

  if (listQuery.error) {
    toast({
      title: "Erro ao carregar portais",
      description: (listQuery.error as Error)?.message ?? "Tente novamente mais tarde.",
    });
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Portais</h2>
        <Button onClick={() => navigate("/portais/novo")}>Criar Portal</Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-base font-medium">Lista de Portais</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Portal</TableHead>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : listQuery.data && listQuery.data.length > 0 ? (
                  listQuery.data.map((portal) => (
                    <TableRow key={portal.id}>
                      <TableCell className="font-medium">{portal.name}</TableCell>
                      <TableCell>{({ cliente: "Cliente", fornecedor: "Fornecedor", funcionario: "Funcionário", outro: "Outro" } as any)[portal.stakeholder] ?? portal.stakeholder}</TableCell>
                      <TableCell>{(function(d?: string){ if (!d) return "-"; try { return new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});} catch { return d; } })(portal.created_at)}</TableCell>
                      <TableCell>
                        {portal.is_active ? (
                          <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPortal(portal);
                            setUsersOpen(true);
                          }}
                        >
                          Usuários
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhum portal encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedPortal && (
        <PortalUsersManager
          portal={selectedPortal}
          open={usersOpen}
          onOpenChange={(open) => {
            if (!open) {
              setUsersOpen(false);
              setSelectedPortal(null);
            } else {
              setUsersOpen(true);
            }
          }}
        />
      )}
    </PageLayout>
  );
}
