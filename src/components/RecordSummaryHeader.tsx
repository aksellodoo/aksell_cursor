import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Building2, Users, Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecordSummaryHeaderProps {
  recordType: string;
  recordId: string;
  density?: 'compact' | 'comfortable';
}

interface RecordData {
  id: string;
  name?: string;
  title?: string;
  email?: string;
  role?: string;
  status?: string;
  department?: string;
  description?: string;
  created_at?: string;
  [key: string]: any;
}

export const RecordSummaryHeader = ({ recordType, recordId, density = "comfortable" }: RecordSummaryHeaderProps) => {
  const [recordData, setRecordData] = useState<RecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordData = async () => {
      try {
        let table = "";

        switch (recordType) {
          case "users":
          case "user":
            table = "profiles";
            break;
          case "departments":
          case "department":
            table = "departments";
            break;
          case "employees":
          case "employee":
            table = "employees";
            break;
          case "tasks":
          case "task":
            table = "tasks";
            break;
          default:
            table = "profiles";
        }

        const { data, error } = await supabase.from(table as any).select("*").eq("id", recordId).single();

        if (error) {
          console.error("Error fetching record:", error);
          return;
        }

        if (data) {
          setRecordData(data as any);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordData();
  }, [recordType, recordId]);

  const getRecordIcon = () => {
    switch (recordType) {
      case "users":
      case "user":
        return <User className="h-5 w-5" />;
      case "departments":
      case "department":
        return <Building2 className="h-5 w-5" />;
      case "employees":
      case "employee":
        return <Users className="h-5 w-5" />;
      case "tasks":
      case "task":
        return <Calendar className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getDisplayName = () => {
    if (!recordData) return "";
    return recordData.name || recordData.title || recordData.full_name || recordData.email || "Sem nome";
  };

  const getStatusBadge = () => {
    if (!recordData?.status) return null;
    
    const statusColors = {
      active: "bg-green-500/10 text-green-700",
      inactive: "bg-red-500/10 text-red-700",
      pending: "bg-yellow-500/10 text-yellow-700",
      todo: "bg-blue-500/10 text-blue-700",
      in_progress: "bg-orange-500/10 text-orange-700",
      completed: "bg-green-500/10 text-green-700",
    };

    return (
      <Badge className={statusColors[recordData.status as keyof typeof statusColors] || "bg-gray-500/10 text-gray-700"}>
        {recordData.status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardContent className={`p-6 ${density === 'compact' ? 'p-4' : ''}`}>
        <div className={`flex items-start ${density === 'compact' ? 'gap-3' : 'gap-4'}`}>
          <Avatar className={density === 'compact' ? 'h-10 w-10' : 'h-16 w-16'}>
            <AvatarImage src="" alt={getDisplayName()} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getRecordIcon()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className={density === 'compact' ? 'text-lg font-semibold' : 'text-2xl font-semibold'}>{getDisplayName()}</h1>
              {getStatusBadge()}
            </div>
            
            <div className={`flex flex-wrap items-center ${density === 'compact' ? 'gap-2 text-xs' : 'gap-4 text-sm'} text-muted-foreground`}>
              {recordData?.email && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {recordData.email}
                </div>
              )}
              
              {recordData?.department && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {recordData.department}
                </div>
              )}
              
              {recordData?.role && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recordData.role}
                </div>
              )}
              
              {recordData?.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Criado em {new Date(recordData.created_at).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
            
            {recordData?.description && (
              <p className={`${density === 'compact' ? 'text-xs' : 'text-sm'} text-muted-foreground mt-2`}>
                {recordData.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};