import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserEditForm } from '@/components/UserEditForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TestNotificationsButton } from '@/components/TestNotificationsButton';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string | null;
  is_leader: boolean;
  notification_email?: boolean;
  notification_app?: boolean;
  notification_telegram?: boolean;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  notification_frequency?: string;
  notification_types?: any;
  employee_id?: string | null;
  company_relationship?: string | null;
  supervisor_id?: string | null;
  department?: {
    name: string;
    color: string;
  };
}

export const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    try {
      console.log('Fetching user data for ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name, color)
        `)
        .eq('id', userId)
        .maybeSingle();

      console.log('User query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.error('User not found for ID:', userId);
        toast({
          title: "Erro",
          description: "Usuário não encontrado",
          variant: "destructive",
        });
        navigate('/usuarios');
        return;
      }

      console.log('User data loaded successfully:', data);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário",
        variant: "destructive",
      });
      navigate('/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name, color)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing user data:', error);
        return;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };


  const handleGoBack = () => {
    navigate('/usuarios');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Usuário não encontrado</h2>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Usuários
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background fixed inset-0 z-50">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleGoBack} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <TestNotificationsButton />
        <UserEditForm 
          user={user} 
          onUserUpdate={(updatedUser) => setUser(updatedUser)}
          refreshUserData={refreshUserData}
        />
      </div>
    </div>
  );
};
