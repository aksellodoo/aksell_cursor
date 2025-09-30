import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import aksellLogo from "@/assets/aksell-logo-new.svg";
import aksellIcon from "@/assets/aksell-icon-official.png";
const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});
type LoginFormData = z.infer<typeof loginSchema>;
interface LoginFormProps {
  onLogin: (credentials: LoginFormData) => void;
}
export const LoginForm = ({
  onLogin
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Real authentication should be implemented here
      // This is just a placeholder - integrate with your auth system
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Funcionalidade de login será implementada em breve");
      // onLogin(data); // Uncomment when real auth is implemented
    } catch (error) {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Logo da Aksell */}
      <div className="mb-8 text-center">
        <img src={aksellLogo} alt="Aksell" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-orange-900">FichaCerta</h1>
        <p className="text-orange-500">Aksell Nutrition Ltda</p>
      </div>

      {/* Card de Login */}
      <Card className="w-full max-w-md bg-white shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <h2 className="text-xl font-semibold mb-2 text-lime-900">
            Acesso ao Sistema
          </h2>
          <p className="text-sm text-lime-900">
            Digite suas credenciais para continuar
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Digite seu email" className="border-gray-300 focus:border-primary focus:ring-primary" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="password" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type={showPassword ? "text" : "password"} placeholder="••••••••" className="pr-10 border-gray-300 focus:border-primary focus:ring-primary" disabled={isLoading} />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Link Esqueci Senha */}
              <div className="text-left">
                <button type="button" className="flex items-center gap-2 text-primary text-sm hover:underline" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                  <KeyRound className="h-4 w-4" />
                  Esqueci minha senha
                </button>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-md transition-colors" disabled={isLoading}>
                {isLoading ? <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Entrando...
                  </div> : "Entrando..."}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>;
};