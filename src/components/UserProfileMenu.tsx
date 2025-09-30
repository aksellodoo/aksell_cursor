import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Key, ChevronDown } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

interface UserProfileMenuProps {
  userName: string;
  userRole: string;
  canChangePassword: boolean;
  onSignOut: () => void;
}

export const UserProfileMenu = ({ 
  userName, 
  userRole, 
  canChangePassword, 
  onSignOut 
}: UserProfileMenuProps) => {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted/50"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-56">
          {canChangePassword && (
            <>
              <DropdownMenuItem 
                onClick={() => setIsChangePasswordOpen(true)}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                Trocar Senha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem 
            onClick={onSignOut}
            className="gap-2 text-red-600 focus:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordModal 
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};