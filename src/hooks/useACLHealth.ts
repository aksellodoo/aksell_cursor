import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ACLIssue {
  department_id: string;
  department_name: string;
  current_acl_hash?: string;
  mismatched_chunks?: number;
  affected_documents?: number;
  document_names?: string[];
  sample_old_acl_hashes?: string[];
  error?: string;
  status?: string;
}

interface ACLHealthReport {
  timestamp: string;
  total_departments: number;
  acl_issues: ACLIssue[];
  summary: {
    documents_with_acl_issues: number;
    chunks_with_acl_issues: number;
    recommendations: string[];
  };
}

export const useACLHealth = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ACLHealthReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkACLHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting ACL health check...');
      
      const { data, error: healthError } = await supabase.functions.invoke('check-acl-health');
      
      if (healthError) {
        console.error('❌ ACL health check failed:', healthError);
        throw healthError;
      }

      console.log('✅ ACL health check completed:', data);
      setReport(data);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Error in ACL health check:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reprocessDocument = async (documentId: string) => {
    try {
      console.log(`🔄 Reprocessing document ${documentId}...`);
      
      // Trigger document reprocessing
      const { data, error: reprocessError } = await supabase.functions.invoke('process-document', {
        body: {
          documentId,
          forceReprocess: true,
          reason: 'ACL_MISMATCH_FIX'
        }
      });

      if (reprocessError) {
        console.error('❌ Document reprocessing failed:', reprocessError);
        throw reprocessError;
      }

      console.log('✅ Document reprocessing initiated:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reprocessar documento';
      console.error('❌ Error reprocessing document:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const hasACLIssues = report && report.summary.documents_with_acl_issues > 0;
  const isHealthy = report && report.summary.documents_with_acl_issues === 0;

  return {
    loading,
    report,
    error,
    hasACLIssues,
    isHealthy,
    checkACLHealth,
    reprocessDocument
  };
};