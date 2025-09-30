import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, FileText, History, ListTodo } from "lucide-react";
import { ChatterComponent } from "./ChatterComponent";
import { TasksTab } from "./chatter-tabs/TasksTab";
import { FilesTab } from "./chatter-tabs/FilesTab";
import { HistoryTab } from "./chatter-tabs/HistoryTab";
import { useChatter } from "@/hooks/useChatter";
import { ShareButton } from "@/components/ShareButton";

interface ChatterTabsProps {
  recordType: string;
  recordId: string;
  density?: 'compact' | 'comfortable';
}

export const ChatterTabs = ({ recordType, recordId, density = 'compact' }: ChatterTabsProps) => {
  const [activeTab, setActiveTab] = useState("messages");
  const { messages, auditLogs } = useChatter(recordType, recordId);

  const getTotalActivity = () => {
    return messages.length + auditLogs.length;
  };

  const getRecentActivity = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentMessages = messages.filter(msg => 
      new Date(msg.created_at) > threeDaysAgo
    );
    const recentAudits = auditLogs.filter(audit => 
      new Date(audit.timestamp) > threeDaysAgo
    );
    
    return recentMessages.length + recentAudits.length;
  };

  const renderTabBadge = (count: number) => {
    if (count === 0) return null;
    return (
      <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
        {count > 99 ? "99+" : count}
      </Badge>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="sticky top-12 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b w-full items-center gap-1 justify-start">
        <TabsTrigger value="messages" className="flex items-center gap-2 h-8 text-xs">
          <MessageCircle className="h-4 w-4" />
          Mensagens
          {renderTabBadge(messages.length)}
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-2 h-8 text-xs">
          <FileText className="h-4 w-4" />
          Arquivos
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2 h-8 text-xs">
          <History className="h-4 w-4" />
          Histórico
          {renderTabBadge(auditLogs.length)}
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center gap-2 h-8 text-xs">
          <ListTodo className="h-4 w-4" />
          Tarefas
        </TabsTrigger>
        <div className="ml-auto">
          <ShareButton
            recordType={recordType}
            recordId={recordId}
            recordName={`${recordType}-${recordId}`}
            variant="outline"
            size="sm"
            className="h-8"
          />
        </div>
      </TabsList>

      <TabsContent value="messages" className="mt-0">
        <div className="space-y-3">
          <ChatterComponent
            recordType={recordType}
            recordId={recordId}
            recordName={`${recordType}-${recordId}`}
            density={density}
          />
        </div>
      </TabsContent>

      <TabsContent value="files" className="mt-6">
        <FilesTab recordType={recordType} recordId={recordId} />
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <HistoryTab recordType={recordType} recordId={recordId} />
      </TabsContent>

      <TabsContent value="tasks" className="mt-6">
        <TasksTab recordType={recordType} recordId={recordId} />
      </TabsContent>
    </Tabs>
  );
};