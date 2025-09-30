import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrustedDevice {
  id: string;
  device_fingerprint: string;
  device_name: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  is_active: boolean;
}

interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export const useTrustedDevice = () => {
  const [loading, setLoading] = useState(false);
  
  // Local storage keys for fallback
  const STORAGE_KEYS = {
    TRUSTED_DEVICES: 'aksell_trusted_devices',
    DEVICE_FINGERPRINT: 'aksell_device_fingerprint',
    LAST_TRUST_CHECK: 'aksell_last_trust_check'
  };
  
  // Local fallback functions
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);
  
  const getFromLocalStorage = useCallback((key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }, []);
  
  const isDeviceTrustedLocally = useCallback((fingerprint: string) => {
    const trustedDevices = getFromLocalStorage(STORAGE_KEYS.TRUSTED_DEVICES) || {};
    const deviceData = trustedDevices[fingerprint];
    
    if (!deviceData) return false;
    
    // Check if device has expired
    if (deviceData.expiresAt && new Date(deviceData.expiresAt) < new Date()) {
      // Remove expired device
      delete trustedDevices[fingerprint];
      saveToLocalStorage(STORAGE_KEYS.TRUSTED_DEVICES, trustedDevices);
      return false;
    }
    
    return true;
  }, [getFromLocalStorage, saveToLocalStorage, STORAGE_KEYS]);
  
  const saveDeviceLocally = useCallback((fingerprint: string, deviceData: any) => {
    const trustedDevices = getFromLocalStorage(STORAGE_KEYS.TRUSTED_DEVICES) || {};
    trustedDevices[fingerprint] = {
      ...deviceData,
      savedAt: new Date().toISOString(),
      source: 'local_fallback'
    };
    saveToLocalStorage(STORAGE_KEYS.TRUSTED_DEVICES, trustedDevices);
  }, [getFromLocalStorage, saveToLocalStorage, STORAGE_KEYS]);

  // Generate device fingerprint based on browser characteristics
  const generateDeviceFingerprint = useCallback((): DeviceFingerprint => {
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    return {
      userAgent,
      screenResolution,
      timezone,
      language
    };
  }, []);

  // Get readable device name from user agent
  const getDeviceName = useCallback((userAgent: string): string => {
    const ua = userAgent.toLowerCase();
    
    let browser = 'Navegador';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    let os = 'Sistema';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return `${browser} no ${os}`;
  }, []);

  // Generate consistent device fingerprint hash  
  const createDeviceFingerprint = useCallback(async (): Promise<string> => {
    const fingerprint = generateDeviceFingerprint();
    
    try {
      console.log('Creating consistent device fingerprint with data:', {
        userAgent: fingerprint.userAgent.substring(0, 50) + '...',
        screenResolution: fingerprint.screenResolution,
        timezone: fingerprint.timezone,
        language: fingerprint.language
      });

      // Create consistent, padronized fingerprint
      const combined = `${fingerprint.userAgent}|${fingerprint.screenResolution}|${fingerprint.timezone}|${fingerprint.language}`;
      
      // Use TextEncoder for consistent encoding
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      
      // Generate SHA-256 hash for consistency
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Generated consistent fingerprint hash:', hashHex.substring(0, 10) + '...');
      return hashHex;
    } catch (error) {
      console.error('Error generating device fingerprint, using fallback:', error);
      // Fallback: create consistent base64 hash
      const combined = `${fingerprint.userAgent}|${fingerprint.screenResolution}|${fingerprint.timezone}|${fingerprint.language}`;
      const fallbackHash = btoa(combined).replace(/[+/=]/g, '');
      console.log('Using consistent fallback fingerprint hash:', fallbackHash.substring(0, 10) + '...');
      return fallbackHash;
    }
  }, [generateDeviceFingerprint]);

  // Check device trust with local fallback
  const checkDeviceTrust = useCallback(async () => {
    console.log('🔍 Starting anonymous device trust check...');
    setLoading(true);
    
    try {
      // Generate device fingerprint
      const fingerprint = await createDeviceFingerprint();
      console.log('🖨️ Device fingerprint generated:', { fingerprint: fingerprint.substring(0, 10) + '...' });
      
      // First check local storage
      if (isDeviceTrustedLocally(fingerprint)) {
        console.log('✅ Device trusted locally (fallback)');
        return { success: true, trusted: true, source: 'local_fallback' };
      }
      
      // Call edge function for anonymous check
      console.log('📞 Calling edge function for anonymous check...');
      
      const requestBody = {
        action: 'check_anonymous',
        deviceFingerprint: fingerprint
      };
      console.log('📤 ROBUSTNESS TEST - Request body object:', requestBody);
      
      // ROBUST approach with multiple methods
      let result = null;
      let lastError = null;
      
      // Method 1: GET with query parameters (now that function is public)
      try {
        console.log('🔄 MÉTODO 1: Tentando GET com query parameters...');
        const queryParams = new URLSearchParams({
          action: 'check_anonymous',
          deviceFingerprint: fingerprint
        });
        
        const getResponse = await fetch(
          `https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/manage-trusted-device?${queryParams}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg'
            }
          }
        );
        
        console.log('🔄 MÉTODO 1 - Status:', getResponse.status);
        
        if (getResponse.ok) {
          result = await getResponse.json();
          console.log('✅ MÉTODO 1 funcionou!', result);
        } else {
          const errorData = await getResponse.json().catch(() => ({}));
          console.log('❌ MÉTODO 1 falhou:', errorData);
          lastError = errorData;
        }
      } catch (error) {
        console.log('❌ MÉTODO 1 exception:', error);
        lastError = error;
      }
      
      // Method 2: supabase.functions.invoke
      if (!result) {
        try {
          console.log('🔄 MÉTODO 2: Tentando supabase.functions.invoke...');
          const { data, error } = await supabase.functions.invoke('manage-trusted-device', {
            body: requestBody
          });
          
          if (error) {
            console.log('❌ MÉTODO 2 falhou:', error);
            lastError = error;
          } else {
            result = data;
            console.log('✅ MÉTODO 2 funcionou!', result);
          }
        } catch (error) {
          console.log('❌ MÉTODO 2 exception:', error);
          lastError = error;
        }
      }
      
      console.log('📥 ROBUSTNESS RESULT - Final data:', result);
      console.log('📥 ROBUSTNESS RESULT - Final error:', lastError);
      
      if (!result || !result.success) {
        // If Edge Function fails, fall back to local check only
        console.log('❌ Edge Function failed, using local storage only');
        return { success: true, trusted: false, source: 'edge_function_failed' };
      }
      
      // If device is trusted on server, also save locally
      if (result.trusted) {
        saveDeviceLocally(fingerprint, {
          trusted: true,
          deviceName: result.device_name,
          expiresAt: result.expires_at
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Device check failed completely, falling back to untrusted:', error);
      return { success: true, trusted: false, source: 'error_fallback' };
    } finally {
      setLoading(false);
    }
  }, [createDeviceFingerprint, isDeviceTrustedLocally, saveDeviceLocally]);

  // Trust device with duration and local fallback
  const trustDevice = useCallback(async (trustDurationMs: number) => {
    console.log('=== PHASE 1: SIMPLIFIED TRUST DEVICE ===');
    console.log('🚀 Starting simplified trust device process...');
    
    try {
      setLoading(true);
      
      // Calculate expiration
      const expiresAt = new Date(Date.now() + trustDurationMs);
      const trustDuration = {
        ms: trustDurationMs,
        hours: Math.round(trustDurationMs / (1000 * 60 * 60)),
        expiresAt: expiresAt.toISOString()
      };
      console.log('⏰ Trust duration calculated:', trustDuration);
      
      // Get current session
      console.log('🔑 Getting current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No valid session found');
      }
      
      console.log('✅ Session obtained, user:', session.user.email);
      console.log('🔑 Token length:', session.access_token.length);
      
      // Generate device data
      const fingerprint = await createDeviceFingerprint();
      const deviceFingerprint = generateDeviceFingerprint();
      const deviceName = getDeviceName(deviceFingerprint.userAgent);
      console.log('🖥️ Device data generated:', {
        fingerprint: fingerprint.substring(0, 10) + '...',
        name: deviceName
      });
      
      // ALWAYS save locally first as fallback
      saveDeviceLocally(fingerprint, {
        trusted: true,
        deviceName: deviceName,
        expiresAt: expiresAt.toISOString(),
        userId: session.user.id
      });
      console.log('💾 Device saved locally as fallback');
      
      // Try to save to server using new simplified function
      try {
        const requestData = {
          device_fingerprint: fingerprint,
          days: Math.ceil(trustDurationMs / (24 * 60 * 60 * 1000)), // Convert ms to days
          label: deviceName
        };
        console.log('📤 Calling new simplified edge function with data:', requestData);
        
        const { data, error } = await supabase.functions.invoke('manage-trusted-device', {
          body: requestData,
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          console.log('⚠️ Server save failed, but local save succeeded:', error);
        } else {
          console.log('✅ Device also saved to server successfully:', data);
        }
        
      } catch (serverError) {
        console.log('⚠️ Server save failed, but local save succeeded:', serverError);
      }
      
      console.log('✅ Device trusted successfully (with local fallback)!');
      return { success: true, source: 'local_with_server_attempt' };
      
    } catch (error) {
      console.error('❌ Falha ao registrar trusted device', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createDeviceFingerprint, generateDeviceFingerprint, getDeviceName, saveDeviceLocally]);

  // List user's trusted devices
  const listTrustedDevices = useCallback(async (): Promise<TrustedDevice[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-trusted-device', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Error listing trusted devices:', error);
        toast.error('Erro ao carregar dispositivos confiáveis');
        return [];
      }

      return data?.devices || [];
    } catch (error) {
      console.error('Error listing trusted devices:', error);
      toast.error('Erro ao carregar dispositivos confiáveis');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Revoke trust for a device
  const revokeTrustedDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-trusted-device', {
        body: { action: 'revoke', deviceId }
      });

      if (error) {
        console.error('Error revoking trusted device:', error);
        toast.error('Erro ao revogar dispositivo');
        return false;
      }

      toast.success('Dispositivo revogado com sucesso');
      return true;
    } catch (error) {
      console.error('Error revoking trusted device:', error);
      toast.error('Erro ao revogar dispositivo');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clean up expired devices (admin only)
  const cleanupExpiredDevices = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-trusted-device', {
        body: { action: 'cleanup' }
      });

      if (error) {
        console.error('Error cleaning up expired devices:', error);
        toast.error('Erro ao limpar dispositivos expirados');
        return false;
      }

      toast.success(data?.message || 'Limpeza concluída');
      return true;
    } catch (error) {
      console.error('Error cleaning up expired devices:', error);
      toast.error('Erro ao limpar dispositivos expirados');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    checkDeviceTrust,
    trustDevice,
    listTrustedDevices,
    revokeTrustedDevice,
    cleanupExpiredDevices,
    generateDeviceFingerprint,
    getDeviceName
  };
};