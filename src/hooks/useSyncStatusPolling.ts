import { useState, useEffect, useRef } from 'react';

export interface SyncLog {
  id: string;
  status: string;
  sync_type: string;
  records_created: number;
  records_updated: number;
  records_deleted: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  excluded_binary_fields: string[];
  binary_download_errors: number;
}

interface UseSyncStatusPollingResult {
  currentSync: SyncLog | null;
  isPolling: boolean;
  isLongRunning: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  forceTerminate: () => Promise<void>;
}

export const useSyncStatusPolling = (tableId: string): UseSyncStatusPollingResult => {
  const [currentSync, setCurrentSync] = useState<SyncLog | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isLongRunning, setIsLongRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchLatestSync = async (): Promise<SyncLog | null> => {
    if (!tableId || !mountedRef.current) return null;

    try {
      console.log(`[SyncPolling] Fetching latest sync for table ${tableId}`);
      
      // Use fetch directly to avoid Supabase type issues
      const url = `https://nahyrexnxhzutfeqxjte.supabase.co/rest/v1/protheus_sync_logs?protheus_table_id=eq.${tableId}&select=id,status,sync_type,records_created,records_updated,records_deleted,started_at,finished_at,error_message&order=started_at.desc&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error fetching sync log:', response.statusText);
        return null;
      }

      const data = await response.json();
      const syncLogData = data[0];

      if (syncLogData && mountedRef.current) {
        const syncWithErrors: SyncLog = {
          id: syncLogData.id,
          status: syncLogData.status || 'running',
          sync_type: syncLogData.sync_type || 'manual',
          records_created: syncLogData.records_created || 0,
          records_updated: syncLogData.records_updated || 0,
          records_deleted: syncLogData.records_deleted || 0,
          started_at: syncLogData.started_at,
          finished_at: syncLogData.finished_at,
          error_message: syncLogData.error_message,
          excluded_binary_fields: [],
          binary_download_errors: 0,
        };

        // Check if sync is long-running (>10 minutes)
        const isLongRunningSync = syncWithErrors.status === 'running' && 
          syncWithErrors.started_at && 
          new Date().getTime() - new Date(syncWithErrors.started_at).getTime() > 10 * 60 * 1000;
        
        if (mountedRef.current) {
          setIsLongRunning(isLongRunningSync || false);
          setCurrentSync(syncWithErrors);
        }

        console.log(`[SyncPolling] Current sync status: ${syncWithErrors.status}, long running: ${isLongRunningSync}`);
        return syncWithErrors;
      }

      return null;
    } catch (error) {
      console.error('Error fetching latest sync:', error);
      return null;
    }
  };

  const startPolling = () => {
    if (isPolling || !mountedRef.current) return;

    console.log('[SyncPolling] Starting sync status polling for table:', tableId);
    setIsPolling(true);
    
    // Initial fetch
    fetchLatestSync();

    // Start polling every 5 seconds
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      fetchLatestSync().then(sync => {
        // Stop polling if sync is completed or failed
        if (sync && (sync.status === 'completed' || sync.status === 'failed')) {
          console.log('[SyncPolling] Sync completed or failed, stopping polling');
          if (mountedRef.current) {
            setIsPolling(false);
          }
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }).catch(error => {
        console.error('Error in polling:', error);
      });
    }, 5000);
  };

  const stopPolling = () => {
    console.log('[SyncPolling] Stopping sync status polling');
    if (mountedRef.current) {
      setIsPolling(false);
      setIsLongRunning(false);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const forceTerminate = async () => {
    if (!currentSync?.id) return;

    try {
      const response = await fetch(`https://nahyrexnxhzutfeqxjte.supabase.co/functions/v1/finalize-protheus-sync-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haHlyZXhueGh6dXRmZXF4anRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDAwMjksImV4cCI6MjA3MTM3NjAyOX0.PoT9gaGRaS6XEvUxlakJA9LIZ66aVSjNFEOFfR0qOsg`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          syncLogId: currentSync.id,
          forceTerminate: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Sync force terminated successfully');
      
      // Refresh sync status immediately
      if (mountedRef.current) {
        await fetchLatestSync();
      }
    } catch (error) {
      console.error('Failed to force terminate sync:', error);
      throw error;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentSync,
    isPolling,
    isLongRunning,
    startPolling,
    stopPolling,
    forceTerminate,
  };
};