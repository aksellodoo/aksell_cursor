
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SYSTEM_MENU, type SystemNavItem } from '@/lib/navigation-pages';

export interface Permission {
  id: string;
  department_id: string;
  page_name: string;
  admin_permission: 'ver_modificar' | 'ver_somente' | 'bloquear_acesso';
  director_permission: 'ver_modificar' | 'ver_somente' | 'bloquear_acesso';
  hr_permission: 'ver_modificar' | 'ver_somente' | 'bloquear_acesso';
  leader_permission: 'ver_modificar' | 'ver_somente' | 'bloquear_acesso'; // ADDED
  user_permission: 'ver_modificar' | 'ver_somente' | 'bloquear_acesso';
}

export interface UserProfile {
  id: string;
  department_id: string | null;
  is_leader: boolean;
  role: string;
}

export type PermissionLevel = 'ver_modificar' | 'ver_somente' | 'bloquear_acesso';

export const usePermissions = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserPermissions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('usePermissions: fetching permissions for user:', user.id);

      // Fetch user profile using maybeSingle to avoid errors when user doesn't exist
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, department_id, is_leader, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('usePermissions: error fetching profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.warn('usePermissions: no profile found for user:', user.id);
        setUserProfile(null);
        setPermissions([]);
        return;
      }

      console.log('usePermissions: profile fetched successfully:', profile);
      setUserProfile(profile);

      // Fetch department permissions if user has a department
      if (profile.department_id) {
        console.log('usePermissions: fetching department permissions for:', profile.department_id);
        const { data: departmentPermissions, error: permissionsError } = await supabase
          .from('department_permissions')
          .select('*')
          .eq('department_id', profile.department_id);

        if (permissionsError) {
          console.error('usePermissions: error fetching department permissions:', permissionsError);
          throw permissionsError;
        }

        console.log('usePermissions: department permissions fetched:', departmentPermissions?.length || 0);
        const normalizedPermissions = normalizePermissions(departmentPermissions || []);
        console.log('usePermissions: normalized permissions:', normalizedPermissions?.length || 0);
        setPermissions(normalizedPermissions);
      } else {
        console.log('usePermissions: user has no department, clearing permissions');
        setPermissions([]);
      }
    } catch (error) {
      console.error('usePermissions: error in fetchUserPermissions:', error);
      setUserProfile(null);
      setPermissions([]);
    } finally {
      setLoading(false);
      console.log('usePermissions: fetch completed');
    }
  };

  // Function to resolve page names to their canonical form
  const resolveToCanonical = (pageName: string): string => {
    // Create a mapping from all labels, aliases, and normalized forms to their canonical labels
    const nameMapping = new Map<string, string>();
    
    const processItem = (item: SystemNavItem) => {
      const canonical = item.label;
      
      // Map the canonical label to itself
      nameMapping.set(canonical, canonical);
      
      // Map all aliases to the canonical label
      item.aliases?.forEach(alias => nameMapping.set(alias, canonical));
      
      // Map normalized versions (lowercase, snake_case, etc.)
      nameMapping.set(canonical.toLowerCase(), canonical);
      nameMapping.set(canonical.toLowerCase().replace(/\s+/g, '_'), canonical);
      nameMapping.set(canonical.toLowerCase().replace(/\s+/g, '-'), canonical);
      nameMapping.set(canonical.toLowerCase().replace(/\s+/g, ''), canonical);
      
      // Process children recursively
      item.children?.forEach(child => processItem(child));
    };
    
    SYSTEM_MENU.forEach(processItem);
    
    // Try exact match first
    let canonical = nameMapping.get(pageName);
    if (canonical) {
      console.log(`usePermissions: resolved '${pageName}' to canonical '${canonical}'`);
      return canonical;
    }
    
    // Try lowercase variations
    canonical = nameMapping.get(pageName.toLowerCase());
    if (canonical) {
      console.log(`usePermissions: resolved '${pageName}' to canonical '${canonical}' (lowercase)"`);
      return canonical;
    }
    
    console.warn(`usePermissions: no canonical mapping found for '${pageName}'`);
    return pageName;
  };

  // Normalize permissions loaded from database
  const normalizePermissions = (rawPermissions: Permission[]): Permission[] => {
    const normalized = new Map<string, Permission>();
    
    rawPermissions.forEach(permission => {
      const canonical = resolveToCanonical(permission.page_name);
      
      if (normalized.has(canonical)) {
        // Merge permissions, preferring more permissive levels
        const existing = normalized.get(canonical)!;
        const getPermissionLevel = (p1: PermissionLevel, p2: PermissionLevel): PermissionLevel => {
          if (p1 === 'ver_modificar' || p2 === 'ver_modificar') return 'ver_modificar';
          if (p1 === 'ver_somente' || p2 === 'ver_somente') return 'ver_somente';
          return 'bloquear_acesso';
        };
        
        normalized.set(canonical, {
          ...existing,
          page_name: canonical,
          admin_permission: getPermissionLevel(existing.admin_permission, permission.admin_permission),
          director_permission: getPermissionLevel(existing.director_permission, permission.director_permission),
          hr_permission: getPermissionLevel(existing.hr_permission, permission.hr_permission),
          leader_permission: getPermissionLevel(existing.leader_permission, permission.leader_permission),
          user_permission: getPermissionLevel(existing.user_permission, permission.user_permission),
        });
      } else {
        normalized.set(canonical, {
          ...permission,
          page_name: canonical
        });
      }
    });
    
    return Array.from(normalized.values());
  };

  const getPermission = (pageName: string): PermissionLevel => {
    if (!userProfile) {
      console.log(`usePermissions: no user profile, blocking access to '${pageName}'`);
      return 'bloquear_acesso';
    }

    // Resolve to canonical name before searching
    const canonicalName = resolveToCanonical(pageName);
    const permission = permissions.find(p => p.page_name === canonicalName);
    
    if (!permission) {
      console.warn(`🔒 usePermissions: No permission mapping found for '${canonicalName}' (original: '${pageName}')`);
      
      // Admin fallback: if user is admin and no permission is found, default to ver_modificar
      if (userProfile.role === 'admin') {
        console.log(`🔑 usePermissions: Admin fallback applied for '${canonicalName}' - granting 'ver_modificar'`);
        return 'ver_modificar';
      }
      
      console.log(`❌ usePermissions: Blocking access to '${canonicalName}' - no permission found and not admin`);
      return 'bloquear_acesso'; // Default to block access if not found
    }

    // Return appropriate permission based on user's role
    let finalPermission: PermissionLevel;
    switch (userProfile.role) {
      case 'admin':
        finalPermission = permission.admin_permission;
        break;
      case 'director':
        finalPermission = permission.director_permission;
        break;
      case 'hr':
        finalPermission = permission.hr_permission;
        break;
      case 'user':
      default:
        // If user is a leader, use leader_permission; otherwise user_permission
        finalPermission = userProfile.is_leader ? permission.leader_permission : permission.user_permission;
        break;
    }
    
    console.log(`usePermissions: '${canonicalName}' permission for role '${userProfile.role}' (leader: ${userProfile.is_leader}): '${finalPermission}'`);
    return finalPermission;
  };

  const canView = (pageName: string): boolean => {
    const permission = getPermission(pageName);
    return permission === 'ver_modificar' || permission === 'ver_somente';
  };

  const canModify = (pageName: string): boolean => {
    const permission = getPermission(pageName);
    return permission === 'ver_modificar';
  };

  const hasAccess = (pageName: string): boolean => {
    const permission = getPermission(pageName);
    return permission !== 'bloquear_acesso';
  };

  return {
    userProfile,
    permissions,
    loading,
    getPermission,
    canView,
    canModify,
    hasAccess,
    refetch: fetchUserPermissions
  };
};
