import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncedDataHookResult {
  data: any[];
  columns: string[];
  loading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  totalCount: number;
  lastSyncAt: string | null;
  tableName: string | null;
  dynamicTableName: string | null;
  searchTerm: string;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  columnFilters: Record<string, string>;
  sort: { column: string | null; direction: 'asc' | 'desc' };
  setPagination: (page: number, limit: number) => void;
  setSearchTerm: (term: string) => void;
  setColumnFilters: (filters: Record<string, string>) => void;
  setSort: (column: string | null, direction: 'asc' | 'desc') => void;
  refreshData: () => void;
  forceSyncTable: () => Promise<void>;
  finalizeSyncLogs: (specificLogId?: string) => Promise<void>;
  fetchAllDataForExport: () => Promise<any[]>;
  fetchAllDataIgnoreFilters: () => Promise<any[]>;
  fetchChangesSinceLastSync: () => Promise<any[]>;
  fetchRecordById: (id: string) => Promise<any | null>;
  lastSyncCreated: number;
  lastSyncUpdated: number;
  lastSyncDeleted: number;
  lastSyncLogId: string | null;
  lastSyncType: 'manual' | 'scheduled' | null;
  lastSyncFinishedAt: string | null;
  flagAnomalies: number;
  hasPendingDeletionColumns: boolean;
  hasUnreflectedDeletions: boolean;
  // New deleted records functionality
  deletedRecordsData: any[];
  deletedRecordsLoading: boolean;
  deletedRecordsCount: number;
  fetchDeletedRecords: () => Promise<void>;
  restoreDeletedRecord: (recordId: string) => Promise<void>;
}

