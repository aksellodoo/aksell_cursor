import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedSupplier {
  id: string;
  fu_id: string;
  status: 'potential_only' | 'supplier' | 'potential_and_supplier' | 'archived';
  potential_supplier_id?: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  economic_group_id?: string;
  cnpj?: string;
  attendance_type: 'direct' | 'representative';
  representative_id?: string;
  assigned_buyer_cod?: string;
  assigned_buyer_filial?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  material_types?: { id: string; material_type: string }[];
  tags?: { id: string; name: string }[];
  // Campos dinâmicos calculados pelo backend
  display_name?: string;
  potential_supplier?: {
    trade_name: string;
    legal_name: string;
  };
  protheus_supplier?: {
    a2_nreduz?: string;
    a2_nome?: string;
    a2_cgc?: string;
  };
}

export interface CreateUnifiedSupplierData {
  status?: 'potential_only' | 'supplier' | 'potential_and_supplier' | 'archived';
  potential_supplier_id?: string;
  protheus_filial?: string;
  protheus_cod?: string;
  protheus_loja?: string;
  economic_group_id?: string;
  cnpj?: string;
  attendance_type?: 'direct' | 'representative';
  representative_id?: string;
  assigned_buyer_cod?: string;
  assigned_buyer_filial?: string;
  material_types?: string[];
  tag_ids?: string[];
  tags?: { id: string; name: string }[];
}

export interface SupplierListParams {
  search?: string;
  filters?: Record<string, string>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SupplierListResult {
  suppliers: UnifiedSupplier[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Função para sanitizar payload removendo strings vazias em campos UUID
const sanitizeUnifiedSupplierPayload = (data: CreateUnifiedSupplierData) => {
  const sanitized = { ...data };
  
  // Campos UUID que devem ser null se vazios
  const uuidFields: (keyof CreateUnifiedSupplierData)[] = ['potential_supplier_id', 'representative_id', 'economic_group_id'];
  
  uuidFields.forEach(field => {
    if (sanitized[field] === '') {
      (sanitized as any)[field] = null;
    }
  });
  
  // Se attendance_type não é 'representative', forçar representative_id para null
  if (sanitized.attendance_type === 'direct') {
    (sanitized as any).representative_id = null;
  }
  
  // Normalizar campos Protheus (trim)
  if (sanitized.protheus_filial) {
    sanitized.protheus_filial = sanitized.protheus_filial.trim();
  }
  if (sanitized.protheus_cod) {
    sanitized.protheus_cod = sanitized.protheus_cod.trim();
  }
  if (sanitized.protheus_loja) {
    sanitized.protheus_loja = sanitized.protheus_loja.trim();
  }
  
  // Remover campos undefined
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key as keyof CreateUnifiedSupplierData] === undefined) {
      delete sanitized[key as keyof CreateUnifiedSupplierData];
    }
  });
  
  return sanitized;
};

