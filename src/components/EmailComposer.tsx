import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useMicrosoftAccount } from "@/hooks/useMicrosoftAccount";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Paperclip, Send, X, Inbox, UserCircle2, Wand2, Smile, Image as ImageIcon, Calendar as CalendarIcon, Tag as TagIcon, Trash2, Maximize2, Minimize2, FileText } from "lucide-react";
import EmailHtmlEditor from "@/components/ui/email-html-editor";
import { useUserEmailPreferences } from "@/hooks/useUserEmailPreferences";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import DOMPurify from "dompurify";
import { useUserSignatures } from "@/hooks/useUserSignatures";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmojiPicker } from "@/components/EmojiPicker";
import { GifPicker } from "@/components/GifPicker";
import { useEmailDraft } from "@/hooks/useEmailDraft";
import { useEmailTags } from "@/hooks/useEmailTags";
import { useProfiles } from "@/hooks/useProfiles";

interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  recordType: string;
  recordId: string;
  onSent?: () => void;
}

interface AttachmentPreview {
  file: File;
  name: string;
  size: number;
  type: string;
}

type SharedMailbox = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
};

type SenderSelection = {
  type: "me" | "shared";
  id?: string; // microsoft_account_id or shared_mailbox_id
  email?: string;
  name?: string | null;
};

const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

