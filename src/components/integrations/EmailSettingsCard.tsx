import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Settings2, PenLine, Mail } from "lucide-react";
import { EmailSyncSettingsModal } from "@/components/integrations/EmailSyncSettingsModal";
import { useNavigate } from "react-router-dom";

interface Props {
  editedUserId: string;
}

export const EmailSettingsCard = ({ editedUserId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSync, setShowSync] = useState(false);
  const navigate = useNavigate();

  const isSelf = !!user && user.id === editedUserId;

  const handleOpenSignature = () => {
    if (!isSelf) {
      toast({
        title: "Ação não permitida",
        description: "Somente o próprio usuário pode editar a assinatura.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/usuarios/${editedUserId}/assinatura-email`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurações de Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowSync(true)} disabled={!isSelf}>
              <Settings2 className="h-4 w-4 mr-2" />
              Preferências de sincronização
            </Button>
            <Button variant="default" size="sm" onClick={handleOpenSignature} disabled={!isSelf}>
              <PenLine className="h-4 w-4 mr-2" />
              Editar assinatura de email
            </Button>
          </div>
          {!isSelf && (
            <p className="text-xs text-muted-foreground">
              Somente o próprio usuário pode alterar estas configurações.
            </p>
          )}
        </CardContent>
      </Card>

      {isSelf && (
        <EmailSyncSettingsModal open={showSync} onOpenChange={setShowSync} editedUserId={editedUserId} />
      )}
    </>
  );
};
