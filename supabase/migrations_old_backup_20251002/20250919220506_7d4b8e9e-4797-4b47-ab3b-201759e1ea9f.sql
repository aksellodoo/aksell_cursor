-- Drop old notification system tables
DROP TABLE IF EXISTS protheus_notification_queue CASCADE;
DROP TABLE IF EXISTS user_protheus_table_notifications CASCADE;

-- Create simplified notification config table
CREATE TABLE user_notification_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  protheus_table_name TEXT NOT NULL,
  enabled_statuses TEXT[] NOT NULL DEFAULT '{new,updated,deleted}',
  channels JSONB NOT NULL DEFAULT '{"app": true, "email": false, "whatsapp": false, "telegram": false}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  
  UNIQUE(user_id, protheus_table_name)
);

-- Create notification log table for tracking sent notifications
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  protheus_table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_status TEXT NOT NULL,
  notification_data JSONB NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  channels_used JSONB NOT NULL,
  
  UNIQUE(user_id, protheus_table_name, record_id, record_status)
);

-- Enable RLS
ALTER TABLE user_notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notification_configs
CREATE POLICY "Users can view their own notification configs" 
ON user_notification_configs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification configs" 
ON user_notification_configs FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Users can update their own notification configs" 
ON user_notification_configs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification configs" 
ON user_notification_configs FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification configs" 
ON user_notification_configs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- RLS policies for notification_log
CREATE POLICY "Users can view their own notification logs" 
ON notification_log FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notification logs" 
ON notification_log FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all notification logs" 
ON notification_log FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'director')
));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON user_notification_configs
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

-- Migrate existing data from old system (if any)
-- This will be empty since the old system wasn't working properly