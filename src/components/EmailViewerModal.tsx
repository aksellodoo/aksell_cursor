
import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Loader2, Mail, X } from "lucide-react";
import DOMPurify from "dompurify";

interface EmailViewerModalProps {
  open: boolean;
  onClose: () => void;
  messageId: string;
}

interface EmailRecord {
  id: string;
  message_id: string;
  record_type: string;
  record_id: string;
  author_id: string;
  subject: string;
  html: string;
  to: string[] | null;
  cc: string[] | null;
  bcc: string[] | null;
  attachments: { name: string; size?: number; type?: string }[] | null;
  provider_message_id?: string | null;
  sent_at: string;
  created_at: string;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({ open, onClose, messageId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<EmailRecord | null>(null);

  useEffect(() => {
    if (!open || !messageId) return;
    let isCancelled = false;
    const fetchEmail = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("chatter_email_messages")
          .select("*")
          .eq("message_id", messageId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: "Não encontrado",
            description: "Não foi possível localizar o conteúdo deste email.",
            variant: "destructive",
          });
          return;
        }
        if (!isCancelled) setEmail(data as EmailRecord);
      } catch (e: any) {
        console.error("Erro ao carregar email:", e);
        toast({
          title: "Erro",
          description: e?.message || "Falha ao carregar o email",
          variant: "destructive",
        });
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchEmail();
    return () => {
      isCancelled = true;
    };
  }, [open, messageId, toast]);

  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(email?.html || "");
  }, [email?.html]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[96vw] max-w-[1100px] h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span className="font-semibold">
                {email?.subject || "Visualizar email"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {email?.provider_message_id && (
                <Button variant="ghost" size="sm" className="h-8" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ID: {email.provider_message_id}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="px-6 py-3 border-b text-sm">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando email...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Para:</span>
                  {(email?.to || []).map((addr) => (
                    <Badge key={addr} variant="secondary">{addr}</Badge>
                  ))}
                </div>
                {(email?.cc && email.cc.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-muted-foreground">Cc:</span>
                    {email.cc.map((addr) => (
                      <Badge key={addr} variant="outline">{addr}</Badge>
                    ))}
                  </div>
                )}
                {(email?.bcc && email.bcc.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-muted-foreground">Cco:</span>
                    {email.bcc.map((addr) => (
                      <Badge key={addr} variant="outline">{addr}</Badge>
                    ))}
                  </div>
                )}
                {email?.sent_at && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Enviado em {new Date(email.sent_at).toLocaleString("pt-BR")}
                  </div>
                )}
                <Separator className="my-3" />
              </>
            )}
          </div>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando conteúdo...
                </div>
              ) : email ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Conteúdo indisponível.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailViewerModal;