export const useUnifiedSuppliers = (autoFetch = true) => {
  const [suppliers, setSuppliers] = useState<UnifiedSupplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCallIdRef = useRef<number>(0);
  const { toast } = useToast();

  const fetchSuppliers = async (params: SupplierListParams = {}) => {
    const callId = Date.now();
    lastCallIdRef.current = callId;
    
    try {
      setLoading(true);
      setError(null);

      const {
        search = '',
        filters = {},
        sortBy = 'updated_at',
        sortDirection = 'desc',
        page = 1,
        pageSize = 50
      } = params;

      console.log('Fetching suppliers with params:', { search, filters, sortBy, sortDirection, page, pageSize });

      // Normalize search terms
      const normalizedSearchTerm = search?.trim().toLowerCase() || '';
      const normalizedCnpjSearch = normalizedSearchTerm.replace(/\D/g, '');
      const normalizedCnpjFilter = filters.cnpj?.replace(/\D/g, '') || '';

      // Step 1: Build auxiliary searches for server-side filtering
      let potentialSupplierIds: string[] = [];
      let protheusCodes: string[] = [];
      let groupIds: string[] = [];

      // Search in potential suppliers by name if search term contains letters
      if (normalizedSearchTerm && /[a-zA-Z]/.test(normalizedSearchTerm)) {
        console.log('Searching potential suppliers by name:', normalizedSearchTerm);
        const { data: potentialMatches } = await supabase
          .from('purchases_potential_suppliers')
          .select('id')
          .or(`trade_name.ilike.%${normalizedSearchTerm}%,legal_name.ilike.%${normalizedSearchTerm}%`);
        
        if (potentialMatches && potentialMatches.length > 0) {
          potentialSupplierIds = potentialMatches.map(p => p.id);
          console.log('Found potential supplier IDs:', potentialSupplierIds.length);
        }
      }

      // Search in potential suppliers by display_name filter
      if (filters.display_name) {
        const displayNameTerm = filters.display_name.toLowerCase();
        console.log('Filtering potential suppliers by display_name:', displayNameTerm);
        const { data: nameMatches } = await supabase
          .from('purchases_potential_suppliers')
          .select('id')
          .or(`trade_name.ilike.%${displayNameTerm}%,legal_name.ilike.%${displayNameTerm}%`);
        
        if (nameMatches && nameMatches.length > 0) {
          const nameIds = nameMatches.map(p => p.id);
          potentialSupplierIds = [...new Set([...potentialSupplierIds, ...nameIds])];
          console.log('Updated potential supplier IDs after display_name filter:', potentialSupplierIds.length);
        }
      }

      // Search in protheus suppliers by name and CNPJ
      const protheusSearchConditions = [];
      if (normalizedSearchTerm && /[a-zA-Z]/.test(normalizedSearchTerm)) {
        protheusSearchConditions.push(`a2_nome.ilike.%${normalizedSearchTerm}%`);
        protheusSearchConditions.push(`a2_nreduz.ilike.%${normalizedSearchTerm}%`);
      }
      if (normalizedCnpjSearch) {
        protheusSearchConditions.push(`a2_cgc.ilike.%${normalizedCnpjSearch}%`);
      }
      if (normalizedCnpjFilter) {
        protheusSearchConditions.push(`a2_cgc.ilike.%${normalizedCnpjFilter}%`);
      }
      if (filters.display_name && /[a-zA-Z]/.test(filters.display_name)) {
        const displayNameTerm = filters.display_name.toLowerCase();
        protheusSearchConditions.push(`a2_nome.ilike.%${displayNameTerm}%`);
        protheusSearchConditions.push(`a2_nreduz.ilike.%${displayNameTerm}%`);
      }

      if (protheusSearchConditions.length > 0) {
        console.log('Searching protheus suppliers with conditions:', protheusSearchConditions);
        const { data: protheusMatches } = await supabase
          .from('protheus_sa2010_72a51158')
          .select('a2_cod')
          .or(protheusSearchConditions.join(','));
        
        if (protheusMatches && protheusMatches.length > 0) {
          protheusCodes = [...new Set(protheusMatches.map(p => p.a2_cod))];
          console.log('Found protheus codes:', protheusCodes.length);
        }
      }

      // Search by material types
      if (filters.material_types) {
        console.log('Filtering by material types:', filters.material_types);
        const { data: materialMatches } = await supabase
          .from('protheus_supplier_material_types_map')
          .select('group_id')
          .ilike('material_type', `%${filters.material_types}%`);
        
        if (materialMatches && materialMatches.length > 0) {
          groupIds = [...new Set(materialMatches.map(m => String(m.group_id)))];
          console.log('Found material type group IDs:', groupIds.length);
        }
      }

      // Step 2: Build main query with server-side filters
      let query = supabase
        .from('purchases_unified_suppliers')
        .select(`
          *,
          potential_supplier:purchases_potential_suppliers(trade_name, legal_name)
        `, { count: 'exact' });

      // Build OR conditions for search
      if (normalizedSearchTerm || potentialSupplierIds.length > 0 || protheusCodes.length > 0) {
        const orConditions = [];
        
        // Root field searches
        if (normalizedSearchTerm) {
          orConditions.push(`fu_id.ilike.%${normalizedSearchTerm}%`);
          orConditions.push(`cnpj.ilike.%${normalizedSearchTerm}%`);
          orConditions.push(`protheus_filial.ilike.%${normalizedSearchTerm}%`);
          orConditions.push(`protheus_cod.ilike.%${normalizedSearchTerm}%`);
          orConditions.push(`protheus_loja.ilike.%${normalizedSearchTerm}%`);
        }
        
        // Potential supplier IDs
        if (potentialSupplierIds.length > 0) {
          orConditions.push(`potential_supplier_id.in.(${potentialSupplierIds.join(',')})`);
        }
        
        // Protheus codes
        if (protheusCodes.length > 0) {
          orConditions.push(`protheus_cod.in.(${protheusCodes.join(',')})`);
        }
        
        if (orConditions.length > 0) {
          console.log('Applying OR conditions:', orConditions.join(','));
          query = query.or(orConditions.join(','));
        }
      }

      // Apply individual column filters with AND logic
      if (filters.cnpj) {
        query = query.ilike('cnpj', `%${normalizedCnpjFilter}%`);
      }

      if (filters.protheus_key) {
        query = query.or(
          `protheus_filial.ilike.%${filters.protheus_key}%,` +
          `protheus_cod.ilike.%${filters.protheus_key}%,` +
          `protheus_loja.ilike.%${filters.protheus_key}%`
        );
      }

      if (filters.fu_id) {
        query = query.ilike('fu_id', `%${filters.fu_id}%`);
      }

      if (filters.status) {
        query = query.ilike('status', `%${filters.status}%`);
      }

      // Filter by suppliers without economic group
      if (filters.without_group === '1' || filters.without_group === 'true') {
        console.log('🔍 Applying without_group filter - showing only suppliers without economic group');
        query = query.eq('has_economic_group', false);
      }

      // Apply material types filter by economic_group_id
      if (groupIds.length > 0) {
        query = query.in('economic_group_id', groupIds);
      }

      // Apply sorting for root fields
      const ascending = sortDirection === 'asc';
      if (['display_name', 'material_types_display'].includes(sortBy)) {
        // Ordenação será aplicada no cliente após enriquecer dados
        query = query.order('updated_at', { ascending: false }); // Ordem padrão para depois ordenar no cliente
      } else {
        query = query.order(sortBy, { ascending });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Check if this is still the latest call
      if (callId !== lastCallIdRef.current) {
        console.log('🚫 Ignoring stale fetch result');
        return;
      }

      // Buscar dados do Protheus para fornecedores que têm códigos
      const protheusSuppliersData: Record<string, any> = {};
      
      if (data && data.length > 0) {
        // Filtrar fornecedores que têm código Protheus
        const protheusCodes = data
          .filter(s => s.protheus_filial && s.protheus_cod && s.protheus_loja)
          .map(s => ({ 
            filial: String(s.protheus_filial || '').trim(), 
            cod: String(s.protheus_cod || '').trim(), 
            loja: String(s.protheus_loja || '').trim() 
          }));

        if (protheusCodes.length > 0) {
          try {
            // Coletar todos os códigos únicos com variantes
            const allCodeVariants = new Set<string>();
            protheusCodes.forEach(p => {
              const trimmedCod = p.cod.trim();
              
              // Adicionar variantes do código:
              // 1. Original trimmed
              allCodeVariants.add(trimmedCod);
              // 2. Zero-padded (6 dígitos)
              allCodeVariants.add(trimmedCod.padStart(6, '0'));
              // 3. Sem zeros à esquerda
              allCodeVariants.add(trimmedCod.replace(/^0+/, '') || '0');
            });

            const codes = Array.from(allCodeVariants);
            console.log(`🔍 Fetching Protheus suppliers: ${codes.length} code variants from ${protheusCodes.length} suppliers...`);
            
            // Fetch em lotes SEM filtro de filial
            let totalResolved = 0;
            const chunkSize = 200;
            for (let i = 0; i < codes.length; i += chunkSize) {
              const chunk = codes.slice(i, i + chunkSize);
              
                  const { data: protheusSuppliersRaw, error: protheusError } = await supabase
                    .from('protheus_sa2010_72a51158')
                    .select('a2_filial, a2_cod, a2_loja, a2_nome, a2_nreduz, a2_cgc')
                    .in('a2_cod', chunk);

              if (!protheusError && protheusSuppliersRaw) {
                protheusSuppliersRaw.forEach((supplier: any) => {
                  // Normalizar códigos Protheus (trim + pad)
                  const trimmedFilial = String(supplier.a2_filial || '').trim();
                  const trimmedCod = String(supplier.a2_cod || '').trim();
                  const trimmedLoja = String(supplier.a2_loja || '').trim();
                  
                  // Criar múltiplas chaves para garantir matches
                  const keys = [
                    // Chave normalizada
                    `${trimmedFilial.padStart(2, '0')}-${trimmedCod.padStart(6, '0')}-${trimmedLoja.padStart(2, '0')}`,
                    // Chave original
                    `${trimmedFilial}-${trimmedCod}-${trimmedLoja}`,
                    // Sem padding
                    `${trimmedFilial}-${trimmedCod.replace(/^0+/, '') || '0'}-${trimmedLoja}`,
                    // Filial normalizada, resto original
                    `${trimmedFilial.padStart(2, '0')}-${trimmedCod}-${trimmedLoja}`
                  ];
                  
                  keys.forEach(key => {
                    protheusSuppliersData[key] = {
                      a2_nome: supplier.a2_nome,
                      a2_nreduz: supplier.a2_nreduz,
                      a2_cgc: supplier.a2_cgc
                    };
                  });
                  
                  totalResolved++;
                });
              } else if (protheusError) {
                console.error(`Error fetching Protheus suppliers chunk ${i}-${i + chunkSize}:`, protheusError);
              }
            }

            // Fallback: resolver chaves não encontradas
            const unresolvedKeys: string[] = [];
            protheusCodes.forEach(p => {
              const normalizedFilial = p.filial.padStart(2, '0');
              const normalizedCod = p.cod.padStart(6, '0');
              const normalizedLoja = p.loja.padStart(2, '0');
              const normalizedKey = `${normalizedFilial}-${normalizedCod}-${normalizedLoja}`;
              
              if (!protheusSuppliersData[normalizedKey]) {
                unresolvedKeys.push(normalizedKey);
              }
            });

            if (unresolvedKeys.length > 0) {
              console.log(`🔄 Fallback: resolving ${unresolvedKeys.length} unresolved keys...`);
              
              // Reagrupar chaves não resolvidas por filial
              const fallbackFilialMap: Record<string, string[]> = {};
              unresolvedKeys.forEach(key => {
                const [filial] = key.split('-');
                if (!fallbackFilialMap[filial]) {
                  fallbackFilialMap[filial] = [];
                }
                fallbackFilialMap[filial].push(key.split('-')[1]); // cod
              });

              for (const [filial, cods] of Object.entries(fallbackFilialMap)) {
                // Chunks menores para fallback
                const chunkSize = 50;
                for (let i = 0; i < cods.length; i += chunkSize) {
                  const chunk = cods.slice(i, i + chunkSize);
                  
                  const { data: fallbackData, error: fallbackError } = await supabase
                    .from('protheus_sa2010_72a51158')
                    .select('a2_filial, a2_cod, a2_loja, a2_nome, a2_nreduz, a2_cgc')
                    .eq('a2_filial', filial)
                    .in('a2_cod', chunk);

                  if (!fallbackError && fallbackData) {
                    fallbackData.forEach((supplier: any) => {
                      const trimmedFilial = String(supplier.a2_filial || '').trim();
                      const trimmedCod = String(supplier.a2_cod || '').trim();
                      const trimmedLoja = String(supplier.a2_loja || '').trim();
                      
                      const normalizedFilial = trimmedFilial.padStart(2, '0');
                      const normalizedCod = trimmedCod.padStart(6, '0');
                      const normalizedLoja = trimmedLoja.padStart(2, '0');
                      
                      const normalizedKey = `${normalizedFilial}-${normalizedCod}-${normalizedLoja}`;
                      protheusSuppliersData[normalizedKey] = {
                        a2_nome: supplier.a2_nome,
                        a2_nreduz: supplier.a2_nreduz,
                        a2_cgc: supplier.a2_cgc
                      };
                      
                      const originalKey = `${trimmedFilial}-${trimmedCod}-${trimmedLoja}`;
                      protheusSuppliersData[originalKey] = {
                        a2_nome: supplier.a2_nome,
                        a2_nreduz: supplier.a2_nreduz,
                        a2_cgc: supplier.a2_cgc
                      };
                      
                      totalResolved++;
                    });
                  }
                }
              }
            }

            const finalUnresolved = protheusCodes.length - totalResolved;
            console.log(`✅ Protheus fetch complete: ${totalResolved} resolved, ${finalUnresolved} unresolved`);
            
          } catch (error) {
            console.error('Error fetching Protheus supplier data:', error);
          }
        }
      }
      
      // Buscar tipos de material e tags para cada fornecedor
      const suppliersWithMaterialTypesAndTags = await Promise.all(
        (data || []).map(async (supplier) => {
          try {
            let materialTypes = [];
            let tags = [];

            // Buscar tipos de material: PRIMEIRO na nova tabela por fornecedor unificado
            const { data: unifiedMaterialMaps, error: unifiedMaterialError } = await supabase
              .from('purchases_unified_supplier_material_types')
              .select(`
                material_type_id,
                material_type:purchases_material_types(id, name)
              `)
              .eq('supplier_id', supplier.id);
            
            if (!unifiedMaterialError && unifiedMaterialMaps && unifiedMaterialMaps.length > 0) {
              // Usar tipos específicos do fornecedor unificado
              materialTypes = unifiedMaterialMaps.map((m: any) => ({
                id: m.material_type_id,
                material_type: m.material_type?.name || ''
              })).filter(m => m.material_type) || [];
            } else {
              // FALLBACK: buscar por grupo econômico ou potencial fornecedor
              if (supplier.economic_group_id) {
                const { data: materialTypeMaps, error: materialError } = await supabase
                  .from('purchases_supplier_group_material_types')
                  .select(`
                    material_type_id,
                    material_type:purchases_material_types(id, name)
                  `)
                  .eq('group_id', supplier.economic_group_id);
                
                if (materialError) {
                  console.error('Error fetching material types:', materialError);
                } else {
                  materialTypes = materialTypeMaps?.map((m: any) => ({
                    id: m.material_type_id,
                    material_type: m.material_type?.name || ''
                  })).filter(m => m.material_type) || [];
                }
              } else if (supplier.potential_supplier_id) {
                // Fallback: buscar tipos de material do potencial fornecedor se não houver grupo
                const { data: potentialMaterialMaps, error: potentialMaterialError } = await supabase
                  .from('purchases_potential_supplier_material_types')
                  .select(`
                    material_type_id,
                    material_type:purchases_material_types(id, name)
                  `)
                  .eq('supplier_id', supplier.potential_supplier_id);
                
                if (!potentialMaterialError && potentialMaterialMaps) {
                  materialTypes = potentialMaterialMaps?.map((m: any) => ({
                    id: m.material_type_id,
                    material_type: m.material_type?.name || ''
                  })).filter(m => m.material_type) || [];
                }
              }
            }

            // Buscar tags do fornecedor
            const { data: supplierTags, error: tagsError } = await supabase
              .from('purchases_unified_supplier_tags')
              .select(`
                tag_id,
                email_tags(id, name)
              `)
              .eq('supplier_id', supplier.id);
            
            if (tagsError) {
              console.error('Error fetching supplier tags:', tagsError);
            } else {
              tags = supplierTags?.map((st: any) => ({
                id: st.email_tags.id,
                name: st.email_tags.name
              })) || [];
            }
            
            // Buscar dados do Protheus se aplicável
            let protheusBatch = null;
            if (supplier.protheus_filial && supplier.protheus_cod && supplier.protheus_loja) {
              // Normalizar códigos para busca
              const trimmedFilial = String(supplier.protheus_filial).trim();
              const trimmedCod = String(supplier.protheus_cod).trim();
              const trimmedLoja = String(supplier.protheus_loja).trim();
              
              // Tentar múltiplas chaves para garantir match
              const possibleKeys = [
                // Chave normalizada
                `${trimmedFilial.padStart(2, '0')}-${trimmedCod.padStart(6, '0')}-${trimmedLoja.padStart(2, '0')}`,
                // Chave original
                `${trimmedFilial}-${trimmedCod}-${trimmedLoja}`,
                // Sem padding de código
                `${trimmedFilial}-${trimmedCod.replace(/^0+/, '') || '0'}-${trimmedLoja}`,
                // Filial normalizada, resto original
                `${trimmedFilial.padStart(2, '0')}-${trimmedCod}-${trimmedLoja}`
              ];
              
              for (const key of possibleKeys) {
                if (protheusSuppliersData[key]) {
                  protheusBatch = protheusSuppliersData[key];
                  break;
                }
              }
            }

            return {
              ...supplier,
              attendance_type: supplier.attendance_type as 'direct' | 'representative',
              material_types: materialTypes,
              tags: tags,
              protheus_supplier: protheusBatch
            };
          } catch (err) {
            console.error('Error processing data for supplier:', supplier.id, err);
            // Buscar dados do Protheus se aplicável (mesmo em caso de erro)
            let protheusBatch = null;
            if (supplier.protheus_filial && supplier.protheus_cod && supplier.protheus_loja) {
              // Normalizar códigos para busca (trim + pad)
              const trimmedFilial = String(supplier.protheus_filial).trim();
              const trimmedCod = String(supplier.protheus_cod).trim();
              const trimmedLoja = String(supplier.protheus_loja).trim();
              
              const normalizedFilial = trimmedFilial.padStart(2, '0');
              const normalizedCod = trimmedCod.padStart(6, '0');
              const normalizedLoja = trimmedLoja.padStart(2, '0');
              const normalizedKey = `${normalizedFilial}-${normalizedCod}-${normalizedLoja}`;
              
              protheusBatch = protheusSuppliersData[normalizedKey];
              
              // Se não encontrar, tentar com códigos trimmed originais
              if (!protheusBatch) {
                const originalKey = `${trimmedFilial}-${trimmedCod}-${trimmedLoja}`;
                protheusBatch = protheusSuppliersData[originalKey];
              }
            }

            return {
              ...supplier,
              attendance_type: (supplier.attendance_type || 'direct') as 'direct' | 'representative',
              material_types: [],
              tags: [],
              protheus_supplier: protheusBatch
            };
          }
        })
      );
      
      // Enrich suppliers with display names and formatted CNPJ for UI
      let enrichedSuppliers = suppliersWithMaterialTypesAndTags.map(supplier => ({
        ...supplier,
        display_name: supplier.protheus_supplier?.a2_nreduz || 
                     supplier.protheus_supplier?.a2_nome || 
                     supplier.potential_supplier?.trade_name || 
                     supplier.potential_supplier?.legal_name || 
                     `Fornecedor ${supplier.fu_id}`,
        cnpj_formatted: supplier.cnpj || supplier.protheus_supplier?.a2_cgc || ''
      }));

      // Apply client-side sorting for display_name only (as it can't be done server-side)
      if (sortBy === 'display_name') {
        enrichedSuppliers.sort((a, b) => {
          const comparison = a.display_name.localeCompare(b.display_name);
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      } else if (sortBy === 'material_types_display') {
        enrichedSuppliers.sort((a, b) => {
          const aValue = a.material_types?.map(mt => mt.material_type).join(', ') || '';
          const bValue = b.material_types?.map(mt => mt.material_type).join(', ') || '';
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        });
      }

      console.log(`✅ Fetched ${enrichedSuppliers.length} suppliers, total count: ${count}`);
      setSuppliers(enrichedSuppliers);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fornecedores unificados';
      console.error('Error fetching unified suppliers:', err);
      setError(errorMessage);
      setSuppliers([]);
      setTotalCount(0);
      setTotalPages(0);
      setCurrentPage(1);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Nova função para gerenciar tipos de material por fornecedor unificado
  const manageSupplierMaterialTypes = async (supplierId: string, materialTypeIds: string[]) => {
    console.log('🔗 Managing unified supplier material types using RPC:', {
      supplierId,
      materialTypeIds
    });

    const { data: result, error } = await supabase.rpc(
      'set_unified_supplier_material_types',
      {
        p_supplier_id: supplierId,
        p_material_type_ids: materialTypeIds
      }
    );

    if (error) {
      console.error('❌ Error managing supplier material types:', error);
      throw error;
    }

    console.log('✅ Supplier material types updated:', result);
  };

  const manageMaterialTypes = async (groupId: string | null, materialTypes: string[], potentialSupplierId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se há grupo econômico, gerencia na tabela de grupos
    if (groupId) {
      // Buscar tipos atuais
      const { data: currentTypes } = await supabase
        .from('purchases_supplier_group_material_types')
        .select('material_type_id, created_by')
        .eq('group_id', groupId);

      const currentTypeIds = new Set(currentTypes?.map(t => t.material_type_id) || []);
      const newTypeIds = new Set(materialTypes);

      // Verificar se há mudanças (otimização)
      const hasChanges = materialTypes.some(id => !currentTypeIds.has(id)) || 
                        (currentTypes?.some(t => !newTypeIds.has(t.material_type_id) && t.created_by === user.id) || false);
      
      if (!hasChanges) {
        console.log('⚡ No material type changes detected - skipping update');
        return;
      }

      // Tipos a adicionar
      const toAdd = materialTypes.filter(id => !currentTypeIds.has(id));
      
      // Tipos a remover (apenas os criados pelo usuário atual)
      const toRemove = currentTypes?.filter(t => 
        !newTypeIds.has(t.material_type_id) && t.created_by === user.id
      ) || [];

      // Verificar se há tipos a remover criados por outros usuários
      const cannotRemove = currentTypes?.filter(t => 
        !newTypeIds.has(t.material_type_id) && t.created_by !== user.id
      ) || [];

      if (cannotRemove.length > 0) {
        toast({
          title: "Aviso",
          description: `${cannotRemove.length} tipo(s) de material não puderam ser removidos (criados por outros usuários)`,
          variant: "default"
        });
      }

      // Remover apenas os criados pelo usuário atual
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('purchases_supplier_group_material_types')
          .delete()
          .eq('group_id', groupId)
          .eq('created_by', user.id)
          .in('material_type_id', toRemove.map(t => t.material_type_id));

        if (deleteError) {
          console.error('Error deleting existing material type links:', deleteError);
          throw deleteError;
        }
      }

      // Adicionar novos tipos
      if (toAdd.length > 0) {
        const materialMaps = toAdd.map(materialTypeId => ({
          group_id: groupId,
          material_type_id: materialTypeId,
          created_by: user.id
        }));

        const { error: insertError } = await supabase
          .from('purchases_supplier_group_material_types')
          .insert(materialMaps);

        if (insertError) throw insertError;
      }
    } 
    // Se não há grupo mas há potencial supplier, gerencia na tabela do potencial
    else if (potentialSupplierId) {
      // Buscar tipos atuais
      const { data: currentTypes } = await supabase
        .from('purchases_potential_supplier_material_types')
        .select('material_type_id, created_by')
        .eq('supplier_id', potentialSupplierId);

      const currentTypeIds = new Set(currentTypes?.map(t => t.material_type_id) || []);
      const newTypeIds = new Set(materialTypes);

      // Verificar se há mudanças (otimização)
      const hasChanges = materialTypes.some(id => !currentTypeIds.has(id)) || 
                        (currentTypes?.some(t => !newTypeIds.has(t.material_type_id) && t.created_by === user.id) || false);
      
      if (!hasChanges) {
        console.log('⚡ No potential supplier material type changes detected - skipping update');
        return;
      }

      // Tipos a adicionar
      const toAdd = materialTypes.filter(id => !currentTypeIds.has(id));
      
      // Tipos a remover (apenas os criados pelo usuário atual)
      const toRemove = currentTypes?.filter(t => 
        !newTypeIds.has(t.material_type_id) && t.created_by === user.id
      ) || [];

      // Verificar se há tipos a remover criados por outros usuários
      const cannotRemove = currentTypes?.filter(t => 
        !newTypeIds.has(t.material_type_id) && t.created_by !== user.id
      ) || [];

      if (cannotRemove.length > 0) {
        toast({
          title: "Aviso",
          description: `${cannotRemove.length} tipo(s) de material não puderam ser removidos (criados por outros usuários)`,
          variant: "default"
        });
      }

      // Remover apenas os criados pelo usuário atual
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('purchases_potential_supplier_material_types')
          .delete()
          .eq('supplier_id', potentialSupplierId)
          .eq('created_by', user.id)
          .in('material_type_id', toRemove.map(t => t.material_type_id));

        if (deleteError) {
          console.error('Error deleting existing potential material type links:', deleteError);
          throw deleteError;
        }
      }

      // Adicionar novos tipos
      if (toAdd.length > 0) {
        const materialMaps = toAdd.map(materialTypeId => ({
          supplier_id: potentialSupplierId,
          material_type_id: materialTypeId,
          created_by: user.id
        }));

        const { error: insertError } = await supabase
          .from('purchases_potential_supplier_material_types')
          .insert(materialMaps);

        if (insertError) throw insertError;
      }
    }
  };

  const manageTags = async (supplierId: string, tagIds: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar tags atuais
    const { data: currentTags } = await supabase
      .from('purchases_unified_supplier_tags')
      .select('tag_id, created_by')
      .eq('supplier_id', supplierId);

    const currentTagIds = new Set(currentTags?.map(t => t.tag_id) || []);
    const newTagIds = new Set(tagIds);

    // Tags a adicionar
    const toAdd = tagIds.filter(id => !currentTagIds.has(id));
    
    // Tags a remover (apenas as criadas pelo usuário atual)
    const toRemove = currentTags?.filter(t => 
      !newTagIds.has(t.tag_id) && t.created_by === user.id
    ) || [];

    // Verificar se há tags a remover criadas por outros usuários
    const cannotRemove = currentTags?.filter(t => 
      !newTagIds.has(t.tag_id) && t.created_by !== user.id
    ) || [];

    if (cannotRemove.length > 0) {
      toast({
        title: "Aviso",
        description: `${cannotRemove.length} tag(s) não puderam ser removidas (criadas por outros usuários)`,
        variant: "default"
      });
    }

    // Remover apenas as criadas pelo usuário atual
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('purchases_unified_supplier_tags')
        .delete()
        .eq('supplier_id', supplierId)
        .eq('created_by', user.id)
        .in('tag_id', toRemove.map(t => t.tag_id));

      if (deleteError) {
        console.error('Error deleting existing tags:', deleteError);
        throw deleteError;
      }
    }

    // Adicionar novas tags
    if (toAdd.length > 0) {
      const tagMaps = toAdd.map(tagId => ({
        supplier_id: supplierId,
        tag_id: tagId,
        created_by: user.id
      }));

      const { error: insertError } = await supabase
        .from('purchases_unified_supplier_tags')
        .insert(tagMaps);

      if (insertError) throw insertError;
    }
  };

  const createSupplier = async (supplierData: CreateUnifiedSupplierData) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { material_types, tag_ids, tags, ...supplierDataWithoutArrays } = supplierData;
      
      // Sanitizar dados antes de enviar
      const sanitizedData = sanitizeUnifiedSupplierPayload(supplierDataWithoutArrays);
      
      console.log('📤 Sending sanitized supplier data to create:', sanitizedData);

      const { data, error } = await supabase
        .from('purchases_unified_suppliers')
        .insert({
          ...sanitizedData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Gerenciar tipos de material usando a nova tabela específica
      if (material_types && material_types.length > 0) {
        await manageSupplierMaterialTypes(data.id, material_types);
      }

      // Gerenciar tags se houver
      if (tag_ids && tag_ids.length > 0) {
        await manageTags(data.id, tag_ids);
      }

      toast({ 
        title: "Sucesso", 
        description: "Fornecedor unificado criado com sucesso" 
      });
      
      await fetchSuppliers({ page: currentPage });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar fornecedor unificado';
      console.error('Error creating unified supplier:', err);
      setError(errorMessage);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSupplier = async (id: string, updates: Partial<CreateUnifiedSupplierData>) => {
    try {
      setLoading(true);

      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔄 Updating supplier:', {
        supplierId: id,
        userId: user.id,
        updateData: updates
      });

      const { material_types, tag_ids, tags, ...updateDataWithoutArrays } = updates;
      
      // Detectar se é update somente de arrays (material_types e/ou tags)
      const hasScalarUpdates = Object.keys(updateDataWithoutArrays).length > 0;
      const hasArrayUpdates = material_types !== undefined || tag_ids !== undefined;
      const isArrayOnlyUpdate = !hasScalarUpdates && hasArrayUpdates;
      
      // CAMINHO OTIMIZADO: Arrays somente (tipos de material e/ou tags)
      if (isArrayOnlyUpdate) {
        console.log('🎯 Array-only update detected - skipping main UPDATE call');
        
        // Buscar dados necessários para contexto (economic_group_id, potential_supplier_id)
        const { data: supplierData, error: fetchError } = await supabase
          .from('purchases_unified_suppliers')
          .select('economic_group_id, potential_supplier_id')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching supplier context:', fetchError);
          throw new Error(`Erro ao buscar contexto do fornecedor: ${fetchError.message}`);
        }

        console.log('📋 Supplier context:', supplierData);

        // Gerenciar tipos de material se fornecido
        if (material_types !== undefined) {
          console.log('🏷️ Managing material types only:', material_types);
          await manageSupplierMaterialTypes(id, material_types);
        }

        // Gerenciar tags se fornecido
        if (tag_ids !== undefined) {
          console.log('🏷️ Managing tags only:', tag_ids);
          await manageTags(id, tag_ids);
        }

        // Toast específico para updates de arrays
        const updatedItems = [];
        if (material_types !== undefined) updatedItems.push('tipos de material');
        if (tag_ids !== undefined) updatedItems.push('tags');
        
        toast({ 
          title: "Sucesso", 
          description: `${updatedItems.join(' e ')} atualizados com sucesso` 
        });
        
        await fetchSuppliers({ page: currentPage });
        return { id }; // Retornar objeto mínimo
      }
      
      // CAMINHO RÁPIDO: Se apenas comprador mudou, fazer update direto
      const onlyBuyerFields = Object.keys(updateDataWithoutArrays).filter(key => 
        !['assigned_buyer_cod', 'assigned_buyer_filial'].includes(key)
      );
      
      const isBuyerOnlyUpdate = onlyBuyerFields.length === 0 && !hasArrayUpdates;
      
      if (isBuyerOnlyUpdate) {
        console.log('🏎️ Fast path: buyer-only update');
        
        // Sanitizar dados antes de enviar
        const sanitizedData = sanitizeUnifiedSupplierPayload(updateDataWithoutArrays);
        console.log('💾 Sending buyer-only update to Supabase:', sanitizedData);

        const { data, error } = await supabase
          .from('purchases_unified_suppliers')
          .update(sanitizedData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase buyer update error:', {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log('✅ Buyer updated successfully:', data);
        
        toast({ 
          title: "Sucesso", 
          description: "Comprador designado atualizado com sucesso" 
        });
        
        await fetchSuppliers({ page: currentPage });
        return data;
      }

      // CAMINHO NORMAL: Update completo com verificações de permissão
      console.log('🔄 Full update path');

      // Verificar permissões do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name, email')
        .eq('id', user.id)
        .single();

      console.log('👤 User profile:', profile);

      // Buscar dados atuais do fornecedor
      const { data: currentSupplier, error: fetchError } = await supabase
        .from('purchases_unified_suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current supplier:', fetchError);
        throw new Error(`Erro ao buscar fornecedor: ${fetchError.message}`);
      }

      console.log('📋 Current supplier data:', {
        id: currentSupplier.id,
        created_by: currentSupplier.created_by,
        fu_id: currentSupplier.fu_id
      });
      
      // Sanitizar dados antes de enviar
      const sanitizedData = sanitizeUnifiedSupplierPayload(updateDataWithoutArrays);
      
      // Garantir que attendance_type e representative_id sejam incluídos se presentes
      if (updates.attendance_type !== undefined) {
        sanitizedData.attendance_type = updates.attendance_type as 'direct' | 'representative';
      }
      if (updates.representative_id !== undefined) {
        sanitizedData.representative_id = updates.representative_id;
      }

      console.log('💾 Sending sanitized update to Supabase:', sanitizedData);

      const { data, error } = await supabase
        .from('purchases_unified_suppliers')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Supplier updated successfully:', data);

        // Gerenciar tipos de material APENAS se fornecido e houve mudança
        if (material_types !== undefined) {
          console.log('🏷️ Managing material types:', material_types);
          await manageSupplierMaterialTypes(id, material_types);
        }

      // Gerenciar tags APENAS se fornecido e houve mudança
      if (tag_ids !== undefined) {
        console.log('🏷️ Managing tags:', tag_ids);
        await manageTags(id, tag_ids);
      }

      toast({ 
        title: "Sucesso", 
        description: "Fornecedor unificado atualizado com sucesso" 
      });
      
      await fetchSuppliers({ page: currentPage });
      return data;
    } catch (err) {
      console.error('❌ Full error object:', err);
      
      let errorMessage = 'Erro ao atualizar fornecedor unificado';
      let errorDetails = '';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Capturar TODOS os detalhes do Supabase
        if ('code' in err) errorDetails += ` (Código: ${(err as any).code})`;
        if ('hint' in err) errorDetails += ` Dica: ${(err as any).hint}`;
        if ('details' in err) errorDetails += ` Detalhes: ${(err as any).details}`;
      }
      
      toast({
        title: "Erro ao atualizar fornecedor unificado", 
        description: `${errorMessage}${errorDetails}`,
        variant: "destructive",
      });
      
      throw err; // Propagar erro original com detalhes
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('purchases_unified_suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: "Sucesso", 
        description: "Fornecedor unificado excluído com sucesso" 
      });
      
      await fetchSuppliers({ page: currentPage });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir fornecedor unificado';
      console.error('Error deleting unified supplier:', err);
      setError(errorMessage);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createMissingSuppliers = async () => {
    try {
      setLoading(true);
      
      // Call both RPCs to create missing suppliers from potential and Protheus
      const [potentialResult, protheusResult] = await Promise.all([
        supabase.rpc('create_missing_unified_suppliers'),
        supabase.rpc('create_missing_unified_suppliers_from_protheus')
      ]);
      
      if (potentialResult.error) throw potentialResult.error;
      if (protheusResult.error) throw protheusResult.error;
      
      const potentialCreated = (potentialResult.data as any)?.created_count || 0;
      const protheusCreated = (protheusResult.data as any)?.created_count || 0;
      const totalCreated = potentialCreated + protheusCreated;
      
      const messages = [];
      if (potentialCreated > 0) {
        messages.push(`${potentialCreated} de potenciais fornecedores`);
      }
      if (protheusCreated > 0) {
        messages.push(`${protheusCreated} do Protheus`);
      }
      
      toast({ 
        title: "Fornecedores criados!", 
        description: totalCreated > 0 
          ? `${totalCreated} fornecedores unificados criados: ${messages.join(' e ')}`
          : 'Nenhum fornecedor faltante encontrado'
      });
      
      await fetchSuppliers({ page: currentPage });
      return { success: true, created_count: totalCreated };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar fornecedores unificados faltantes';
      console.error('Error creating missing unified suppliers:', err);
      setError(errorMessage);
      toast({ 
        title: "Erro", 
        description: errorMessage, 
        variant: "destructive" 
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSupplierByFuId = async (fuId: string): Promise<UnifiedSupplier | null> => {
    try {
      console.log('🔍 Fetching supplier by ID:', fuId);
      
      let supplierData = null;
      let error = null;

      // Determinar se é UUID ou FU-xxxxx
      const isUuid = fuId.length === 36 && fuId.includes('-');
      const isFuCode = fuId.startsWith('FU-');
      
      if (isUuid) {
        console.log('Searching by UUID (unified_id):', fuId);
        const { data, error: uuidError } = await supabase
          .from('purchases_unified_suppliers')
          .select('*')
          .eq('id', fuId)
          .maybeSingle();
        
        supplierData = data;
        error = uuidError;
        
        // Se não encontrou por UUID, tenta por fu_id
        if (!supplierData && !error) {
          console.log('UUID not found, trying as fu_id');
          const { data: fuData, error: fuError } = await supabase
            .from('purchases_unified_suppliers')
            .select('*')
            .eq('fu_id', fuId)
            .maybeSingle();
          supplierData = fuData;
          error = fuError;
        }
      } else if (isFuCode) {
        console.log('Searching by FU code:', fuId);
        const { data, error: fuError } = await supabase
          .from('purchases_unified_suppliers')
          .select('*')
          .eq('fu_id', fuId)
          .maybeSingle();
        
        supplierData = data;
        error = fuError;
      } else {
        console.log('Unknown ID format, trying both searches');
        // Tenta primeiro como fu_id
        const { data: fuData, error: fuError } = await supabase
          .from('purchases_unified_suppliers')
          .select('*')
          .eq('fu_id', fuId)
          .maybeSingle();
        
        if (fuData) {
          supplierData = fuData;
          error = fuError;
        } else {
          // Tenta como UUID
          const { data: uuidData, error: uuidError } = await supabase
            .from('purchases_unified_suppliers')
            .select('*')
            .eq('id', fuId)
            .maybeSingle();
          supplierData = uuidData;
          error = uuidError;
        }
      }

      if (error) {
        console.error('Error fetching supplier:', error);
        return null;
      }

      if (!supplierData) {
        console.log('Supplier not found for ID:', fuId);
        return null;
      }

      console.log('Found supplier:', supplierData);

      // Buscar dados do potencial separadamente
      let potentialSupplier = null;
      if (supplierData.potential_supplier_id) {
        const { data } = await supabase
          .from('purchases_potential_suppliers')
          .select('trade_name, legal_name')
          .eq('id', supplierData.potential_supplier_id)
          .single();
        potentialSupplier = data;
      }

      // Buscar tags
      const { data: tagsData } = await supabase
        .from('purchases_unified_supplier_tags')
        .select('email_tags(id, name)')
        .eq('supplier_id', supplierData.id);

      const tags = tagsData?.map((t: any) => t.email_tags).filter(Boolean) || [];

      // Buscar material types com prioridade: per-supplier > grupo > potencial
      let materialTypes: string[] = [];

      // 1. Buscar material types específicos do fornecedor
      const { data: perSupplierMaterialTypes } = await supabase
        .from('purchases_unified_supplier_material_types')
        .select('material_type_id')
        .eq('supplier_id', supplierData.id);

      if (perSupplierMaterialTypes && perSupplierMaterialTypes.length > 0) {
        materialTypes = perSupplierMaterialTypes.map(mt => mt.material_type_id);
      } else {
        // 2. Fallback para material types do grupo econômico
        if (supplierData.economic_group_id) {
          const { data: groupMaterialTypes } = await supabase
            .from('purchases_supplier_group_material_types')
            .select('material_type_id')
            .eq('group_id', supplierData.economic_group_id);

          materialTypes = groupMaterialTypes?.map(mt => mt.material_type_id) || [];
        }

        // 3. Fallback final para material types do fornecedor potencial
        if (materialTypes.length === 0 && supplierData.potential_supplier_id) {
          const { data: potentialMaterialTypes } = await supabase
            .from('purchases_potential_supplier_material_types')
            .select('material_type_id')
            .eq('supplier_id', supplierData.potential_supplier_id);

          materialTypes = potentialMaterialTypes?.map(mt => mt.material_type_id) || [];
        }
      }

      // Dados do Protheus simplificado
      let protheusSuppier = null;
      if (supplierData.protheus_filial && supplierData.protheus_cod && supplierData.protheus_loja) {
        const { data } = await supabase
          .from('protheus_sa2010_72a51158')
          .select('a2_nome, a2_nreduz, a2_cgc')
          .eq('a2_filial', supplierData.protheus_filial)
          .eq('a2_cod', supplierData.protheus_cod)
          .eq('a2_loja', supplierData.protheus_loja)
          .single();
        protheusSuppier = data;
      }

      // Display name
      let displayName = potentialSupplier?.trade_name || protheusSuppier?.a2_nreduz || `Fornecedor ${supplierData.fu_id}`;

      // Retornar objeto explícito
      return {
        id: supplierData.id,
        fu_id: supplierData.fu_id,
        status: supplierData.status,
        potential_supplier_id: supplierData.potential_supplier_id,
        protheus_filial: supplierData.protheus_filial,
        protheus_cod: supplierData.protheus_cod,
        protheus_loja: supplierData.protheus_loja,
        economic_group_id: supplierData.economic_group_id,
        cnpj: supplierData.cnpj,
        attendance_type: supplierData.attendance_type || 'direct',
        representative_id: supplierData.representative_id,
        assigned_buyer_cod: supplierData.assigned_buyer_cod,
        assigned_buyer_filial: supplierData.assigned_buyer_filial,
        created_by: supplierData.created_by,
        created_at: supplierData.created_at,
        updated_at: supplierData.updated_at,
        material_types: materialTypes.map(id => ({ id, material_type: id })),
        tags: tags,
        display_name: displayName,
        potential_supplier: potentialSupplier,
        protheus_supplier: protheusSuppier
      } as UnifiedSupplier;
    } catch (error) {
      console.error('Error in getSupplierByFuId:', error);
      return null;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchSuppliers();
    }
  }, [autoFetch]);

  return {
    suppliers,
    totalCount,
    totalPages,
    currentPage,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createMissingSuppliers,
    getSupplierByFuId
  };
};