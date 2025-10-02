-- Corrigir políticas RLS para user_protheus_table_notifications
-- Permitir que admins/directors gerenciem configurações de outros usuários

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON user_protheus_table_notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON user_protheus_table_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON user_protheus_table_notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON user_protheus_table_notifications;

-- Create new policies with admin support
CREATE POLICY "Users can view notifications" 
ON user_protheus_table_notifications 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);

CREATE POLICY "Users can create notifications" 
ON user_protheus_table_notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);

CREATE POLICY "Users can update notifications" 
ON user_protheus_table_notifications 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);

CREATE POLICY "Users can delete notifications" 
ON user_protheus_table_notifications 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'director')
  )
);