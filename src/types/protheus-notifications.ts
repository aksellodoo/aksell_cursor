export type RecordStatus = 'new' | 'updated' | 'deleted';

export type NotificationChannel = 'app' | 'email' | 'telegram' | 'whatsapp';

export interface ProtheusNotificationConfig {
  id: string;
  user_id: string;
  protheus_table_id: string;
  record_statuses: string[];
  notification_channels: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProtheusTableWithNotifications {
  id: string;
  table_name: string;
  description?: string;
  notification_config?: ProtheusNotificationConfig;
}

export interface NotificationChannels {
  app: boolean;
  email: boolean;
  telegram: boolean;
  whatsapp: boolean;
}

export interface ProtheusNotificationFormData {
  protheus_table_id: string;
  record_statuses: RecordStatus[];
  notification_channels: NotificationChannel[];
}