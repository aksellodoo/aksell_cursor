import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { Office365ConfigButton } from '@/components/integrations/Office365ConfigButton';
import { EmailSettingsCard } from '@/components/integrations/EmailSettingsCard';

interface User {
  id: string;
  name: string;
  email: string;
}

interface EmailTabProps {
  user: User;
  refreshUserData: () => Promise<void>;
}

export const EmailTab = ({ user, refreshUserData }: EmailTabProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Office 365 Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Integração Office 365
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Status da Conexão</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Configure a integração com o Office 365 para sincronização de emails e calendários.
              </p>
              <Office365ConfigButton
                editedUserId={user.id}
                onStatusChanged={refreshUserData}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <EmailSettingsCard editedUserId={user.id} />
    </div>
  );
};