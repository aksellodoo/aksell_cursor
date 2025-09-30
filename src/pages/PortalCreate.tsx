
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLayout } from "@/components/PageLayout";
import { usePortals } from "@/hooks/usePortals";
import type { PortalStakeholder } from "@/hooks/usePortals";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PortalUsersDraftManager, type DraftPortalUser } from "@/components/PortalUsersDraftManager";

const schema = z.object({
  name: z.string().min(2, "Informe um nome válido").max(200, "Máximo de 200 caracteres"),
  stakeholder: z.enum(["cliente", "fornecedor", "funcionario", "outro"], {
    required_error: "Selecione o stakeholder",
  }),
});

type FormValues = z.infer<typeof schema>;

export default function PortalCreate() {
  const navigate = useNavigate();
  const { createMutation } = usePortals();
  const { toast } = useToast();
  const [draftUsers, setDraftUsers] = useState<DraftPortalUser[]>([]);
  const [draftOpen, setDraftOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      stakeholder: undefined as unknown as FormValues["stakeholder"],
    },
  });

  const onSubmit = async (values: FormValues) => {
    createMutation.mutate(
      { name: values.name, stakeholder: values.stakeholder as PortalStakeholder },
      {
        onSuccess: async (portal) => {
          try {
            if (draftUsers.length > 0) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const payload = draftUsers.map((u) => ({
                  portal_id: portal.id,
                  name: u.name,
                  email: u.email,
                  is_active: true,
                  created_by: user.id,
                }));
                const { error } = await supabase.from("portal_users").insert(payload);
                if (error) {
                  toast({ title: "Portal criado", description: `Erro ao salvar usuários: ${error.message}` });
                } else {
                  toast({ title: "Portal criado com sucesso", description: `${draftUsers.length} usuário(s) adicionados.` });
                }
              } else {
                toast({ title: "Portal criado", description: "Não foi possível autenticar para salvar usuários." });
              }
            } else {
              toast({ title: "Portal criado com sucesso" });
            }
          } catch (e) {
            const msg = (e as Error)?.message ?? "Erro desconhecido ao salvar usuários";
            toast({ title: "Portal criado", description: msg });
          } finally {
            navigate("/portais");
          }
        },
        onError: (err) => {
          toast({
            title: "Não foi possível criar o portal",
            description:
              (err as Error)?.message ||
              "Verifique se você tem permissão (admin/diretor) e tente novamente.",
          });
        },
      }
    );
  };

  // Fullscreen layout minimalista
  return (
    <div className="min-h-svh bg-background flex flex-col">
      <div className="border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center gap-3">
          <h1 className="text-lg md:text-xl font-semibold">Criar Portal</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/portais")} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => setDraftOpen(true)} disabled={createMutation.isPending}>
              Usuários ({draftUsers.length})
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      <PageLayout containerClassName="max-w-3xl">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Portal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Portal do Cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stakeholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stakeholder</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </PageLayout>

      <PortalUsersDraftManager
        open={draftOpen}
        onOpenChange={setDraftOpen}
        users={draftUsers}
        onUsersChange={setDraftUsers}
      />
    </div>
  );
}

