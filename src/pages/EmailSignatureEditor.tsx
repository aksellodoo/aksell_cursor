
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import EmailHtmlEditor from "@/components/ui/email-html-editor";
import DOMPurify from "dompurify";
import { ArrowLeft, Save, Eye, Code2, Plus, Trash2 } from "lucide-react";
import { SignatureList } from "@/components/signatures/SignatureList";
import { SignatureTargetsSelector } from "@/components/signatures/SignatureTargetsSelector";
import { Input } from "@/components/ui/input";
import { useUserSignatures } from "@/hooks/useUserSignatures";

const EmailSignatureEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSelf = !!user && user.id === id;
  const { toast } = useToast();
  const goBack = () => navigate(id ? `/usuarios/${id}/edit` : "/usuarios");

  const {
    signatures,
    loading,
    saving,
    createSignature,
    updateSignature,
    deleteSignature,
    setTargets,
    refresh,
    hasAnySignature,
  } = useUserSignatures(id);

  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [msIds, setMsIds] = useState<string[]>([]);
  const [sharedIds, setSharedIds] = useState<string[]>([]);

  const isComplexEmailHtml = (str: string) => /<(table|tr|td|th|tbody|thead|tfoot|style|img)[\s>]/i.test(str) || /style=\s*"[^"]+"/i.test(str);
  const handleSetMode = (m: "visual" | "html") => {
    if (m === "visual" && isComplexEmailHtml(html)) {
      toast({
        title: "Atenção",
        description: "Conteúdo complexo detectado (tabelas/estilos). O modo Visual pode reformatar o HTML.",
      });
    }
    setMode(m);
    try { localStorage.setItem("emailSignatureEditorMode", m); } catch {}
  };

  useEffect(() => {
    document.title = "Gerenciar assinaturas | Aksell";
    // Preferência do usuário
    try {
      const saved = localStorage.getItem("emailSignatureEditorMode");
      if (saved === "visual" || saved === "html") setMode(saved as any);
    } catch {}
  }, []);

  useEffect(() => {
    // Se o HTML é complexo, abrir em HTML por padrão para evitar quebras
    if (html && isComplexEmailHtml(html) && mode === "visual") {
      setMode("html");
    }
  }, [html, mode]);

  useEffect(() => {
    if (signatures.length && !selectedId) {
      setSelectedId(signatures[0].id);
    }
  }, [signatures, selectedId]);

  useEffect(() => {
    const current = signatures.find((s) => s.id === selectedId);
    if (!current) return;
    setName(current.name || "Assinatura");
    setHtml(current.html || "");
    setMsIds((current.targets || []).filter((t) => t.microsoft_account_id).map((t) => t.microsoft_account_id!) );
    setSharedIds((current.targets || []).filter((t) => t.shared_mailbox_id).map((t) => t.shared_mailbox_id!) );
  }, [selectedId, signatures]);

  const sanitized = useMemo(() => DOMPurify.sanitize(html || "", {
    ADD_TAGS: ["table","thead","tbody","tfoot","tr","td","th","img","span","div","style"],
    ADD_ATTR: ["style","align","valign","cellpadding","cellspacing","border","width","height","alt","src","href","target","rel"],
    ALLOW_DATA_ATTR: true,
  }), [html]);

  const handleCreate = async () => {
    if (!isSelf) {
      toast({ title: "Ação não permitida", description: "Somente o próprio usuário pode criar assinaturas.", variant: "destructive" });
      return;
    }
    const { data, error } = await createSignature("Assinatura");
    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar a assinatura.", variant: "destructive" });
      return;
    }
    if (data?.id) setSelectedId(data.id);
  };

  const handleSave = async () => {
    if (!isSelf || !selectedId) {
      toast({ title: "Ação não permitida", description: "Somente o próprio usuário pode salvar a assinatura.", variant: "destructive" });
      return;
    }
    const ops = [];
    ops.push(updateSignature(selectedId, { name: name?.trim() || "Assinatura", html: html || "" }));
    ops.push(setTargets(selectedId, { microsoftIds: msIds, sharedIds: sharedIds }));
    const results = await Promise.all(ops);
    const anyError = results.find((r: any) => r?.error)?.error;
    if (anyError) {
      toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    } else {
      toast({ title: "Salvo", description: "Assinatura atualizada com sucesso." });
      await refresh();
    }
  };

  const handleDelete = async () => {
    if (!isSelf || !selectedId) return;
    if (!confirm("Excluir esta assinatura?")) return;
    const { error } = await deleteSignature(selectedId);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir a assinatura.", variant: "destructive" });
    } else {
      toast({ title: "Excluída", description: "Assinatura removida." });
      setSelectedId(null);
    }
  };

  if (!isSelf) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6 space-y-4">
          <p className="text-foreground">Somente o próprio usuário pode editar as próprias assinaturas.</p>
          <div className="flex justify-end">
            <Button onClick={goBack}>Voltar</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Assinaturas de email</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={mode === "visual" ? "default" : "outline"} onClick={() => handleSetMode("visual")}>
            <Eye className="h-4 w-4 mr-2" /> Visual
          </Button>
          <Button variant={mode === "html" ? "default" : "outline"} onClick={() => handleSetMode("html")}>
            <Code2 className="h-4 w-4 mr-2" /> HTML
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !selectedId}>
            <Save className="h-4 w-4 mr-2" /> Salvar
          </Button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-auto">
        <aside className="lg:col-span-3">
          <SignatureList
            items={signatures.map((s) => ({ id: s.id, name: s.name }))}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={handleCreate}
            onDelete={handleDelete}
            onRename={(id, newName) => updateSignature(id, { name: newName })}
          />
        </aside>

        <section className="lg:col-span-9 space-y-4">
          {!hasAnySignature ? (
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Você ainda não tem assinaturas</h2>
                  <p className="text-sm text-muted-foreground">
                    Crie sua primeira assinatura para aplicá-la à sua conta do Office 365 ou às suas Caixas Compartilhadas.
                  </p>
                </div>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar assinatura
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium">Nome da assinatura</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: Assinatura principal"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end gap-2">
                    <Button variant="outline" onClick={handleDelete} disabled={!selectedId}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">Editor</h2>
                  {mode === "visual" ? (
                    <EmailHtmlEditor key={`${mode}-${selectedId ?? 'new'}`} value={html} onChange={setHtml} placeholder="Crie sua assinatura..." />
                  ) : (
                    <Card className="p-3">
                      <textarea
                        value={html}
                        onChange={(e) => setHtml(e.target.value)}
                        className="w-full h-[520px] resize-vertical bg-background text-foreground border rounded p-3 font-mono text-sm"
                        placeholder="Cole ou escreva sua assinatura em HTML"
                      />
                    </Card>
                  )}
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">Pré-visualização</h2>
                  <Card className="p-4 overflow-auto min-h-[560px]">
                    <div
                      className="max-w-none"
                      style={{ color: "hsl(var(--foreground))" }}
                      dangerouslySetInnerHTML={{ __html: sanitized }}
                    />
                  </Card>
                </section>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SignatureTargetsSelector
                  userId={id!}
                  selectedMicrosoftIds={msIds}
                  selectedSharedIds={sharedIds}
                  onChange={(ms, shared) => {
                    setMsIds(ms);
                    setSharedIds(shared);
                  }}
                />
                <Card className="p-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Como funciona</h3>
                    <p className="text-sm text-muted-foreground">
                      A assinatura será aplicada automaticamente ao enviar emails pela conta ou caixa selecionada.
                      Você pode criar múltiplas assinaturas e associar cada uma a destinos diferentes.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dica: Você pode alternar entre editor Visual e HTML a qualquer momento.
                    </p>
                  </div>
                </Card>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default EmailSignatureEditor;
