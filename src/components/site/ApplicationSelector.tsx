import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationsManager } from "./ApplicationsManager";

interface Application {
  id: string;
  name: string;
  name_en?: string;
  color: string;
  is_active: boolean;
}

interface ApplicationSelectorProps {
  selectedApplications: string[];
  onApplicationsChange: (applicationIds: string[]) => void;
  placeholder?: string;
}

export const ApplicationSelector = ({ 
  selectedApplications, 
  onApplicationsChange, 
  placeholder = "Selecionar aplicações..."
}: ApplicationSelectorProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('site_product_applications')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erro ao carregar aplicações:', error);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const selectedApps = applications.filter(app => 
    selectedApplications.includes(app.id)
  );

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.name_en && app.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleToggleApplication = (applicationId: string) => {
    if (selectedApplications.includes(applicationId)) {
      onApplicationsChange(selectedApplications.filter(id => id !== applicationId));
    } else {
      onApplicationsChange([...selectedApplications, applicationId]);
    }
  };

  const handleRemoveApplication = (applicationId: string) => {
    onApplicationsChange(selectedApplications.filter(id => id !== applicationId));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-start">
              <Search className="w-4 h-4 mr-2" />
              {selectedApplications.length > 0 
                ? `${selectedApplications.length} aplicação(ões) selecionada(s)`
                : placeholder
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <Input
                placeholder="Buscar aplicações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
              
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {filteredApplications.map((app) => {
                    const isSelected = selectedApplications.includes(app.id);
                    return (
                      <div
                        key={app.id}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleToggleApplication(app.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: app.color }}
                          />
                          <span className="text-sm">{app.name}</span>
                          {app.name_en && (
                            <span className="text-xs text-muted-foreground">
                              ({app.name_en})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredApplications.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      Nenhuma aplicação encontrada
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>

        <ApplicationsManager 
          trigger={
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          }
          onApplicationsChange={loadApplications}
        />
      </div>

      {selectedApps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedApps.map((app) => (
            <Badge
              key={app.id}
              style={{ backgroundColor: app.color, color: 'white' }}
              className="text-xs"
            >
              {app.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-4 w-4 p-0 hover:bg-white/20"
                onClick={() => handleRemoveApplication(app.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};