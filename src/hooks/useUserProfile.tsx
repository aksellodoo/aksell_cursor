import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  status: string | null;
  department_id: string | null;
  is_leader: boolean | null;
  can_change_password: boolean | null;
  // MFA fields (recently added)
  mfa_required?: boolean | null;
  mfa_enforced_at?: string | null;
  mfa_last_verified_at?: string | null;
}


export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else if (data) {
          setProfile(data);
        } else {
          // Auto-create a minimal profile if one doesn't exist
          const minimalProfile = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            role: 'user',
            department: null,
            status: 'active',
            department_id: null,
            is_leader: false,
            can_change_password: true
          };

          try {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert(minimalProfile)
              .select()
              .single();

            if (insertError) {
              console.error('Error creating profile:', insertError);
              setProfile(minimalProfile);
            } else {
              setProfile(newProfile);
            }
          } catch (insertError) {
            console.error('Error creating profile:', insertError);
            setProfile(minimalProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  return { profile, loading };
};