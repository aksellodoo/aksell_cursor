import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const useDocumentHealthCheck = () => {
  const [isChecking, setIsChecking] = useState(false)

  const checkAndCleanStuckDocuments = async () => {
    setIsChecking(true)
    try {
      console.log('🧹 Starting enhanced cleanup of stuck documents...')
      const { data, error } = await supabase.functions.invoke('cleanup-stuck-documents-enhanced')
      
      if (error) {
        console.error('❌ Enhanced cleanup error:', error)
        toast.error('Erro ao verificar documentos travados: ' + error.message)
        return null
      }

      console.log('✅ Enhanced cleanup result:', data)
      
      if (data?.cleaned > 0) {
        const message = `🎉 ${data.cleaned} documento(s) processado(s): ${data.approved || 0} aprovado(s), ${data.rejected || 0} rejeitado(s)`
        toast.success(message)
      } else {
        toast.info('✅ Nenhum documento travado encontrado')
      }

      return data
    } catch (error) {
      console.error('❌ Error in enhanced cleanup:', error)
      toast.error('Erro ao verificar documentos travados')
      return null
    } finally {
      setIsChecking(false)
    }
  }

  // Note: reprocessDocument function was removed as the reprocess-document edge function no longer exists

  // Função para forçar finalização de documento específico
  const forceCleanupDocument = async (documentId: string) => {
    try {
      console.log(`🚨 Force cleanup for document: ${documentId}`)
      const { data, error } = await supabase.functions.invoke('force-cleanup-document', {
        body: { document_id: documentId }
      })

      if (error) {
        console.error('❌ Force cleanup error:', error)
        toast.error('Erro ao finalizar documento: ' + error.message)
        return false
      }

      console.log('✅ Force cleanup result:', data)
      if (data?.success) {
        const doc = data.document
        toast.success(`🎉 Documento ${doc.name} finalizado como ${doc.new_status}`)
        return true
      } else {
        toast.error('Erro ao finalizar documento')
        return false
      }
    } catch (error) {
      console.error('❌ Error in force cleanup:', error)
      toast.error('Erro ao finalizar documento')
      return false
    }
  }

  // Função para reprocessar documentos específicos ou encontrar travados automaticamente
  const reprocessStuckDocument = async (documentId?: string) => {
    try {
      if (documentId) {
        // Opção de reprocessar ou forçar finalização
        console.log(`🚨 Processing specific document: ${documentId}`)
        
        // Primeiro tenta força finalização (mais rápido)
        const forceSuccess = await forceCleanupDocument(documentId)
        if (forceSuccess) {
          return true
        }
        
        // Reprocessamento não está mais disponível
        return false
      } else {
        // Primeiro executar limpeza para encontrar documentos travados
        console.log('🧹 Running cleanup to find stuck documents...')
        const cleanupResult = await checkAndCleanStuckDocuments()
        
        if (cleanupResult?.cleaned > 0) {
          toast.success(`🎉 ${cleanupResult.cleaned} documento(s) travado(s) foram corrigidos!`)
          return true
        } else {
          toast.info('✅ Nenhum documento travado encontrado')
          return false
        }
      }
    } catch (error) {
      console.error('Error in reprocessStuckDocument:', error)
      toast.error('Erro ao processar documentos travados')
      return false
    }
  }

  return {
    isChecking,
    checkAndCleanStuckDocuments,
    reprocessStuckDocument,
    forceCleanupDocument
  }
}