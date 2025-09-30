import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUserEmailPreferences, EmailSyncUnit } from "@/hooks/useUserEmailPreferences";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editedUserId: string;
}

export const EmailSyncSettingsModal = ({ open, onOpenChange, editedUserId }: Props) => {
  const { prefs, loading, saveSyncSettings } = useUserEmailPreferences(editedUserId);
  const { toast } = useToast();

  const [value, setValue] = useState<number>(30);
  const [unit, setUnit] = useState<EmailSyncUnit>("days");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs) {
      setValue(prefs.email_sync_value ?? 30);
      setUnit((prefs.email_sync_unit as EmailSyncUnit) || "days");
    }
  }, [prefs]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveSyncSettings(Math.max(1, value || 1), unit);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a configuração.", variant: "destructive" });
    } else {
      toast({ title: "Configuração salva", description: "Preferências de sincronização atualizadas." });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuração dos emails</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sync-value">Quantidade</Label>
              <Input
                id="sync-value"
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value || "1", 10))}
                disabled={loading || saving}
              />
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as EmailSyncUnit)} disabled={loading || saving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Dias</SelectItem>
                  <SelectItem value="months">Meses</SelectItem>
                  <SelectItem value="years">Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Defina o período da sincronização inicial da sua caixa de entrada (Inbox). Ex.: ao definir 30 dias, a primeira sincronização buscará os emails da Inbox dos últimos 30 dias.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};