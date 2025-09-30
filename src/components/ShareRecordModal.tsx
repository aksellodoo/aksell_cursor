import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useProfiles } from "@/hooks/useProfiles";
import { useSharedRecords } from "@/hooks/useSharedRecords";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Share2, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordType: string;
  recordId: string;
  recordName: string;
}

const expiryOptions = [
  { value: 'never', label: 'Nunca expira' },
  { value: '1day', label: '1 dia' },
  { value: '1week', label: '1 semana' },
  { value: '1month', label: '1 mês' },
  { value: '3months', label: '3 meses' },
  { value: 'custom', label: 'Data personalizada' }
];

const conditionOptions = [
  { value: 'none', label: 'Sem condição específica' },
  { value: 'comment', label: 'Até fazer um comentário' },
  { value: 'file_upload', label: 'Até fazer upload de arquivo' },
  { value: 'approval', label: 'Até aprovar algo' },
  { value: 'task_completion', label: 'Até completar uma tarefa' }
];

export const ShareRecordModal = ({
  open,
  onOpenChange,
  recordType,
  recordId,
  recordName
}: ShareRecordModalProps) => {
  const { profiles, loading: profilesLoading } = useProfiles();
  const { shareRecord } = useSharedRecords();
  
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(['view']);
  const [expiryType, setExpiryType] = useState('never');
  const [customDate, setCustomDate] = useState('');
  const [expiryCondition, setExpiryCondition] = useState('none');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário para compartilhar');
      return;
    }

    try {
      setLoading(true);
      
      let expiresAt: string | undefined;
      
      if (expiryType === 'custom' && customDate) {
        expiresAt = new Date(customDate).toISOString();
      } else if (expiryType !== 'never') {
        const now = new Date();
        switch (expiryType) {
          case '1day':
            now.setDate(now.getDate() + 1);
            break;
          case '1week':
            now.setDate(now.getDate() + 7);
            break;
          case '1month':
            now.setMonth(now.getMonth() + 1);
            break;
          case '3months':
            now.setMonth(now.getMonth() + 3);
            break;
        }
        expiresAt = now.toISOString();
      }

      const expiryConditionData = expiryCondition !== 'none' ? {
        type: expiryCondition,
        notes
      } : undefined;

      await shareRecord(
        recordType,
        recordId,
        recordName,
        selectedUser,
        permissions,
        expiresAt,
        expiryConditionData
      );

      handleClose();
    } catch (error) {
      console.error('Error sharing record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser("");
    setSelectedUserName("");
    setPermissions(['view']);
    setExpiryType('never');
    setCustomDate('');
    setExpiryCondition('none');
    setNotes('');
    onOpenChange(false);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, permission]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  const filteredUsers = profiles.filter(profile => 
    profile.status === 'active' && profile.id !== selectedUser
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Registro
          </DialogTitle>
          <DialogDescription>
            Compartilhe o registro "{recordName}" com outro usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de usuário */}
          <div className="space-y-2">
            <Label>Compartilhar com</Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedUserName || "Selecione um usuário..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar usuário..." />
                  <CommandList>
                    <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                    <CommandGroup>
                      {filteredUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            setSelectedUser(user.id);
                            setSelectedUserName(user.name);
                            setUserSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUser === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {user.email} • {user.department}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Permissões */}
          <div className="space-y-2">
            <Label>Permissões</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="view"
                  checked={permissions.includes('view')}
                  onCheckedChange={(checked) => handlePermissionChange('view', !!checked)}
                />
                <Label htmlFor="view">Visualizar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit"
                  checked={permissions.includes('edit')}
                  onCheckedChange={(checked) => handlePermissionChange('edit', !!checked)}
                />
                <Label htmlFor="edit">Editar</Label>
              </div>
            </div>
          </div>

          {/* Expiração */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiração
            </Label>
            <Select value={expiryType} onValueChange={setExpiryType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expiryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {expiryType === 'custom' && (
              <Input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          {/* Condição de expiração */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Condição de expiração
            </Label>
            <Select value={expiryCondition} onValueChange={setExpiryCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Adicione observações sobre este compartilhamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!selectedUser || loading}
          >
            {loading ? 'Compartilhando...' : 'Compartilhar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};