function stripHtml(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

const ChipsInput: React.FC<{
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}> = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = useCallback((raw: string) => {
    const parts = raw
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    const newOnes = parts.filter((p) => emailRegex.test(p));
    if (newOnes.length) {
      const merged = Array.from(new Set([...values, ...newOnes]));
      onChange(merged);
      setInput("");
    }
  }, [values, onChange]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === ";") && input.trim()) {
      e.preventDefault();
      addEmail(input);
    }
    if (e.key === "Backspace" && !input && values.length) {
      const clone = [...values];
      clone.pop();
      onChange(clone);
    }
  };

  return (
    <div className="min-h-10 flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      {values.map((v) => (
        <Badge key={v} variant="secondary" className="flex items-center gap-1">
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="ml-1 opacity-70 hover:opacity-100"
            aria-label={`Remover ${v}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        className="flex-1 outline-none bg-transparent text-sm"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => input && addEmail(input)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export const EmailComposer: React.FC<EmailComposerProps> = ({ open, onClose, recordType, recordId, onSent }) => {
  const { user } = useAuth();
  const { account, loading: loadingAccount } = useMicrosoftAccount(user?.id);
  const { prefs, loading: loadingPrefs } = useUserEmailPreferences(user?.id);
  const { signatures, loading: loadingSigs } = useUserSignatures(user?.id);

  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [saveToSent, setSaveToSent] = useState(true);
  const [bccMe, setBccMe] = useState(false);
  const [sending, setSending] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(true);

  // Toolbar e viewport
  const [showToolbar, setShowToolbar] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rascunho e tags
  const { draft, updateDraft, deleteDraft, addShare, removeShare, listShares } = useEmailDraft(open);
  const { tags, createTag } = useEmailTags();
  const { profiles } = useProfiles();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");

  // Compartilhamento
  const [shares, setShares] = useState<any[]>([]);
  const [shareUserId, setShareUserId] = useState<string>("");

  // Emitente e assinaturas
  const [mailboxes, setMailboxes] = useState<SharedMailbox[]>([]);
  const [sender, setSender] = useState<SenderSelection | null>(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string | "none">("none");
  // Exibição de campos Cc/Cco inline com Para
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [signatureManuallyChosen, setSignatureManuallyChosen] = useState(false);

  // Carregar tags e compartilhamentos do rascunho
  React.useEffect(() => {
    const load = async () => {
      if (!draft?.id) return;
      const { data: tagRows } = await supabase
        .from("email_draft_tags")
        .select("tag_id")
        .eq("draft_id", draft.id);
      setSelectedTagIds((tagRows || []).map((r: any) => r.tag_id));
      try {
        const s = await listShares();
        setShares(s as any);
      } catch {
        setShares([]);
      }
    };
    load();
  }, [draft?.id, listShares]);

  // Buscar caixas compartilhadas do usuário quando abrir
  React.useEffect(() => {
    const run = async () => {
      if (!open || !user?.id) return;
      const { data, error } = await supabase
        .from("microsoft_shared_mailboxes")
        .select("id, user_id, display_name, email")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.warn("Erro ao buscar caixas compartilhadas:", error);
        setMailboxes([]);
      } else {
        setMailboxes((data || []) as any);
      }
    };
    run();
  }, [open, user?.id]);

  // Definir emitente padrão como "minha conta"
  React.useEffect(() => {
    if (!open) return;
    if (account?.id && account.email) {
      setSender({ type: "me", id: account.id, email: account.email, name: (account as any).display_name || account.email });
    }
  }, [open, account?.id, account?.email]);

  // Auto-selecionar assinatura com base no emitente (se o usuário não escolheu manualmente)
  React.useEffect(() => {
    if (signatureManuallyChosen) return;
    let auto: string | "none" = "none";
    if (sender?.type === "shared" && sender.id) {
      const match = signatures.find((s) => (s.targets || []).some((t) => t.shared_mailbox_id === sender.id));
      if (match) auto = match.id;
    } else if (sender?.type === "me" && account?.id) {
      const match = signatures.find((s) => (s.targets || []).some((t) => t.microsoft_account_id === account.id));
      if (match) auto = match.id;
    }
    setSelectedSignatureId(auto);
  }, [sender, signatures, account?.id, signatureManuallyChosen]);

  const selectedSignatureHtml = useMemo(() => {
    // Se o usuário escolheu manualmente
    if (signatureManuallyChosen && selectedSignatureId && selectedSignatureId !== "none") {
      const sig = signatures.find((s) => s.id === selectedSignatureId);
      return sig?.html || "";
    }
    // Usar auto-selecionada se houver
    if (selectedSignatureId && selectedSignatureId !== "none") {
      const sig = signatures.find((s) => s.id === selectedSignatureId);
      if (sig?.html) return sig.html;
    }
    // Fallback para preferência antiga (se existir)
    return prefs?.signature_html || "";
  }, [signatureManuallyChosen, selectedSignatureId, signatures, prefs?.signature_html]);

  const sanitizedSignature = useMemo(() => DOMPurify.sanitize(selectedSignatureHtml || ""), [selectedSignatureHtml]);

  // Normaliza a assinatura para alinhamento à esquerda
  const leftAlignSignature = (htmlSig: string): string => {
    if (!htmlSig) return "";
    let h = htmlSig;
    // Remove <center> wrappers
    h = h.replace(/<\s*center\s*>/gi, "").replace(/<\s*\/\s*center\s*>/gi, "");
    // Força align="left" onde houver align="center"
    h = h.replace(/align\s*=\s*["']?\s*center\s*["']?/gi, 'align="left"');
    // text-align: center -> left
    h = h.replace(/text-align\s*:\s*center/gi, "text-align: left");
    // Classes utilitárias comuns
    h = h.replace(/\btext-center\b/gi, "text-left");
    // Margens que centralizam
    h = h.replace(/margin\s*:\s*0\s*auto/gi, "margin: 0");
    h = h.replace(/margin-left\s*:\s*auto/gi, "margin-left: 0");
    h = h.replace(/margin-right\s*:\s*auto/gi, "margin-right: 0");
    // Garante contêiner com alinhamento à esquerda
    return `<div style="text-align:left">${h}</div>`;
  };

  const leftAlignedSignature = useMemo(() => leftAlignSignature(sanitizedSignature || ""), [sanitizedSignature]);

  // Assinatura dentro do editor
  const SIG_START = "<!--SIG_START-->";
  const SIG_END = "<!--SIG_END-->";

  const removeSignatureBlock = (content: string): string => {
    if (!content) return "";
    return content
      .replace(new RegExp(`${SIG_START}[\\s\\S]*?${SIG_END}`, "g"), "")
      .replace(/\s+$/, "");
  };

  const insertOrReplaceSignature = (content: string, sigHtml: string): string => {
    const base = removeSignatureBlock(content || "");
    const sigBlock = `${SIG_START}${sigHtml}${SIG_END}`;
    const hasText = stripHtml(base).length > 0;
    const sep = "<p><br/></p>";
    return hasText ? `${base}${sep}${sigBlock}` : `${sep}${sigBlock}`;
  };


  React.useEffect(() => {
    setHtml((prev) => {
      if (!includeSignature) {
        return removeSignatureBlock(prev || "");
      }
      const sig = leftAlignedSignature?.trim();
      if (!sig) {
        return removeSignatureBlock(prev || "");
      }
      return insertOrReplaceSignature(prev || "", sig);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSignature, leftAlignedSignature]);

  const totalSize = useMemo(() => attachments.reduce((acc, a) => acc + a.size, 0), [attachments]);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).map((f) => ({ file: f, name: f.name, size: f.size, type: f.type }));
    const overLimit = list.find((f) => f.size > 10 * 1024 * 1024);
    if (overLimit) {
      toast({ title: "Erro", description: `O anexo ${overLimit.name} excede 10MB.`, variant: "destructive" });
      return;
    }
    const newTotal = totalSize + list.reduce((a, b) => a + b.size, 0);
    if (newTotal > 20 * 1024 * 1024) {
      toast({ title: "Erro", description: "Tamanho total de anexos excede 20MB.", variant: "destructive" });
      return;
    }
    setAttachments((prev) => [...prev, ...list]);
  };

  const removeAttachment = (name: string) => setAttachments((prev) => prev.filter((a) => a.name !== name));

  // Inserções no editor
  const insertEmoji = (emoji: string) => {
    const quill = quillRef.current;
    if (quill && typeof quill.getSelection === "function") {
      const range = quill.getSelection(true);
      const index = range ? range.index : (html?.length || 0);
      quill.insertText(index, emoji, "user");
      quill.setSelection(index + emoji.length, 0, "user");
    } else {
      setHtml((prev) => (prev || "") + emoji);
    }
    setShowToolbar(true);
  };

  const insertGif = (url: string) => {
    const quill = quillRef.current;
    if (quill && typeof quill.getSelection === "function") {
      const range = quill.getSelection(true);
      const index = range ? range.index : (html?.length || 0);
      quill.insertEmbed(index, "image", url, "user");
      quill.setSelection(index + 1, 0, "user");
    } else {
      setHtml((prev) => `${prev || ""}<p><img src="${url}" alt="GIF" /></p>`);
    }
    setShowToolbar(true);
  };

  // Tags no rascunho
  const toggleTag = async (tagId: string) => {
    if (!draft?.id) return;
    if (selectedTagIds.includes(tagId)) {
      await supabase.from("email_draft_tags").delete().eq("draft_id", draft.id).eq("tag_id", tagId);
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      await supabase.from("email_draft_tags").insert({ draft_id: draft.id, tag_id: tagId });
      setSelectedTagIds((prev) => Array.from(new Set([...prev, tagId])));
    }
  };

  const handleSend = async () => {
    if (!user) return;
    if (!account?.email) {
      toast({ title: "Erro", description: "Conecte sua conta Microsoft para enviar emails.", variant: "destructive" });
      return;
    }
    if (!to.length) {
      toast({ title: "Erro", description: "Informe pelo menos um destinatário em Para.", variant: "destructive" });
      return;
    }
    if (!subject.trim()) {
      toast({ title: "Erro", description: "Assunto é obrigatório.", variant: "destructive" });
      return;
    }

    try {
      setSending(true);

      const allBcc = bccMe && account.email ? Array.from(new Set([...bcc, account.email])) : bcc;

      // Converter anexos para base64 para envio
      const attachmentsPayload = await Promise.all(
        attachments.map(
          (att) =>
            new Promise<{ name: string; contentType: string; contentBytes: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.includes(",") ? result.split(",")[1] : result;
                resolve({ name: att.name, contentType: att.type || "application/octet-stream", contentBytes: base64 });
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(att.file);
            })
        )
      );

      const finalHtml = html;

      const payload = {
        to,
        cc,
        bcc: allBcc,
        subject,
        html: finalHtml,
        attachments: attachmentsPayload,
        saveToSentItems: saveToSent,
        sender: sender ? { type: sender.type, email: sender.email, name: sender.name || undefined } : undefined,
      };

      const { data: sendResp, error } = await supabase.functions.invoke("ms-send-email", { body: payload });
      if (error) {
        console.error("ms-send-email error:", error);
        const friendly = error.message?.includes("Failed to send a request to the Edge Function")
          ? "Não foi possível contatar o serviço de envio. Tente novamente em instantes."
          : error.message || "Falha ao enviar email";
        throw new Error(friendly);
      }

      // 1) Registrar mensagem RESUMO no chatter (sem corpo do email)
      const fromStr = sender?.type === "shared" && sender?.email ? `${sender?.name || sender.email} <${sender.email}>` : `${(account as any)?.display_name || account?.email} <${account?.email}>`;
      const summaryText = `De: ${fromStr}\nPara: ${to.join(", ")}`;
      const { data: msgRow, error: insertMsgErr } = await supabase
        .from("chatter_messages")
        .insert({
          record_type: recordType,
          record_id: recordId,
          author_id: user.id,
          message_type: "external",
          subject,
          message: summaryText,
          attachments: attachments.map((a) => ({ name: a.name, size: a.size, type: a.type })),
        })
        .select("id")
        .single();

      if (insertMsgErr) {
        console.warn("Falha ao registrar resumo no chatter:", insertMsgErr);
      } else if (msgRow?.id) {
        // 2) Armazenar email completo na chatter_email_messages
        const providerId = (sendResp as any)?.id || (sendResp as any)?.messageId || null;
        const { error: emailStoreErr } = await supabase.from("chatter_email_messages").insert({
          message_id: msgRow.id,
          record_type: recordType,
          record_id: recordId,
          author_id: user.id,
          subject,
          html: finalHtml,
          to,
          cc,
          bcc: allBcc,
          attachments: attachments.map((a) => ({ name: a.name, size: a.size, type: a.type })),
          provider_message_id: providerId,
        });
        if (emailStoreErr) {
          console.warn("Falha ao salvar conteúdo completo do email:", emailStoreErr);
        }
      }

      toast({ title: "Sucesso", description: "Email enviado com sucesso!" });
      onSent?.();
      onClose();

      // Resetar campos
      setTo([]); setCc([]); setBcc([]); setSubject(""); setHtml(""); setAttachments([]); setBccMe(false); setSaveToSent(true);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro", description: err?.message || "Erro ao enviar email", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={isFullScreen ? "w-screen h-screen max-w-none rounded-none p-0" : "w-full max-w-5xl h-[80vh] p-0 sm:rounded-lg"}>
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                <span className="font-semibold">Novo Email</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">De:</span>
                  <Select
                    value={sender?.type === "shared" ? `shared:${sender?.id}` : "me"}
                    onValueChange={(val) => {
                      if (val === "me" && account?.id && account.email) {
                        setSender({ type: "me", id: account.id, email: account.email, name: (account as any).display_name || account.email });
                        setSignatureManuallyChosen(false);
                      } else if (val.startsWith("shared:")) {
                        const id = val.split(":")[1];
                        const mb = mailboxes.find((m) => m.id === id);
                        if (mb) {
                          setSender({ type: "shared", id: mb.id, email: mb.email, name: mb.display_name });
                          setSignatureManuallyChosen(false);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 min-w-[260px]">
                      <SelectValue placeholder={loadingAccount ? "Carregando..." : "Selecionar emitente"} />
                    </SelectTrigger>
                    <SelectContent>
                      {account?.id && account.email && (
                        <SelectItem value="me">Minha conta — {(account as any).display_name || account.email}</SelectItem>
                      )}
                      {mailboxes.map((mb) => (
                        <SelectItem key={mb.id} value={`shared:${mb.id}`}>
                          {mb.display_name} — {mb.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!loadingAccount && !account?.email && (
                    <Badge variant="destructive">Conecte sua conta em Usuários</Badge>
                  )}
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">Outras configurações</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[420px]">
                    <div className="space-y-3 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={saveToSent} onChange={(e) => setSaveToSent(e.target.checked)} />
                        Salvar em Itens Enviados
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={bccMe} onChange={(e) => setBccMe(e.target.checked)} />
                        Enviar cópia para mim
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeSignature}
                            onChange={(e) => setIncludeSignature(e.target.checked)}
                            disabled={(loadingPrefs && !selectedSignatureHtml) || loadingSigs}
                          />
                          Incluir assinatura
                        </label>
                        <Select
                          value={selectedSignatureId}
                          onValueChange={(val) => {
                            setSelectedSignatureId(val as any);
                            setSignatureManuallyChosen(true);
                          }}
                          disabled={!includeSignature || loadingSigs}
                        >
                          <SelectTrigger className="h-8 min-w-[200px]">
                            <SelectValue placeholder="Selecione a assinatura" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {signatures.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(selectedSignatureHtml?.trim()?.length || 0) > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground mb-1">Pré-visualização da assinatura</div>
                          <div className="rounded-md border border-border bg-muted/20 p-3 text-sm max-h-48 overflow-auto">
                            <div dangerouslySetInnerHTML={{ __html: sanitizedSignature }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="mx-2 h-5" />
                <Button variant="outline" onClick={onClose} disabled={sending}>
                  Cancelar
                </Button>
                <Button onClick={handleSend} disabled={sending || !account?.email}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>


          {/* Toolbar */}
          <div className="px-6 py-2 border-b flex items-center justify-between bg-background">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setShowToolbar((v) => !v)} aria-label="Alternar barra de formatação">
                <Wand2 className="h-4 w-4 mr-1" />
                {showToolbar ? "Ocultar barra" : "Mostrar barra"}
              </Button>
              <Button variant="ghost" size="sm" aria-label="Anexar arquivos" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }} />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Inserir emoji">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <EmojiPicker onSelect={(e) => insertEmoji(e)} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Inserir GIF">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <GifPicker onInsert={(url) => insertGif(url)} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Tags">
                    <TagIcon className="h-4 w-4 mr-1" />
                    Tags
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => toggleTag(t.id)}
                          className={`px-2 py-1 text-xs rounded border ${selectedTagIds.includes(t.id) ? 'bg-primary/10 border-primary' : 'bg-background border-border'}`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Nova tag"
                        className="h-8"
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const created = await createTag(newTagName.trim());
                          if (created?.id) {
                            await toggleTag(created.id);
                            setNewTagName("");
                          }
                        }}
                        disabled={!newTagName.trim()}
                      >
                        Criar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label="Compartilhar rascunho">
                    <UserCircle2 className="h-4 w-4 mr-1" />
                    Compartilhar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Quem pode editar:</div>
                    <div className="flex flex-col gap-2">
                      {shares.length === 0 && <div className="text-sm text-muted-foreground">Sem compartilhamentos</div>}
                      {shares.map((s: any) => {
                        const p = profiles.find((pr: any) => pr.id === s.user_id);
                        return (
                          <div key={s.id} className="flex items-center justify-between text-sm">
                            <span>{p?.name || s.user_id}</span>
                            <Button variant="ghost" size="icon" onClick={async () => { await removeShare(s.user_id); setShares(await listShares() as any); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={shareUserId} onValueChange={setShareUserId}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecionar usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles
                            .filter((p: any) => p.id !== user?.id && !shares.find((s: any) => s.user_id === p.id))
                            .map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name || p.email}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!shareUserId) return;
                          await addShare(shareUserId);
                          setShareUserId("");
                          setShares(await listShares() as any);
                        }}
                        disabled={!shareUserId}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" aria-label="Alternar tela cheia" onClick={() => setIsFullScreen((v) => !v)}>
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Form */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <Label className="col-span-1 text-right text-sm text-muted-foreground">Para</Label>
                  <div className="col-span-11 flex items-center gap-2">
                    <div className="flex-1">
                      <ChipsInput values={to} onChange={setTo} placeholder="email@empresa.com, outro@dominio.com" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowCc((v) => !v)}
                    >
                      Cc
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowBcc((v) => !v)}
                    >
                      Cco
                    </Button>
                  </div>
                </div>
              {(showCc || cc.length > 0) && (
                <div className="grid grid-cols-12 gap-3 items-center">
                  <Label className="col-span-1 text-right text-sm text-muted-foreground">Cc</Label>
                  <div className="col-span-11">
                    <ChipsInput values={cc} onChange={setCc} placeholder="(opcional)" />
                  </div>
                </div>
              )}
              {(showBcc || bcc.length > 0) && (
                <div className="grid grid-cols-12 gap-3 items-center">
                  <Label className="col-span-1 text-right text-sm text-muted-foreground">Cco</Label>
                  <div className="col-span-11">
                    <ChipsInput values={bcc} onChange={setBcc} placeholder="(opcional)" />
                  </div>
                </div>
              )}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <Label className="col-span-1 text-right text-sm text-muted-foreground">Assunto</Label>
                  <div className="col-span-11">
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do email" />
                  </div>
                </div>

<Card>
                <CardContent className="p-0">
                  <EmailHtmlEditor
                    value={html}
                    onChange={setHtml}
                    placeholder="Escreva sua mensagem..."
                    height={isFullScreen ? 480 : 280}
                  />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
