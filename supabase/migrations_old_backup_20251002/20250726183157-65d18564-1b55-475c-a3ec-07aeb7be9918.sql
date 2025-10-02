-- Create users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  last_login TIMESTAMP WITH TIME ZONE,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users are viewable by authenticated users" 
ON public.users 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can be inserted by authenticated users" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can be updated by authenticated users" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Users can be deleted by authenticated users" 
ON public.users 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.users (name, email, role, status, last_login, department) VALUES
('Maria Silva Santos', 'maria.silva@aksell.com.br', 'Administrador', 'active', '2024-01-15 09:30:00', 'TI'),
('João Carlos Oliveira', 'joao.oliveira@aksell.com.br', 'Nutricionista', 'active', '2024-01-15 08:45:00', 'Nutrição'),
('Ana Paula Costa', 'ana.costa@aksell.com.br', 'Analista', 'active', '2024-01-14 16:20:00', 'Qualidade'),
('Pedro Lima Souza', 'pedro.lima@aksell.com.br', 'Supervisor', 'inactive', '2024-01-10 14:15:00', 'Produção'),
('Carla Mendes Ferreira', 'carla.mendes@aksell.com.br', 'Coordenador', 'active', '2024-01-15 07:30:00', 'Vendas');