
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";

type Item = {
  id: string;
  name: string;
};

interface SignatureListProps {
  items: Item[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export const SignatureList = ({
  items,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: SignatureListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const commitEdit = (id: string) => {
    const name = editingName.trim() || "Assinatura";
    onRename(id, name);
    setEditingId(null);
  };

  return (
    <Card className="p-3 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Minhas assinaturas</h3>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Nova
        </Button>
      </div>

      <div className="space-y-1 overflow-auto">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma assinatura criada ainda.</p>
        ) : (
          items.map((it) => {
            const isSelected = it.id === selectedId;
            const isEditing = editingId === it.id;
            return (
              <div
                key={it.id}
                className={`group flex items-center justify-between rounded-md border px-2 py-1.5 ${isSelected ? "bg-muted/50 border-primary/50" : ""}`}
              >
                <button
                  onClick={() => onSelect(it.id)}
                  className="text-left flex-1 pr-2"
                  title={it.name}
                >
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => commitEdit(it.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(it.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                    />
                  ) : (
                    <span className="truncate block">{it.name}</span>
                  )}
                </button>

                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-80">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(it.id, it.name)}
                      title="Renomear"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(it.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default SignatureList;
