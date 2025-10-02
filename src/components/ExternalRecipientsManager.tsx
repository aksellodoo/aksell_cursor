import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Mail, User, Key, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ContactsPickerModal } from './ContactsPickerModal';
import { useContacts, Contact } from '@/hooks/useContacts';

interface ExternalRecipient {
  name: string;
  email: string;
}

interface ExternalRecipientsManagerProps {
  mode?: 'manual' | 'contacts';
  recipients?: ExternalRecipient[];
  selectedContactIds?: string[];
  onChange?: (recipients: ExternalRecipient[]) => void;
  onContactsChange?: (contactIds: string[]) => void;
}

export const ExternalRecipientsManager = ({
  mode = 'manual',
  recipients = [],
  selectedContactIds = [],
  onChange,
  onContactsChange
}: ExternalRecipientsManagerProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContactsPickerOpen, setIsContactsPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newRecipient, setNewRecipient] = useState<ExternalRecipient>({
    name: '',
    email: ''
  });

  const { contacts } = useContacts();

  // Get selected contacts data
  const selectedContacts = contacts.filter(c => selectedContactIds.includes(c.id));


  const validateRecipient = (recipient: ExternalRecipient) => {
    if (!recipient.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    if (!recipient.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
      toast.error('Email inválido');
      return false;
    }

    // Check for duplicate email
    const isDuplicate = recipients.some((r, index) => 
      r.email.toLowerCase() === recipient.email.toLowerCase() && 
      index !== editingIndex
    );
    if (isDuplicate) {
      toast.error('Email já existe na lista');
      return false;
    }

    return true;
  };

  const handleSaveRecipient = () => {
    if (!validateRecipient(newRecipient)) return;

    if (editingIndex !== null) {
      // Edit existing
      const updatedRecipients = [...recipients];
      updatedRecipients[editingIndex] = { ...newRecipient };
      onChange(updatedRecipients);
      toast.success('Destinatário atualizado');
    } else {
      // Add new
      onChange([...recipients, { ...newRecipient }]);
      toast.success('Destinatário adicionado');
    }

    handleCloseModal();
  };

  const handleDeleteRecipient = (index: number) => {
    const updatedRecipients = recipients.filter((_, i) => i !== index);
    onChange(updatedRecipients);
    toast.success('Destinatário removido');
  };

  const handleEditRecipient = (index: number) => {
    setEditingIndex(index);
    setNewRecipient({ ...recipients[index] });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingIndex(null);
    setNewRecipient({ name: '', email: '' });
  };

  const importFromCSV = () => {
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const newRecipients: ExternalRecipient[] = [];
          
          for (let i = 1; i < lines.length; i++) { // Skip header
            const [name, email] = lines[i].split(',');
            if (name && email) {
              newRecipients.push({
                name: name.trim(),
                email: email.trim()
              });
            }
          }
          
          onChange([...recipients, ...newRecipients]);
          toast.success(`${newRecipients.length} destinatários importados`);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleRemoveContact = (contactId: string) => {
    if (onContactsChange) {
      onContactsChange(selectedContactIds.filter(id => id !== contactId));
      toast.success('Contato removido');
    }
  };

  // Mode: Contacts
  if (mode === 'contacts') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Usuários Externos</Label>
            <p className="text-sm text-muted-foreground">
              Selecione contatos da sua base para receberem acesso ao formulário
            </p>
          </div>
          <Button size="sm" onClick={() => setIsContactsPickerOpen(true)}>
            <Users className="w-4 h-4 mr-2" />
            Adicionar Usuários Externos
          </Button>
        </div>

        {selectedContacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                Nenhum usuário externo selecionado.<br />
                Use o botão "Adicionar Usuários Externos" para selecionar contatos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <Badge variant="secondary">
              {selectedContacts.length} usuário{selectedContacts.length !== 1 ? 's' : ''} selecionado{selectedContacts.length !== 1 ? 's' : ''}
            </Badge>

            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {selectedContacts.map((contact) => (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{contact.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {contact.email_primary ? (
                            <>
                              <Mail className="w-3 h-3" />
                              {contact.email_primary}
                            </>
                          ) : (
                            <span className="text-orange-600">Sem email cadastrado</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(contact.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <ContactsPickerModal
          isOpen={isContactsPickerOpen}
          onClose={() => setIsContactsPickerOpen(false)}
          selectedContactIds={selectedContactIds}
          onSelect={(ids) => {
            if (onContactsChange) {
              onContactsChange(ids);
            }
          }}
        />
      </div>
    );
  }

  // Mode: Manual (original behavior)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Destinatários Externos</Label>
          <p className="text-sm text-muted-foreground">
            Usuários externos que receberão acesso ao formulário
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={importFromCSV}
          >
            Importar CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingIndex !== null ? 'Editar Destinatário' : 'Adicionar Destinatário'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ex: joao@empresa.com"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Key className="w-4 h-4" />
                    <span className="text-sm font-medium">Senha Automática</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Uma senha segura de 12 caracteres será gerada automaticamente e enviada por email para cada destinatário.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveRecipient}>
                    {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {recipients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Mail className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-center">
              Nenhum destinatário externo adicionado.<br />
              Use o botão "Adicionar" para incluir destinatários.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {recipients.length} destinatário{recipients.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {recipients.map((recipient, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{recipient.name}</div>
                      <div className="text-xs text-muted-foreground">{recipient.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRecipient(index)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecipient(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {recipients.length > 0 && (
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded">
          <strong>Formato CSV para importação:</strong><br />
          Nome,Email<br />
          João Silva,joao@empresa.com<br />
          Maria Santos,maria@empresa.com
        </div>
      )}
    </div>
  );
};