export const useProtheusSyncedData = (tableId: string): SyncedDataHookResult => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // New state for deleted records
  const [deletedRecordsData, setDeletedRecordsData] = useState<any[]>([]);
  const [deletedRecordsLoading, setDeletedRecordsLoading] = useState(false);
  const [deletedRecordsCount, setDeletedRecordsCount] = useState(0);
  
  // Data snapshots to prevent clearing and maintain stable state
  const dataSnapshot = useRef<any[]>([]);
  const totalCountSnapshot = useRef<number>(0);
  const columnsSnapshot = useRef<string[]>([]);
  
  // Request ID to prevent out-of-order responses
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncCreated, setLastSyncCreated] = useState<number>(0);
  const [lastSyncUpdated, setLastSyncUpdated] = useState<number>(0);
  const [lastSyncDeleted, setLastSyncDeleted] = useState<number>(0);
  const [lastSyncLogId, setLastSyncLogId] = useState<string | null>(null);
  const [lastSyncType, setLastSyncType] = useState<'manual' | 'scheduled' | null>(null);
  const [lastSyncFinishedAt, setLastSyncFinishedAt] = useState<string | null>(null);
  const [flagAnomalies, setFlagAnomalies] = useState<number>(0);
  const [hasPendingDeletionColumns, setHasPendingDeletionColumns] = useState<boolean>(true);
  const [hasUnreflectedDeletions, setHasUnreflectedDeletions] = useState<boolean>(false);
  const [pagination, setPaginationState] = useState({
    page: 1,
    limit: 50,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tableName, setTableName] = useState<string | null>(null);
  const [dynamicTableName, setDynamicTableName] = useState<string | null>(null);
  const [columnFilters, setColumnFiltersState] = useState<Record<string, string>>({});
  const [sort, setSortState] = useState<{ column: string | null; direction: 'asc' | 'desc' }>({ column: null, direction: 'asc' });
  const { toast } = useToast();

  const fetchTableInfo = async () => {
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('protheus_tables')
        .select('table_name, last_sync_at, create_supabase_table')
        .eq('id', tableId)
        .single();

      if (tableError) throw tableError;
      
      if (!tableInfo.create_supabase_table) {
        throw new Error('Esta tabela não está configurada para sincronização');
      }

      setLastSyncAt(tableInfo.last_sync_at);
      setTableName(tableInfo.table_name);
      return tableInfo.table_name;
    } catch (error: any) {
      setError(error.message);
      return null;
    }
  };

  const fetchDynamicTableName = async (tableName: string) => {
    try {
      const { data: dynamicTable, error: dynamicError } = await supabase
        .from('protheus_dynamic_tables')
        .select('supabase_table_name, table_structure')
        .eq('protheus_table_id', tableId)
        .single();

      if (dynamicError) throw dynamicError;
      setDynamicTableName(dynamicTable.supabase_table_name);
      return dynamicTable;
    } catch (error: any) {
      setError('Tabela de sincronização não encontrada. Execute uma sincronização primeiro.');
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    if (!tableId) return;

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new request with unique ID
    const currentRequestId = ++requestIdRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      console.log('[useProtheusSyncedData] Starting fetchData - Request ID:', currentRequestId);
      setLoading(true);
      setError(null);
      
      // Preserve current data as snapshots (but keep displaying current until new data arrives)
      if (data.length > 0) {
        dataSnapshot.current = data;
        totalCountSnapshot.current = totalCount;
        columnsSnapshot.current = columns;
      }

      const tableName = await fetchTableInfo();
      if (!tableName) return;

      const dynamicTable = await fetchDynamicTableName(tableName);
      if (!dynamicTable) return;

      const tableStructure = dynamicTable.table_structure as any;
      let orderedFields: string[] = [];
      
      if (tableStructure && tableStructure.field_mappings) {
        orderedFields = tableStructure.field_mappings.map((field: any) => field.sanitizedName);
      } else if (tableStructure && tableStructure.columns) {
        orderedFields = Object.keys(tableStructure.columns);
      }

      const supabaseTableName = dynamicTable.supabase_table_name;
      
      // Build where conditions for the new query_dynamic_table function
      const { status, ...filteredColumnFilters } = columnFilters;
      
      // Build where conditions string
      let whereConditions = "pending_deletion = false"; // Exclude deleted records from main view
      
      // Add search term conditions
      if (searchTerm && searchTerm.trim()) {
        const searchColumns = orderedFields.length > 0 ? orderedFields : ['*'];
        const searchConditions = searchColumns
          .filter(col => col !== 'pending_deletion' && col !== 'pending_deletion_at')
          .map(col => `${col}::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`)
          .join(' OR ');
        
        if (searchConditions) {
          whereConditions += ` AND (${searchConditions})`;
        }
      }
      
      // Add column filters
      Object.entries(filteredColumnFilters).forEach(([column, value]) => {
        if (value && value.trim()) {
          whereConditions += ` AND ${column}::text ILIKE '%${value.replace(/'/g, "''")}%'`;
        }
      });
      
      // Build order by clause
      const orderBy = sort.column === 'status' || !sort.column 
        ? null 
        : `${sort.column} ${sort.direction}`;
      
      const rpcParams = {
        p_table_id: tableId,
        p_where_conditions: whereConditions,
        p_order_by: orderBy,
        p_limit: pagination.limit,
        p_offset: (pagination.page - 1) * pagination.limit
      };
      console.debug('useProtheusSyncedData: RPC query_dynamic_table params:', rpcParams);

      const { data: queryResult, error: queryError } = await supabase.rpc('query_dynamic_table', rpcParams);

      // Check if this response is still valid (not superseded by a newer request)
      if (currentRequestId !== requestIdRef.current) {
        console.log('[useProtheusSyncedData] Request superseded, ignoring response for ID:', currentRequestId);
        return;
      }

      if (queryError) {
        console.error('[useProtheusSyncedData] Query error:', queryError);
        throw new Error(`Erro ao consultar dados: ${queryError.message}`);
      }

      // Handle case where function returns error in result
      if (queryResult && typeof queryResult === 'object' && 'error' in queryResult && queryResult.error) {
        console.error('[useProtheusSyncedData] Function returned error:', queryResult.error);
        throw new Error(`Erro na pesquisa: ${queryResult.error}`);
      }

      // Robust data parsing - handle both array format and object format
      let dataArray: any[] = [];
      let fetchedTotalCount = 0;
      
      if (Array.isArray(queryResult)) {
        // Format: [{ data: [...], total_count: N }, ...]
        const firstResult = queryResult[0];
        if (firstResult && typeof firstResult === 'object' && 'data' in firstResult) {
          const resultObj = firstResult as any;
          dataArray = Array.isArray(resultObj.data) ? resultObj.data : [];
          fetchedTotalCount = typeof resultObj.total_count === 'number' ? resultObj.total_count : 0;
        }
      } else if (queryResult && typeof queryResult === 'object' && 'data' in queryResult) {
        // Format: { data: [...], total_count: N }
        const resultObj = queryResult as any;
        dataArray = Array.isArray(resultObj.data) ? resultObj.data : [];
        fetchedTotalCount = typeof resultObj.total_count === 'number' ? resultObj.total_count : 0;
      }
      
      console.log('[useProtheusSyncedData] Data fetched:', dataArray.length, 'records');
      
      // Final check before updating state
      if (currentRequestId === requestIdRef.current) {
        setData(dataArray);
        setTotalCount(fetchedTotalCount);
        dataSnapshot.current = dataArray;
        totalCountSnapshot.current = fetchedTotalCount;
      }
      
      setIsInitialLoading(false);
      setPaginationState(prev => ({
        ...prev,
        totalPages: Math.ceil(fetchedTotalCount / pagination.limit)
      }));

      // Always ensure columns include all keys present in fetched data (including extra/technical fields)
      const keysFromData = dataArray.length > 0 ? Array.from(new Set<string>(dataArray.flatMap((row: any) => Object.keys(row)))) : [];
      const mergedColumns = Array.from(new Set<string>([...(orderedFields || []), ...keysFromData]));
      
      // Check if pending_deletion columns exist using multiple methods
      let pendingDeletionColumnsExist = false;
      
      // Method 1: Check table structure metadata
      if (tableStructure && typeof tableStructure === 'object') {
        if (Array.isArray(tableStructure.field_mappings)) {
          const hasPendingDeletion = tableStructure.field_mappings.some((field: any) => field?.sanitizedName === 'pending_deletion');
          const hasPendingDeletionAt = tableStructure.field_mappings.some((field: any) => field?.sanitizedName === 'pending_deletion_at');
          pendingDeletionColumnsExist = hasPendingDeletion && hasPendingDeletionAt;
        } else if (Array.isArray(tableStructure.columns)) {
          const hasPendingDeletion = tableStructure.columns.some((col: any) => col?.name === 'pending_deletion');
          const hasPendingDeletionAt = tableStructure.columns.some((col: any) => col?.name === 'pending_deletion_at');
          pendingDeletionColumnsExist = hasPendingDeletion && hasPendingDeletionAt;
        }
      }
      
      // Method 2: Fallback to checking data keys (less reliable when table is empty)
      if (!pendingDeletionColumnsExist && dataArray.length > 0) {
        pendingDeletionColumnsExist = keysFromData.includes('pending_deletion') && keysFromData.includes('pending_deletion_at');
      }
      
      // Method 3: Direct probe if still unsure
      if (!pendingDeletionColumnsExist) {
        try {
          const { error: probeError } = await (supabase as any)
            .from(supabaseTableName)
            .select('pending_deletion, pending_deletion_at')
            .limit(1)
            .maybeSingle();
          
          pendingDeletionColumnsExist = !probeError || !probeError.message?.includes('pending_deletion');
        } catch (probeErr) {
          console.warn('⚠️ Failed to probe pending_deletion columns:', probeErr);
        }
      }
      
      setHasPendingDeletionColumns(pendingDeletionColumnsExist);
      
      if (!pendingDeletionColumnsExist) {
        console.warn('⚠️ Missing pending_deletion columns in table. Deleted records may not display correctly.');
      }
      
      if (mergedColumns.length > 0) {
        setColumns(mergedColumns as string[]);
        columnsSnapshot.current = mergedColumns as string[];
      }

    } catch (error: any) {
      console.error('[useProtheusSyncedData] Error fetching synced data:', error);
      
      // Only update error and loading state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setError(error.message);
        
        // Restore snapshot data to prevent UI clearing
        if (dataSnapshot.current.length > 0 && !isInitialLoading) {
          console.log('[useProtheusSyncedData] Restoring snapshot data');
          setData(dataSnapshot.current);
          setTotalCount(totalCountSnapshot.current);
          setColumns(columnsSnapshot.current);
        } else if (isInitialLoading) {
          setData([]);
          setTotalCount(0);
        }
        
        setIsInitialLoading(false);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados sincronizados",
          variant: "destructive",
        });
      }
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
      
      // Clean up abort controller
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [tableId, searchTerm, columnFilters, pagination.page, pagination.limit, sort.column, sort.direction]);

  const setPagination = (page: number, limit: number) => {
    setPaginationState(prev => ({ ...prev, page, limit }));
  };

  const setColumnFilters = (filters: Record<string, string>) => {
    setColumnFiltersState(filters);
    setPaginationState(prev => ({ ...prev, page: 1 }));
  };

  const setSort = (column: string | null, direction: 'asc' | 'desc') => {
    setSortState({ column, direction });
    setPaginationState(prev => ({ ...prev, page: 1 }));
  };

  const refreshData = () => {
    fetchData();
  };

  // Fetch deleted records (records with pending_deletion = true)
  const fetchDeletedRecords = useCallback(async () => {
    if (!tableId) return;

    try {
      setDeletedRecordsLoading(true);
      
      const tableName = await fetchTableInfo();
      if (!tableName) return;

      const dynamicTable = await fetchDynamicTableName(tableName);
      if (!dynamicTable) return;

      const supabaseTableName = dynamicTable.supabase_table_name;
      
      // Query for deleted records using the new query_dynamic_table function
      const { data: queryResult, error: queryError } = await supabase.rpc('query_dynamic_table', {
        p_table_id: tableId,
        p_where_conditions: 'pending_deletion = true',
        p_order_by: 'pending_deletion_at DESC',
        p_limit: 1000, // Show more deleted records
        p_offset: 0
      });

      if (queryError) {
        console.error('[fetchDeletedRecords] Query error:', queryError);
        throw new Error(`Erro ao consultar registros apagados: ${queryError.message}`);
      }

      // Parse the result similar to fetchData
      let dataArray: any[] = [];
      let fetchedTotalCount = 0;
      
      if (Array.isArray(queryResult)) {
        const firstResult = queryResult[0];
        if (firstResult && typeof firstResult === 'object' && 'data' in firstResult) {
          const resultObj = firstResult as any;
          dataArray = Array.isArray(resultObj.data) ? resultObj.data : [];
          fetchedTotalCount = typeof resultObj.total_count === 'number' ? resultObj.total_count : 0;
        }
      } else if (queryResult && typeof queryResult === 'object' && 'data' in queryResult) {
        const resultObj = queryResult as any;
        dataArray = Array.isArray(resultObj.data) ? resultObj.data : [];
        fetchedTotalCount = typeof resultObj.total_count === 'number' ? resultObj.total_count : 0;
      }
      
      setDeletedRecordsData(dataArray);
      setDeletedRecordsCount(fetchedTotalCount);
    } catch (error: any) {
      console.error('[fetchDeletedRecords] Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar registros apagados",
        variant: "destructive",
      });
    } finally {
      setDeletedRecordsLoading(false);
    }
  }, [tableId, toast]);

  // Restore a deleted record (set pending_deletion = false)
  const restoreDeletedRecord = useCallback(async (recordId: string) => {
    if (!tableId || !dynamicTableName) return;

    try {
      const { error } = await (supabase as any)
        .from(dynamicTableName)
        .update({ 
          pending_deletion: false,
          pending_deletion_at: null 
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Registro restaurado",
        description: "O registro foi restaurado com sucesso",
      });

      // Refresh both views
      refreshData();
      fetchDeletedRecords();
    } catch (error: any) {
      console.error('[restoreDeletedRecord] Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao restaurar registro",
        variant: "destructive",
      });
    }
  }, [tableId, dynamicTableName, toast, refreshData, fetchDeletedRecords]);

  // Separate fetchLastSyncStats to run independently and avoid interfering with main data flow
  const fetchLastSyncStatsIndependent = useCallback(async () => {
    try {
      // Get the latest sync log for this table
      const { data: latest } = await supabase
        .from('protheus_sync_logs')
        .select('id, sync_type, records_created, records_updated, records_deleted, finished_at')
        .eq('protheus_table_id', tableId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) return;

      // Always set base info from the log
      setLastSyncLogId(latest.id || null);
      setLastSyncType((latest.sync_type as 'manual' | 'scheduled') || null);
      setLastSyncFinishedAt(latest.finished_at || null);

      // Set simple counters from the log (avoid complex queries that might interfere)
      setLastSyncCreated(latest.records_created || 0);
      setLastSyncUpdated(latest.records_updated || 0);
      setLastSyncDeleted(latest.records_deleted || 0);

    } catch (e) {
      console.warn('Failed to fetch sync stats independently', e);
    }
  }, [tableId]);

  const fetchLastSyncStats = async () => {
    try {
      // Get the latest sync log for this table
      const { data: latest } = await supabase
        .from('protheus_sync_logs')
        .select('id, sync_type, records_created, records_updated, records_deleted, finished_at')
        .eq('protheus_table_id', tableId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest) return;

      // Always set base info from the log
      setLastSyncLogId(latest.id || null);
      setLastSyncType((latest.sync_type as 'manual' | 'scheduled') || null);
      setLastSyncFinishedAt(latest.finished_at || null);

      // Derive accurate counters from the dynamic table using last_sync_id and flags
      let createdCount = latest.records_created || 0;
      let updatedCount = latest.records_updated || 0;
      let deletedCount = latest.records_deleted || 0;

      try {
        const tableName = await fetchTableInfo();
        if (tableName) {
          const dynamicTable = await fetchDynamicTableName(tableName);
          const supabaseTableName = dynamicTable?.supabase_table_name as string | undefined;

          if (supabaseTableName && latest.id) {
            // Count records created in the last sync - must have both conditions
            // AND ensure they were actually created in this specific sync
            const { count: cCount, error: cErr } = await (supabase as any)
              .from(supabaseTableName)
              .select('id', { count: 'exact', head: true })
              .eq('last_sync_id', latest.id)
              .eq('is_new_record', true);

            if (cErr) {
              console.warn('Error counting new records:', cErr);
              createdCount = latest.records_created || 0;
            } else {
              // Se o log mostra 0 criados, sempre use 0 (confie no log)
              // Caso contrário, use a contagem da tabela
              createdCount = (latest.records_created === 0) ? 0 : (cCount || 0);
            }

            // Count records updated in the last sync (exclude new ones)
            const { count: uCount, error: uErr } = await (supabase as any)
              .from(supabaseTableName)
              .select('id', { count: 'exact', head: true })
              .eq('last_sync_id', latest.id)
              .eq('was_updated_last_sync', true)
              .neq('is_new_record', true);

            if (uErr) {
              console.warn('Error counting updated records:', uErr);
              updatedCount = latest.records_updated || 0;
            } else {
              // Se o log mostra 0 atualizados, sempre use 0 (confie no log)
              // Caso contrário, use a contagem da tabela
              updatedCount = (latest.records_updated === 0) ? 0 : (uCount || 0);
            }
          }
        }
      } catch (innerErr) {
        console.warn('Falling back to log counters due to count error:', innerErr);
        // Keep the fallback values already set above
      }

      // Handle deleted records
      deletedCount = latest.records_deleted || 0;
      
      // Check for unreflected deletions (handle missing column gracefully)
      try {
        const { count: unreflectedCount } = await supabase
          .from('protheus_sync_deletions')
          .select('*', { count: 'exact', head: true })
          .eq('protheus_table_id', tableId)
          .is('reflected_in_supabase_table', false);

        setHasUnreflectedDeletions((unreflectedCount || 0) > 0);
      } catch (reflectedErr: any) {
        // If column doesn't exist, assume no unreflected deletions
        console.warn('reflected_in_supabase_table column not found, assuming no unreflected deletions');
        setHasUnreflectedDeletions(false);
      }
      // If no deleted count in log, check protheus_sync_deletions as fallback
      if (deletedCount === 0) {
        try {
          const { count: dCount, error: dErr } = await supabase
            .from('protheus_sync_deletions')
            .select('*', { count: 'exact', head: true })
            .eq('sync_log_id', latest.id);

          if (!dErr) {
            deletedCount = dCount || 0;
          }
        } catch (e) {
          console.warn('Error counting deletions:', e);
        }
      }

      setLastSyncCreated(createdCount);
      setLastSyncUpdated(updatedCount);
      setLastSyncDeleted(deletedCount);

      // Check for flag anomalies - records with is_new_record=true but different last_sync_id
      await checkFlagAnomalies();
    } catch (e) {
      console.warn('Failed to fetch last sync stats', e);
    }
  };

  const checkFlagAnomalies = async () => {
    try {
      const tableName = await fetchTableInfo();
      if (!tableName) return;
      
      const dynamicTable = await fetchDynamicTableName(tableName);
      const supabaseTableName = dynamicTable?.supabase_table_name;
      
      if (!supabaseTableName || !lastSyncLogId) return;

      // Count records that have is_new_record=true but last_sync_id different from current sync
      const { count, error } = await (supabase as any)
        .from(supabaseTableName)
        .select('id', { count: 'exact', head: true })
        .eq('is_new_record', true)
        .neq('last_sync_id', lastSyncLogId);

      if (error) {
        console.warn('Error checking flag anomalies:', error);
        setFlagAnomalies(0);
      } else {
        setFlagAnomalies(count || 0);
      }
    } catch (e) {
      console.warn('Failed to check flag anomalies', e);
      setFlagAnomalies(0);
    }
  };

  const fetchAllDataForExport = async (): Promise<any[]> => {
    if (!tableId) return [];

    try {
      const tableName = await fetchTableInfo();
      if (!tableName) return [];

      const dynamicTable = await fetchDynamicTableName(tableName);
      if (!dynamicTable) return [];

      const supabaseTableName = dynamicTable.supabase_table_name;
      
      const { data: queryResult, error: queryError } = await supabase.rpc('query_dynamic_table', {
        table_name_param: supabaseTableName,
        search_term: searchTerm || '',
        column_filters: columnFilters,
        limit_param: 999999,
        offset_param: 0,
        sort_column: sort.column,
        sort_direction: sort.direction
      });

      if (queryError) {
        throw new Error(`Erro ao consultar dados: ${queryError.message}`);
      }

      return (queryResult as any)?.data || [];

    } catch (error: any) {
      console.error('Error fetching all data for export:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar dados para exportação",
        variant: "destructive",
      });
      return [];
    }
  };

  // Debounced effect for search and filters
  const debouncedFetchData = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchData();
      }, 300);
    };
  }, [fetchData]);

  // Finalize sync logs function
  const finalizeSyncLogs = useCallback(async (specificLogId?: string): Promise<void> => {
    if (!tableId) return;
    
    try {
      console.log("🔧 Finalizing sync logs for table:", tableId);
      
      const { data, error } = await supabase.functions.invoke('finalize-protheus-sync-logs', {
        body: specificLogId ? { syncLogId: specificLogId } : { tableId }
      });
      
      if (error) {
        throw new Error(error.message || 'Falha ao finalizar logs');
      }
      
      console.log("✅ Sync logs finalized:", data);
      
      // Refresh data after finalizing
      await fetchData();
      
      toast({
        title: "Logs finalizados",
        description: "Logs de sincronização finalizados com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar logs';
      console.error("Finalize logs error:", err);
      
      toast({
        title: "Erro ao finalizar logs",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [tableId, supabase, fetchData, toast]);

  const forceSyncTable = async () => {
    try {
      setLoading(true);
      
      // Step 1: Check if soft-delete columns already exist
      console.log('🔍 Checking if soft-delete columns exist...');
      const { checkSoftDeleteColumns } = await import('@/utils/protheusSoftDelete');
      const columnsExist = await checkSoftDeleteColumns(tableId);
      
      if (!columnsExist) {
        console.log('🔧 Adding missing soft-delete columns...');
        const { data: columnsResult, error: columnsError } = await supabase.functions.invoke(
          'add-pending-deletion-columns',
          {
            body: { tableId }
          }
        );

        if (columnsError || !columnsResult?.success) {
          throw new Error(`Erro ao preparar colunas: ${columnsResult?.error || columnsError?.message}`);
        }
      } else {
        console.log('✅ Soft-delete columns already exist, skipping column creation.');
      }

      // Step 2: Wait for column to be visible to PostgREST with retry/backoff
      const tableName = await fetchTableInfo();
      const dynamicTable = await fetchDynamicTableName(tableName);
      const dynamicTableName = dynamicTable?.supabase_table_name;
      
      if (!dynamicTableName) {
        throw new Error('Erro ao obter nome da tabela dinâmica');
      }

      console.log('⏳ Waiting for schema reload and column availability...');
      // Wait a fixed amount of time for schema to reload, then verify with retries
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify column exists with simple retry mechanism
      let columnCheckPassed = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          // Try to query the table with the pending_deletion column
          const { error: testError } = await (supabase as any)
            .from(dynamicTableName)
            .select('pending_deletion')
            .limit(1)
            .maybeSingle();
          
          if (!testError) {
            columnCheckPassed = true;
            console.log(`✅ Column check passed on attempt ${attempt}`);
            break;
          } else if (testError.message.includes('pending_deletion')) {
            console.log(`⏳ Attempt ${attempt}/5: Column not yet available, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            // Some other error, ignore and continue
            columnCheckPassed = true;
            break;
          }
        } catch (e) {
          console.log(`⏳ Attempt ${attempt}/5: Error checking column, waiting...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!columnCheckPassed) {
        console.warn('⚠️ Column availability check timed out, proceeding anyway...');
      }

      // Step 3: Execute sync with retry logic for schema cache errors
      let syncResult;
      let syncError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { data: result, error } = await supabase.functions.invoke(
          'sync-protheus-table',
          {
            body: {
              tableId: tableId,
              forceFullSync: true,
              skipBinary: true // Skip binary fields for manual force syncs
            }
          }
        );

        if (!error && result?.success) {
          syncResult = result;
          syncError = null;
          break;
        }

        const errorMessage = result?.error || error?.message || '';
        if (/schema cache|pending_deletion/i.test(errorMessage) && attempt < 3) {
          console.log(`⚠️ Schema cache error on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        syncError = error;
        syncResult = result;
        break;
      }

      if (syncError || !syncResult?.success) {
        // Even if sync failed, try to finalize logs in case data was partially synced
        console.log("🔧 Attempting to finalize logs despite sync error...");
        await finalizeSyncLogs();
        throw new Error(syncResult?.error || 'Erro na sincronização');
      }

      // Step 4: Execute finalization
      const { data: finalizeRes, error: finalizeErr } = await supabase.functions.invoke(
        'finalize-protheus-sync-flags',
        {
          body: { tableId }
        }
      );

      if (finalizeErr || !finalizeRes?.success) {
        console.warn('Finalize flags returned warning:', finalizeErr || finalizeRes?.error);
      }

      // Always try to finalize logs after sync using the tableId approach
      console.log("🔧 Finalizing sync logs after successful sync...");
      const { data: finalizeLogsRes, error: finalizeLogsErr } = await supabase.functions.invoke(
        'finalize-protheus-sync-logs',
        {
          body: { tableId }
        }
      );
      
      if (finalizeLogsErr || !finalizeLogsRes?.success) {
        console.warn('Failed to finalize sync logs:', finalizeLogsErr || finalizeLogsRes?.error);
      }

      toast({
        title: "Sincronização Concluída",
        description: `${syncResult.stats?.processed || 0} registros processados${finalizeRes?.stats?.updated_in_window != null ? `, ${finalizeRes.stats.updated_in_window} marcados como alterados` : ''}`,
      });

      await fetchData();

    } catch (error: any) {
      console.error('Error forcing sync:', error);
      toast({
        title: "Erro na Sincronização",
        description: error.message || "Erro ao sincronizar tabela",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDataIgnoreFilters = async (): Promise<any[]> => {
    if (!tableId) return [];
    try {
      const tableName = await fetchTableInfo();
      if (!tableName) return [];
      const dynamicTable = await fetchDynamicTableName(tableName);
      if (!dynamicTable) return [];
      const supabaseTableName = dynamicTable.supabase_table_name;
      const { data: queryResult, error: queryError } = await supabase.rpc('query_dynamic_table', {
        table_name_param: supabaseTableName,
        search_term: '',
        column_filters: {},
        limit_param: 999999,
        offset_param: 0,
        sort_column: sort.column,
        sort_direction: sort.direction
      });
      if (queryError) throw new Error(`Erro ao consultar dados: ${queryError.message}`);
      return (queryResult as any)?.data || [];
    } catch (error: any) {
      console.error('Error fetching all data (ignore filters):', error);
      toast({ title: 'Erro', description: 'Erro ao buscar dados (todos)', variant: 'destructive' });
      return [];
    }
  };

  const fetchChangesSinceLastSync = async (): Promise<any[]> => {
    if (!tableId) return [];
    try {
      const tableName = await fetchTableInfo();
      if (!tableName) return [];
      const dynamicTable = await fetchDynamicTableName(tableName);
      if (!dynamicTable) return [];
      const supabaseTableName = dynamicTable.supabase_table_name as string;

      // Fetch the latest sync id to scope changes to the last run
      const { data: latest } = await supabase
        .from('protheus_sync_logs')
        .select('id')
        .eq('protheus_table_id', tableId)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest?.id) return [];

      const { data: createdRows, error: cErr } = await (supabase as any)
        .from(supabaseTableName)
        .select('*')
        .eq('last_sync_id', latest.id)
        .eq('is_new_record', true)
        .limit(999999);

      if (cErr) throw cErr;

      const { data: updatedRows, error: uErr } = await (supabase as any)
        .from(supabaseTableName)
        .select('*')
        .eq('last_sync_id', latest.id)
        .eq('was_updated_last_sync', true)
        .eq('is_new_record', false)
        .limit(999999);

      if (uErr) throw uErr;

      return [...(createdRows || []), ...(updatedRows || [])];
    } catch (error: any) {
      console.error('Error fetching changes since last sync:', error);
      toast({ title: 'Erro', description: 'Erro ao buscar alterações da última sincronização', variant: 'destructive' });
      return [];
    }
  };

  const fetchRecordById = async (id: string): Promise<any | null> => {
    if (!tableId || !dynamicTableName) return null;
  
    try {
      // Sanitize the ID
      const safeId = String(id).trim();
      
      // Use direct Supabase query to avoid RPC issues with special characters
      // Need to use type assertion because dynamicTableName is not in the static schema
      const { data: record, error: queryError } = await (supabase as any)
        .from(dynamicTableName)
        .select('*')
        .eq('id', safeId)
        .maybeSingle();

      if (queryError) {
        console.warn(`Primary ID search failed: ${queryError.message}, trying protheus_id fallback`);
        
        // Fallback: try searching by protheus_id in case the record uses a different primary key
        const { data: fallbackRecord, error: fallbackError } = await (supabase as any)
          .from(dynamicTableName)
          .select('*')
          .eq('protheus_id', safeId)
          .maybeSingle();
          
        if (fallbackError) {
          throw new Error(`Erro ao buscar registro: ${fallbackError.message}`);
        }
        
        return fallbackRecord;
      }

      return record;

    } catch (error: any) {
      console.error('Error fetching record by ID:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar registro específico",
        variant: "destructive",
      });
      return null;
    }
  };

  // Stable comparator for filter dependencies to prevent unnecessary re-fetches
  const filtersDeps = useMemo(() => {
    return {
      page: pagination.page,
      limit: pagination.limit,
      searchTerm,
      columnFilters: Object.keys(columnFilters).length > 0 ? columnFilters : {},
      sortColumn: sort.column,
      sortDirection: sort.direction
    };
  }, [pagination.page, pagination.limit, searchTerm, columnFilters, sort.column, sort.direction]);

  useEffect(() => {
    if (tableId) {
      debouncedFetchData();
    }
  }, [tableId, filtersDeps, debouncedFetchData]);

  // Separate effect for sync stats that runs less frequently  
  useEffect(() => {
    if (tableId) {
      const timer = setTimeout(() => {
        fetchLastSyncStats();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [tableId]);

  return {
    data,
    columns,
    loading,
    isInitialLoading,
    error,
    totalCount,
    lastSyncAt,
    tableName,
    dynamicTableName,
    searchTerm,
    pagination,
    columnFilters,
    sort,
    setPagination,
    setSearchTerm,
    setColumnFilters,
    setSort,
    refreshData,
    forceSyncTable,
    finalizeSyncLogs,
    fetchAllDataForExport,
    fetchAllDataIgnoreFilters,
    fetchChangesSinceLastSync,
    fetchRecordById,
    lastSyncCreated,
    lastSyncUpdated,
    lastSyncDeleted,
    lastSyncLogId,
    lastSyncType,
    lastSyncFinishedAt,
    flagAnomalies,
    hasPendingDeletionColumns,
    hasUnreflectedDeletions,
    // New deleted records functionality
    deletedRecordsData,
    deletedRecordsLoading,
    deletedRecordsCount,
    fetchDeletedRecords,
    restoreDeletedRecord
  };
};
