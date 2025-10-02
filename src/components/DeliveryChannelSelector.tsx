import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Contact } from '@/hooks/useContacts';
import { useFormInvitations, type DeliveryChannelConfig } from '@/hooks/useFormInvitations';
import { Mail, MessageSquare, Send, AlertTriangle, CheckCircle2, XCircle, User, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeliveryChannelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  formId: string;
  formTitle: string;
  formDescription?: string;
  estimatedMinutes?: number;
  deadline?: string;
  creatorName: string;
  onSendComplete: (success: boolean) => void;
}

export const DeliveryChannelSelector = ({
  isOpen,
  onClose,
  contacts,
  formId,
  formTitle,
  formDescription,
  estimatedMinutes,
  deadline,
  creatorName,
  onSendComplete
}: DeliveryChannelSelectorProps) => {
  const { sendInvitations, isSending, sendProgress } = useFormInvitations();

  const [channelConfigs, setChannelConfigs] = useState<Record<string, DeliveryChannelConfig>>({});
  const [showResults, setShowResults] = useState(false);
  const [sendResults, setSendResults] = useState<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ contact: string; channel: string; error: string }>;
  } | null>(null);

  // Initialize channel configs when contacts change
  useEffect(() => {
    if (!isOpen) return;

    const initialConfigs: Record<string, DeliveryChannelConfig> = {};
    contacts.forEach(contact => {
      initialConfigs[contact.id] = {
        contact_id: contact.id,
        send_via_email: !!contact.email_primary, // Auto-select if email exists
        send_via_whatsapp: false,
        send_via_telegram: false
      };
    });
    setChannelConfigs(initialConfigs);
    setShowResults(false);
    setSendResults(null);
  }, [contacts, isOpen]);

  const updateChannelConfig = (contactId: string, channel: 'email' | 'whatsapp' | 'telegram', value: boolean) => {
    setChannelConfigs(prev => ({
      ...prev,
      [contactId]: {
        ...prev[contactId],
        [`send_via_${channel}`]: value
      }
    }));
  };

  const getAvailableChannels = (contact: Contact) => {
    return {
      email: !!contact.email_primary,
      whatsapp: !!contact.mobile_phone && contact.messaging_whatsapp === true,
      telegram: !!contact.mobile_phone && contact.messaging_telegram === true
    };
  };

  const hasNoChannels = (contact: Contact) => {
    const available = getAvailableChannels(contact);
    return !available.email && !available.whatsapp && !available.telegram;
  };

  const getSelectedChannelsCount = () => {
    return Object.values(channelConfigs).reduce((total, config) => {
      const count = (config.send_via_email ? 1 : 0) +
                   (config.send_via_whatsapp ? 1 : 0) +
                   (config.send_via_telegram ? 1 : 0);
      return total + count;
    }, 0);
  };

  const handleSendInvitations = async () => {
    const configsArray = Object.values(channelConfigs).filter(config =>
      config.send_via_email || config.send_via_whatsapp || config.send_via_telegram
    );

    if (configsArray.length === 0) {
      toast.error('Selecione pelo menos um canal de envio para continuar');
      return;
    }

    try {
      const results = await sendInvitations(
        {
          form_id: formId,
          form_title: formTitle,
          form_description: formDescription,
          estimated_minutes: estimatedMinutes,
          deadline: deadline,
          creator_name: creatorName,
          delivery_configs: configsArray
        },
        contacts
      );

      setSendResults(results);
      setShowResults(true);

      if (results.success) {
        toast.success(`Convites enviados com sucesso! ${results.sent} enviado(s).`);
      } else {
        toast.warning(`Envio concluído com ${results.failed} falha(s). Verifique os detalhes.`);
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Erro ao enviar convites');
    }
  };

  const handleClose = () => {
    if (showResults && sendResults) {
      onSendComplete(sendResults.success);
    }
    onClose();
  };

  // Results view
  if (showResults && sendResults) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sendResults.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Convites Enviados com Sucesso
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Envio Concluído com Problemas
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{sendResults.sent}</div>
                    <div className="text-sm text-muted-foreground">Enviados</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{sendResults.failed}</div>
                    <div className="text-sm text-muted-foreground">Falhas</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {sendResults.errors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Detalhes dos Erros:</Label>
                <ScrollArea className="h-[200px] border rounded-md p-3">
                  {sendResults.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="mb-2">
                      <AlertDescription className="text-xs">
                        <strong>{error.contact}</strong> - {error.channel}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Configuration view
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Configurar Envio de Convites
          </DialogTitle>
          <DialogDescription>
            Selecione os canais de comunicação para enviar o convite do formulário para cada contato
          </DialogDescription>
        </DialogHeader>

        {/* Form Info */}
        <Card className="flex-shrink-0">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Formulário:</Label>
                <p className="font-medium truncate">{formTitle}</p>
              </div>
              {estimatedMinutes && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Tempo estimado:
                  </Label>
                  <p className="font-medium">~{estimatedMinutes} min</p>
                </div>
              )}
              {deadline && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Prazo:
                  </Label>
                  <p className="font-medium text-xs">
                    {format(new Date(deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Canais selecionados:</Label>
                <p className="font-medium">{getSelectedChannelsCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts List */}
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-3">
            {contacts.map((contact) => {
              const available = getAvailableChannels(contact);
              const config = channelConfigs[contact.id] || {
                contact_id: contact.id,
                send_via_email: false,
                send_via_whatsapp: false,
                send_via_telegram: false
              };

              return (
                <Card key={contact.id} className={hasNoChannels(contact) ? 'border-orange-300 bg-orange-50/50' : ''}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Contact Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{contact.name}</p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {contact.email_primary && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {contact.email_primary}
                              </div>
                            )}
                            {contact.mobile_phone && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {contact.mobile_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Channel Selection */}
                      {hasNoChannels(contact) ? (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Este contato não possui nenhum canal de comunicação configurado
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Enviar convite por:</Label>
                          <div className="flex flex-wrap gap-4">
                            {/* Email */}
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${contact.id}-email`}
                                checked={config.send_via_email}
                                onCheckedChange={(checked) =>
                                  updateChannelConfig(contact.id, 'email', checked as boolean)
                                }
                                disabled={!available.email}
                              />
                              <Label
                                htmlFor={`${contact.id}-email`}
                                className={`text-sm cursor-pointer flex items-center gap-1 ${!available.email ? 'text-muted-foreground' : ''}`}
                              >
                                <Mail className="w-4 h-4" />
                                Email
                                {!available.email && (
                                  <Badge variant="outline" className="text-xs ml-1">Indisponível</Badge>
                                )}
                              </Label>
                            </div>

                            {/* WhatsApp */}
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${contact.id}-whatsapp`}
                                checked={config.send_via_whatsapp}
                                onCheckedChange={(checked) =>
                                  updateChannelConfig(contact.id, 'whatsapp', checked as boolean)
                                }
                                disabled={!available.whatsapp}
                              />
                              <Label
                                htmlFor={`${contact.id}-whatsapp`}
                                className={`text-sm cursor-pointer flex items-center gap-1 ${!available.whatsapp ? 'text-muted-foreground' : ''}`}
                              >
                                <MessageSquare className="w-4 h-4" />
                                WhatsApp
                                {!available.whatsapp && (
                                  <Badge variant="outline" className="text-xs ml-1">Indisponível</Badge>
                                )}
                              </Label>
                            </div>

                            {/* Telegram */}
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${contact.id}-telegram`}
                                checked={config.send_via_telegram}
                                onCheckedChange={(checked) =>
                                  updateChannelConfig(contact.id, 'telegram', checked as boolean)
                                }
                                disabled={!available.telegram}
                              />
                              <Label
                                htmlFor={`${contact.id}-telegram`}
                                className={`text-sm cursor-pointer flex items-center gap-1 ${!available.telegram ? 'text-muted-foreground' : ''}`}
                              >
                                <Send className="w-4 h-4" />
                                Telegram
                                {!available.telegram && (
                                  <Badge variant="outline" className="text-xs ml-1">Indisponível</Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Sending Progress */}
        {isSending && (
          <div className="flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Enviando convites...</span>
              <span>{sendProgress.current} / {sendProgress.total}</span>
            </div>
            <Progress value={(sendProgress.current / sendProgress.total) * 100} />
          </div>
        )}

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleSendInvitations} disabled={isSending || getSelectedChannelsCount() === 0}>
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'Enviando...' : `Enviar Convites (${getSelectedChannelsCount()})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
