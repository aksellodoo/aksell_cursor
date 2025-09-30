import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  pageName: string;
  action?: 'view' | 'modify';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideWhenNoAccess?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  pageName,
  action = 'view',
  children,
  fallback,
  hideWhenNoAccess = false
}) => {
  const { canView, canModify, hasAccess, loading } = usePermissions();

  if (loading) {
    return null;
  }

  // Check access based on action type
  let hasPermission = false;
  
  if (action === 'view') {
    hasPermission = hasAccess(pageName) && canView(pageName);
  } else if (action === 'modify') {
    hasPermission = hasAccess(pageName) && canModify(pageName);
  }

  if (!hasPermission) {
    if (hideWhenNoAccess) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="border-destructive">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para {action === 'view' ? 'visualizar' : 'modificar'} este conteúdo.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};