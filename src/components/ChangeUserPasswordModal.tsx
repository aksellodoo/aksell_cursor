import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

interface ChangeUserPasswordModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const ChangeUserPasswordModal = ({ open, onClose, user }: ChangeUserPasswordModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const generateRandomPassword = () => {
    // Gerar senha com 30 caracteres seguindo as melhores práticas
    const length = 30;
    const lowercase = "abcdefghijkmnpqrstuvwxyz"; // removido 'l' e 'o'
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removido 'I' e 'O'
    const numbers = "23456789"; // removido '0' e '1'
    const symbols = "!@#$%&*+-=?";
    
    // Garantir pelo menos 1 caractere de cada tipo
    let password = "";
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Preencher o restante aleatoriamente
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Embaralhar a senha para não ter padrão fixo
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const validatePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }
    
    if (newPassword.length < 10) {
      toast.error("A senha deve ter pelo menos 10 caracteres");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validatePassword()) return;
    
    setShowConfirmDialog(true);
  };

  const confirmPasswordChange = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const { error } = await supabase.functions.invoke('change-user-password', {
        body: {
          userId: user.id,
          newPassword: newPassword,
          userName: user.name,
          userEmail: user.email
        }
      });

      if (error) {
        console.error('Erro ao alterar senha:', error);
        toast.error('Erro ao alterar senha: ' + error.message);
      } else {
        toast.success('Senha alterada com sucesso! Notificações enviadas ao usuário.');
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro inesperado ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Senha do Usuário</DialogTitle>
          <DialogDescription>
            Alterando a senha para: <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <PasswordStrengthIndicator password={newPassword} className="mt-4" />

          <Button
            type="button"
            variant="outline"
            onClick={generateRandomPassword}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Gerar Senha Segura (30 caracteres)
          </Button>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {isLoading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Alteração de Senha</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja alterar a senha de <strong>{user?.name}</strong>?
                    <br /><br />
                    Esta ação irá:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Alterar imediatamente a senha do usuário</li>
                      <li>Enviar uma notificação por email ao usuário</li>
                      <li>Criar uma notificação no sistema</li>
                      <li>Registrar a ação nos logs de auditoria</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmPasswordChange} className="bg-destructive hover:bg-destructive/90">
                    Confirmar Alteração
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};