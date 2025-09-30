import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface VersionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  version: number;
}

export function VersionNotesModal({ isOpen, onClose, onConfirm, version }: VersionNotesModalProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes("");
    onClose();
  };

  const handleCancel = () => {
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Descrição das Alterações - Versão {version}</DialogTitle>
          <DialogDescription>
            Descreva as principais mudanças e melhorias desta nova versão do documento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="version-notes">Histórico de Mudanças</Label>
            <Textarea
              id="version-notes"
              placeholder="Ex: Correção de dados da seção 3, atualização de valores conforme novo regulamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!notes.trim()}>
            Confirmar Versão {version}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}