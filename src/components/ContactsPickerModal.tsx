import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useContacts, Contact } from '@/hooks/useContacts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Plus, Mail, AlertCircle, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ContactsPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContactIds: string[];
  onSelect: (contactIds: string[]) => void;
}

export const ContactsPickerModal = ({
  isOpen,
  onClose,
  selectedContactIds,
  onSelect
}: ContactsPickerModalProps) => {
  const navigate = useNavigate();
  const { contacts, isLoading } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedContactIds);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email_primary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleContact = (contactId: string) => {
    setTempSelectedIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleConfirm = () => {
    const selectedContacts = contacts.filter(c => tempSelectedIds.includes(c.id));
    const contactsWithoutEmail = selectedContacts.filter(c => !c.email_primary);

    if (contactsWithoutEmail.length > 0) {
      toast.warning(
        `${contactsWithoutEmail.length} contato(s) selecionado(s) não possui(em) email cadastrado`
      );
    }

    onSelect(tempSelectedIds);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedIds(selectedContactIds);
    onClose();
  };

  const handleCreateContact = () => {
    // Salvar estado atual
    sessionStorage.setItem('formExternalContactsPickerState', JSON.stringify({
      tempSelectedIds,
      returnToFormConfig: true
    }));

    // Navegar para tela de cadastro
    navigate('/gestao/contatos/novo');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-4 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Selecionar Usuários Externos
          </DialogTitle>
        </DialogHeader>

        {/* Search and Create Button */}
        <div className="flex gap-3 flex-shrink-0">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCreateContact} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Contato
          </Button>
        </div>

        {/* Statistics */}
        <div className="flex gap-2 flex-shrink-0">
          <Badge variant="secondary">
            {tempSelectedIds.length} selecionado(s)
          </Badge>
          <Badge variant="outline">
            {filteredContacts.length} total
          </Badge>
        </div>

        {/* Contacts List */}
        <ScrollArea className="flex-1 min-h-0 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhum contato encontrado com o termo de busca.'
                  : 'Nenhum contato cadastrado. Clique em "Cadastrar Contato" para criar o primeiro.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const isSelected = tempSelectedIds.includes(contact.id);
                const hasEmail = !!contact.email_primary;

                return (
                  <Card
                    key={contact.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleContact(contact.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{contact.name}</p>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {hasEmail ? (
                              <>
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{contact.email_primary}</span>
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs">Sem email cadastrado</span>
                              </div>
                            )}
                          </div>

                          {contact.job_title && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {contact.job_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Warning for contacts without email */}
        {tempSelectedIds.length > 0 && (
          (() => {
            const selectedContacts = contacts.filter(c => tempSelectedIds.includes(c.id));
            const contactsWithoutEmail = selectedContacts.filter(c => !c.email_primary);

            if (contactsWithoutEmail.length > 0) {
              return (
                <Alert className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{contactsWithoutEmail.length} contato(s) selecionado(s) sem email:</strong>
                    <ul className="mt-1 text-xs space-y-0.5">
                      {contactsWithoutEmail.slice(0, 3).map(c => (
                        <li key={c.id}>• {c.name}</li>
                      ))}
                      {contactsWithoutEmail.length > 3 && (
                        <li>• e mais {contactsWithoutEmail.length - 3}...</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={tempSelectedIds.length === 0}>
            Confirmar Seleção ({tempSelectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
