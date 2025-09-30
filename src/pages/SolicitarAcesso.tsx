import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Shield, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useDepartments } from "@/hooks/useDepartments";

export const SolicitarAcesso = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { departments, loading: departmentsLoading } = useDepartments();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    department_id: '',
    notification_email: true,
    notification_app: true,
    notification_frequency: 'instant',
    is_leader: false
  });


  // Função para gerar hash SHA-256 do IP
  const hashIP = async (ip: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Função para obter informações do cliente
  const getClientInfo = async () => {
    try {
      // Obter IP público do cliente
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;
      
      // Hash do IP para privacidade
      const ipHash = await hashIP(clientIP);
      
      // User Agent
      const userAgent = navigator.userAgent;
      
      return { ipHash, userAgent };
    } catch (error) {
      console.error('Erro ao obter informações do cliente:', error);
      // Fallback em caso de erro
      const fallbackIP = '127.0.0.1';
      const ipHash = await hashIP(fallbackIP);
      return { ipHash, userAgent: navigator.userAgent };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name || !formData.email || !formData.department) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Verificar se departamento foi selecionado corretamente
    if (!formData.department_id) {
      toast.error('Por favor, selecione um departamento válido.');
      return;
    }

    try {
      setLoading(true);
      
      // Buscar informações do cliente
      const clientInfo = await getClientInfo();
      
      const { error } = await supabase
        .from('pending_access_requests')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          department: formData.department,
          department_id: formData.department_id,
          notification_email: formData.notification_email,
          notification_app: formData.notification_app,
          notification_frequency: formData.notification_frequency,
          is_leader: formData.is_leader,
          request_ip_hash: clientInfo.ipHash,
          request_user_agent: clientInfo.userAgent
        }]);

      if (error) throw error;

      console.log('✅ Solicitação criada com sucesso');
      setSubmitted(true);
      toast.success('Solicitação enviada com sucesso! Aguarde a aprovação.');
      
      // Redirecionar para a página de auth após 3 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    const selectedDept = departments.find(d => d.name === value);
    setFormData(prev => ({
      ...prev,
      department: value,
      department_id: selectedDept?.id || ''
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Solicitação Enviada!</CardTitle>
            <CardDescription>
              Sua solicitação foi enviada com sucesso. Você será notificado por email quando for aprovada pelos administradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecionando para a página inicial...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6" />
            Solicitar Acesso
          </CardTitle>
          <CardDescription>
            Preencha os dados abaixo para solicitar acesso ao sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Digite seu email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} disabled={formData.is_leader}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="hr">Recursos Humanos</SelectItem>
                  <SelectItem value="director">Diretor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_leader" className="text-sm">Líder de Equipe</Label>
              <Switch
                id="is_leader"
                checked={formData.is_leader}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_leader: checked, role: checked ? 'user' : prev.role }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento *</Label>
              <Select value={formData.department} onValueChange={handleDepartmentChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-accent/10 p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Preferências de Notificação
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notification_email" className="text-sm">Notificações por Email</Label>
                <Switch
                  id="notification_email"
                  checked={formData.notification_email}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_email: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notification_app" className="text-sm">Notificações no App</Label>
                <Switch
                  id="notification_app"
                  checked={formData.notification_app}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notification_app: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Frequência das Notificações</Label>
                <Select 
                  value={formData.notification_frequency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, notification_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instantânea</SelectItem>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || departmentsLoading}>
              {loading ? 'Enviando...' : 'Solicitar Acesso'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SolicitarAcesso;