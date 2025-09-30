import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  CheckSquare, 
  Paperclip, 
  History, 
  Send, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  FileText,
  X,
  Minimize2,
  Maximize2,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatterComponent } from "./ChatterComponent";
import { useChatter } from "@/hooks/useChatter";
import { ShareRecordModal } from "./ShareRecordModal";

interface ChatterPanelProps {
  recordType: string;
  recordId: string;
  recordName?: string;
  mode?: 'embedded' | 'fixed';
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export const ChatterPanel = ({ 
  recordType, 
  recordId, 
  recordName,
  mode = 'embedded',
  className = "",
  onClose,
  onMinimize
}: ChatterPanelProps) => {
  const [activeTab, setActiveTab] = useState("messages");
  const [isMinimized, setIsMinimized] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { messages, auditLogs } = useChatter(recordType, recordId);

  // Activity types for the action buttons
  const activityTypes = [
    { id: 'call', label: 'Ligação', icon: Phone, color: 'text-blue-600' },
    { id: 'email', label: 'Email', icon: Mail, color: 'text-green-600' },
    { id: 'meeting', label: 'Reunião', icon: Calendar, color: 'text-purple-600' },
    { id: 'task', label: 'Tarefa', icon: CheckSquare, color: 'text-orange-600' },
    { id: 'approval', label: 'Aprovação', icon: CheckCircle, color: 'text-red-600' },
    { id: 'document', label: 'Documento', icon: FileText, color: 'text-gray-600' }
  ];

  const getTotalActivity = () => {
    return messages.length + auditLogs.length;
  };

  const getRecentActivity = () => {
    return [...messages, ...auditLogs]
      .filter(item => {
        const timestamp = 'created_at' in item ? item.created_at : item.timestamp;
        const itemDate = new Date(timestamp);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return itemDate > threeDaysAgo;
      }).length;
  };

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-2 p-4 border-b">
      {/* Botão de compartilhamento */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setShareModalOpen(true)}
      >
        <Share2 className="h-3 w-3 mr-1 text-blue-600" />
        Compartilhar
      </Button>
      
      {activityTypes.map((type) => (
        <Button
          key={type.id}
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            // TODO: Implement activity creation
            console.log(`Create ${type.id} activity`);
          }}
        >
          <type.icon className={`h-3 w-3 mr-1 ${type.color}`} />
          {type.label}
        </Button>
      ))}
    </div>
  );

  const renderTabBadge = (count: number) => (
    count > 0 ? (
      <Badge variant="secondary" className="ml-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
        {count > 99 ? '99+' : count}
      </Badge>
    ) : null
  );

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize?.();
  };

  if (mode === 'fixed' && isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 z-50">
        <Button
          onClick={handleMinimize}
          variant="default"
          size="sm"
          className="rounded-t-lg rounded-b-none shadow-lg"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chatter ({getTotalActivity()})
        </Button>
      </div>
    );
  }

  const cardContent = (
    <>
      {/* Header with Action Buttons */}
      {mode !== 'embedded' && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Chatter - {recordName || `${recordType} ${recordId.slice(0, 8)}`}
            </CardTitle>
            <div className="flex items-center gap-1">
              {mode === 'fixed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="messages" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            Mensagens
            {renderTabBadge(messages.length)}
          </TabsTrigger>
          <TabsTrigger value="activities" className="text-xs">
            <CheckSquare className="h-3 w-3 mr-1" />
            Atividades
            {renderTabBadge(0)} {/* TODO: Implement activities count */}
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs">
            <Paperclip className="h-3 w-3 mr-1" />
            Arquivos
            {renderTabBadge(0)} {/* TODO: Implement files count */}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Histórico
            {renderTabBadge(auditLogs.length)}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-4">
          <TabsContent value="messages" className="mt-0 h-full">
            <ChatterComponent
              recordType={recordType}
              recordId={recordId}
              recordName={recordName}
              className="h-full"
            />
          </TabsContent>

          <TabsContent value="activities" className="mt-0 h-full">
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <CheckSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">Sistema de atividades em desenvolvimento</p>
              <p className="text-xs">Em breve: criação e gestão de tarefas</p>
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-0 h-full">
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Paperclip className="h-8 w-8 mb-2" />
              <p className="text-sm">Sistema de arquivos em desenvolvimento</p>
              <p className="text-xs">Em breve: upload e download de documentos</p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 h-full">
            <ScrollArea className="h-full">
              {auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <History className="h-8 w-8 mb-2" />
                  <p className="text-sm">Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">
                          {log.changer?.name || 'Sistema'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {log.field_name}: {log.old_value || 'vazio'} → {log.new_value || 'vazio'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );

  if (mode === 'fixed') {
    return (
      <>
        <div className={cn(
          "fixed bottom-0 right-4 w-96 max-w-[calc(100vw-2rem)] bg-background border rounded-t-lg shadow-xl z-50",
          "h-[500px] max-h-[70vh] flex flex-col",
          className
        )}>
          <Card className="h-full border-0 flex flex-col">
            {cardContent}
          </Card>
        </div>
        
        <ShareRecordModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          recordType={recordType}
          recordId={recordId}
          recordName={recordName || `${recordType} ${recordId.slice(0, 8)}`}
        />
      </>
    );
  }

  return (
    <>
      <Card className={cn("flex flex-col h-[600px]", className)}>
        {cardContent}
      </Card>
      
      <ShareRecordModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        recordType={recordType}
        recordId={recordId}
        recordName={recordName || `${recordType} ${recordId.slice(0, 8)}`}
      />
    </>
  );
};