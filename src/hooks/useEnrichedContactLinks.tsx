import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerGroupsWithId } from '@/hooks/useCustomerGroupsWithId';

export interface CityInfo {
  name: string;
  uf: string;
  country?: string;
  distance_km_to_indaiatuba?: number;
  average_truck_travel_time_hours?: number;
}

export interface EnrichedContactLink {
  link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade';
  target_id: string;
  target_kind: string;
  display_name: string;
  secondary_name?: string;
  city_info?: CityInfo;
  meta?: {
    is_sales?: boolean;
    is_purchases?: boolean;
    protheus_code?: string;
  };
}

export const useEnrichedContactLinks = (
  contactLinks: Array<{ link_type: 'cliente' | 'fornecedor' | 'representante' | 'entidade'; target_id: string; target_kind?: string }>
) => {
  const [enrichedLinks, setEnrichedLinks] = useState<EnrichedContactLink[]>([]);
  const [loading, setLoading] = useState(false);
  const { groups, fetchGroups } = useCustomerGroupsWithId();

  // Ensure groups are loaded
  useEffect(() => {
    if (!groups || groups.length === 0) {
      fetchGroups();
    }
  }, [groups, fetchGroups]);

  useEffect(() => {
    const enrichLinks = async () => {
      if (contactLinks.length === 0) {
        setEnrichedLinks([]);
        return;
      }

      setLoading(true);
      const enriched: EnrichedContactLink[] = [];

      for (const link of contactLinks) {
        if (link.link_type === 'cliente') {
          if (link.target_kind === 'economic_group_sales') {
            // Economic Group - find group name by UUID first, then fallback to numeric ID
            const group = groups?.find(g => g.group_id === link.target_id) || 
                         groups?.find(g => g.id_grupo?.toString() === link.target_id);
            
            // Display name with group name and ID
            let groupDisplayName = group?.nome_grupo || 'Grupo Econômico';
            if (group?.id_grupo) {
              groupDisplayName += ` (ID: ${group.id_grupo})`;
            } else if (link.target_id) {
              groupDisplayName += ` (${link.target_id.slice(-8)})`;
            }
            
            enriched.push({
              ...link,
              target_kind: link.target_kind || 'unified_customer',
              display_name: groupDisplayName,
              secondary_name: undefined,
            });
          } else {
            // Unified Account - fetch trade and legal names with city data
            try {
              const { data: accountNames, error } = await supabase
                .rpc('get_unified_account_names', { p_unified_id: link.target_id });

              if (error || !accountNames || accountNames.length === 0) {
                console.error('Error fetching unified account names:', error);
                
                // Fallback: get seq_id from unified_accounts if no Protheus data
                const { data: unifiedAccount } = await supabase
                  .from('unified_accounts')
                  .select('seq_id')
                  .eq('id', link.target_id)
                  .single();

                enriched.push({
                  ...link,
                  target_kind: link.target_kind || 'unified_customer',
                  display_name: 'Unidade',
                  secondary_name: unifiedAccount?.seq_id ? `#${unifiedAccount.seq_id}` : `#${link.target_id.slice(-8)}`,
                });
                continue;
              }

              const names = accountNames[0];
              const tradeName = names.trade_name || '';
              const legalName = names.legal_name || '';
              
              // Check if has Protheus data
              const hasProtheusData = names.protheus_filial && names.protheus_cod && names.protheus_loja;
              
              // Create display name and secondary name
              let displayName = tradeName || 'Unidade';
              let secondaryParts = [];
              let cityInfo: CityInfo | undefined;
              
              if (legalName && legalName !== tradeName) {
                secondaryParts.push(legalName);
              }
              
              if (hasProtheusData) {
                secondaryParts.push(`${names.protheus_filial}/${names.protheus_cod}/${names.protheus_loja}`);
                
                // Fetch city data from Protheus SA1010 table
                try {
                  const { data: protheusData } = await supabase
                    .from('protheus_sa1010_80f17f00')
                    .select('a1_cod_mun, a1_est')
                    .eq('a1_filial', names.protheus_filial)
                    .eq('a1_cod', names.protheus_cod)
                    .eq('a1_loja', names.protheus_loja)
                    .maybeSingle();
                  
                  if (protheusData?.a1_cod_mun && protheusData?.a1_est) {
                    const { data: cityData } = await supabase
                      .from('site_cities')
                      .select('name, uf, country, distance_km_to_indaiatuba, average_truck_travel_time_hours')
                      .eq('cod_munic', protheusData.a1_cod_mun)
                      .eq('uf', protheusData.a1_est.toUpperCase())
                      .maybeSingle();
                    
                    if (cityData) {
                      cityInfo = cityData;
                    }
                  }
                } catch (error) {
                  console.error('Error fetching city data from Protheus:', error);
                }
              } else {
                // Get seq_id for accounts without Protheus data
                const { data: unifiedAccount } = await supabase
                  .from('unified_accounts')
                  .select('seq_id, lead_id')
                  .eq('id', link.target_id)
                  .single();
                
                secondaryParts.push(unifiedAccount?.seq_id ? `#${unifiedAccount.seq_id}` : `#${link.target_id.slice(-8)}`);
                
                // Try to get city data from sales_leads
                if (unifiedAccount?.lead_id) {
                  try {
                    const { data: leadData } = await supabase
                      .from('sales_leads')
                      .select(`
                        city_id,
                        site_cities (
                          name,
                          uf,
                          country,
                          distance_km_to_indaiatuba,
                          average_truck_travel_time_hours
                        )
                      `)
                      .eq('id', unifiedAccount.lead_id)
                      .maybeSingle();
                    
                    if (leadData?.site_cities) {
                      cityInfo = leadData.site_cities;
                    }
                  } catch (error) {
                    console.error('Error fetching city data from leads:', error);
                  }
                }
              }

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'unified_customer',
                display_name: displayName,
                secondary_name: secondaryParts.join(' • '),
                city_info: cityInfo,
              });
            } catch (error) {
              console.error('Error enriching unified account link:', error);
              
              // Fallback: get seq_id from unified_accounts
              const { data: unifiedAccount } = await supabase
                .from('unified_accounts')
                .select('seq_id')
                .eq('id', link.target_id)
                .single();

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'unified_customer',
                display_name: 'Unidade',
                secondary_name: unifiedAccount?.seq_id ? `#${unifiedAccount.seq_id}` : `#${link.target_id.slice(-8)}`,
              });
            }
          }
        } else if (link.link_type === 'fornecedor') {
          // Handle supplier links
          if (link.target_kind === 'economic_group_purchases') {
            // For supplier economic groups, we need to fetch from purchases_economic_groups
            try {
              // Try to determine if target_id is UUID or numeric
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(link.target_id);
              const isNumeric = /^\d+$/.test(link.target_id);
              
              let query = supabase
                .from('purchases_economic_groups')
                .select('id_grupo, name, ai_suggested_name, code');
              
              if (isUUID) {
                query = query.eq('id', link.target_id);
              } else if (isNumeric) {
                query = query.eq('id_grupo', parseInt(link.target_id));
              } else {
                throw new Error('Invalid target_id format');
              }

              const { data: supplierGroups, error } = await query.maybeSingle();
              
              if (error) {
                console.error('Error fetching supplier group:', error);
                throw error;
              }

              const group = supplierGroups;
              let groupDisplayName = group?.name || group?.ai_suggested_name || 'Grupo Econômico de Compras';
              
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'economic_group_purchases',
                display_name: groupDisplayName,
                secondary_name: group?.code || (group?.id_grupo ? `GEC-${String(group.id_grupo).padStart(6, '0')}` : `#${link.target_id.slice(-8)}`),
              });
            } catch (error) {
              console.error('Error fetching supplier group:', error);
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'economic_group_purchases',
                display_name: 'Grupo Econômico de Compras',
                secondary_name: `#${link.target_id.slice(-8)}`,
              });
            }
          } else if (link.target_kind === 'unified_supplier') {
            // For unified suppliers, fetch from unified suppliers and potential suppliers
            try {
              const { data: suppliers } = await supabase
                .from('purchases_unified_suppliers')
                .select(`
                  protheus_filial,
                  protheus_cod,
                  protheus_loja,
                  fu_id,
                  potential_supplier_id,
                  purchases_potential_suppliers (
                    id,
                    trade_name,
                    legal_name
                  )
                `)
                .eq('id', link.target_id);

              const supplier = suppliers?.[0];
              const potential = supplier?.purchases_potential_suppliers;
              
              // Check if has Protheus data
              const hasProtheusData = supplier?.protheus_filial && supplier?.protheus_cod && supplier?.protheus_loja;
              
              let displayName = 'Unidade';
              let secondaryName = '';
              let cityInfo: CityInfo | undefined;
              
              if (hasProtheusData) {
                // Fetch from Protheus SA2010 table
                try {
                  const { data: protheusData } = await supabase
                    .from('protheus_sa2010_72a51158')
                    .select('a2_nreduz, a2_nome, a2_cod_mun, a2_est')
                    .eq('a2_filial', supplier.protheus_filial)
                    .eq('a2_cod', supplier.protheus_cod)
                    .eq('a2_loja', supplier.protheus_loja)
                    .single();

                  if (protheusData) {
                    displayName = protheusData.a2_nreduz || 'Unidade';
                    secondaryName = protheusData.a2_nome || '';
                    
                    // Fetch city data using a2_cod_mun and a2_est
                    if (protheusData.a2_cod_mun && protheusData.a2_est) {
                      try {
                        const { data: cityData } = await supabase
                          .from('site_cities')
                          .select('name, uf, country, distance_km_to_indaiatuba, average_truck_travel_time_hours')
                          .eq('cod_munic', protheusData.a2_cod_mun)
                          .eq('uf', protheusData.a2_est.toUpperCase())
                          .maybeSingle();
                        
                        if (cityData) {
                          cityInfo = cityData;
                        }
                      } catch (cityError) {
                        console.error('Error fetching city data for supplier:', cityError);
                      }
                    }
                  } else {
                    displayName = potential?.trade_name || 'Unidade';
                    secondaryName = potential?.legal_name || '';
                  }
                } catch (protheusError) {
                  console.error('Error fetching Protheus data:', protheusError);
                  displayName = potential?.trade_name || 'Unidade';
                  secondaryName = potential?.legal_name || '';
                }
                
                // Add Protheus key
                if (secondaryName) {
                  secondaryName += ` • ${supplier.protheus_filial}/${supplier.protheus_cod}/${supplier.protheus_loja}`;
                } else {
                  secondaryName = `${supplier.protheus_filial}/${supplier.protheus_cod}/${supplier.protheus_loja}`;
                }
              } else {
                // No Protheus data - use potential supplier data
                displayName = potential?.trade_name || 'Unidade';
                const legalName = potential?.legal_name;
                const fuId = supplier?.fu_id;
                
                const parts = [];
                if (legalName && legalName !== displayName) {
                  parts.push(legalName);
                }
                if (fuId) {
                  parts.push(`#${fuId}`);
                } else {
                  parts.push(`#${link.target_id.slice(-8)}`);
                }
                
                secondaryName = parts.join(' • ');
                
                // Try to get city data from potential supplier
                if (supplier?.potential_supplier_id) {
                  try {
                    const { data: potentialData } = await supabase
                      .from('purchases_potential_suppliers')
                      .select(`
                        city_id,
                        site_cities (
                          name,
                          uf,
                          country,
                          distance_km_to_indaiatuba,
                          average_truck_travel_time_hours
                        )
                      `)
                      .eq('id', supplier.potential_supplier_id)
                      .maybeSingle();
                    
                    if (potentialData?.site_cities) {
                      cityInfo = potentialData.site_cities;
                    }
                  } catch (error) {
                    console.error('Error fetching city data from potential supplier:', error);
                  }
                }
              }

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'unified_supplier',
                display_name: displayName,
                secondary_name: secondaryName,
                city_info: cityInfo,
              });
            } catch (error) {
              console.error('Error fetching unified supplier:', error);
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'unified_supplier',
                display_name: 'Unidade',
                secondary_name: `#${link.target_id.slice(-8)}`,
              });
            }
          } else {
            enriched.push({
              ...link,
              target_kind: link.target_kind || 'unified_supplier',
              display_name: link.target_id,
            });
          }
        } else if (link.link_type === 'representante') {
          // Handle commercial representative links
          try {
            const { data: representative, error } = await supabase
              .from('commercial_representatives')
              .select('*')
              .eq('id', link.target_id)
              .single();

            if (error) {
              console.error('Error fetching commercial representative:', error);
              throw error;
            }

            if (representative) {
              let displayName = representative.company_name || 'Representante Comercial';
              let secondaryName = '';
              
              // Build Protheus code if available
              if (representative.supplier_filial && representative.supplier_cod && representative.supplier_loja) {
                secondaryName = `${representative.supplier_filial}/${representative.supplier_cod}/${representative.supplier_loja}`;
              } else if (representative.supplier_key) {
                secondaryName = representative.supplier_key;
              }

              enriched.push({
                ...link,
                target_kind: 'commercial_representative',
                display_name: displayName,
                secondary_name: secondaryName,
                meta: {
                  is_sales: representative.is_sales || false,
                  is_purchases: representative.is_purchases || false,
                  protheus_code: secondaryName
                }
              });
            } else {
              throw new Error('Representative not found');
            }
          } catch (error) {
            console.error('Error fetching commercial representative:', error);
            enriched.push({
              ...link,
              target_kind: 'commercial_representative',
              display_name: 'Representante Comercial',
              secondary_name: `#${link.target_id.slice(-8)}`,
              meta: {
                is_sales: false,
                is_purchases: false,
                protheus_code: ''
              }
            });
          }
        } else if (link.link_type === 'entidade' && (link.target_kind === 'carrier' || link.target_kind === 'transportadora')) {
          // Handle carrier/transportadora links
          try {
            const { data: carrier, error } = await supabase
              .from('protheus_sa4010_ea26a13a')
              .select('id, a4_nreduz, a4_nome, a4_cgc, a4_filial, a4_cod, a4_cod_mun, a4_est')
              .eq('id', link.target_id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching carrier:', error);
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'carrier',
                display_name: 'Erro ao carregar transportadora',
                secondary_name: `#${link.target_id.slice(-8)}`,
                city_info: undefined,
                meta: {}
              });
            } else if (carrier) {
              // Format CNPJ if available
              const formatCNPJ = (cnpj: string) => {
                if (!cnpj) return '';
                const cleaned = cnpj.replace(/\D/g, '');
                if (cleaned.length === 14) {
                  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                }
                return cnpj;
              };

              // Build secondary info
              const secondaryParts = [];
              if (carrier.a4_cgc) {
                secondaryParts.push(formatCNPJ(carrier.a4_cgc));
              }
              if (carrier.a4_filial && carrier.a4_cod) {
                secondaryParts.push(`${carrier.a4_filial}/${carrier.a4_cod}`);
              }

              // Try to get city info if cod_mun and state are available
              let cityInfo: CityInfo | undefined;
              if (carrier.a4_cod_mun && carrier.a4_est) {
                try {
                  const { data: cityData } = await supabase
                    .from('site_cities')
                    .select('name, uf, country, distance_km_to_indaiatuba, average_truck_travel_time_hours')
                    .eq('cod_munic', carrier.a4_cod_mun.replace(/\D/g, ''))
                    .eq('uf', carrier.a4_est.toUpperCase())
                    .maybeSingle();

                  if (cityData) {
                    cityInfo = cityData;
                  }
                } catch (cityError) {
                  console.error('Error fetching city info for carrier:', cityError);
                }
              }

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'carrier',
                display_name: carrier.a4_nreduz || carrier.a4_nome || 'Transportadora',
                secondary_name: secondaryParts.length > 0 ? secondaryParts.join(' • ') : undefined,
                city_info: cityInfo,
                meta: {
                  protheus_code: carrier.a4_filial && carrier.a4_cod 
                    ? `${carrier.a4_filial}/${carrier.a4_cod}`
                    : undefined
                }
              });
            } else {
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'carrier',
                display_name: 'Transportadora não encontrada',
                secondary_name: `#${link.target_id.slice(-8)}`,
                city_info: undefined,
                meta: {}
              });
            }
          } catch (error) {
            console.error('Error processing carrier link:', error);
            enriched.push({
              ...link,
              target_kind: link.target_kind || 'carrier',
              display_name: 'Erro ao processar transportadora',
              secondary_name: `#${link.target_id.slice(-8)}`,
              city_info: undefined,
              meta: {}
            });
          }
        } else if (link.link_type === 'entidade' && link.target_kind === 'public_org') {
          // Handle public organization links
          try {
            const { data: publicOrgData, error } = await supabase
              .from('contact_entity_public_orgs')
              .select(`
                official_name,
                cnpj,
                city_id,
                contact_entities!inner (
                  id,
                  name
                ),
                site_cities (
                  name,
                  uf,
                  country,
                  distance_km_to_indaiatuba,
                  average_truck_travel_time_hours
                )
              `)
              .eq('contact_entity_id', link.target_id)
              .maybeSingle();

            if (error) {
              console.error('Error fetching public org details:', error);
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'public_org',
                display_name: 'Órgão Público',
                secondary_name: `#${link.target_id.slice(-8)}`,
              });
            } else if (publicOrgData) {
              // Format CNPJ if available
              const formatCNPJ = (cnpj: string) => {
                if (!cnpj) return '';
                const cleaned = cnpj.replace(/\D/g, '');
                if (cleaned.length === 14) {
                  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                }
                return cnpj;
              };

              // Build secondary info
              const secondaryParts = [];
              if (publicOrgData.cnpj) {
                secondaryParts.push(formatCNPJ(publicOrgData.cnpj));
              }

              // Get city info if available
              let cityInfo: CityInfo | undefined;
              if (publicOrgData.site_cities) {
                cityInfo = publicOrgData.site_cities;
              }

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'public_org',
                display_name: publicOrgData.official_name || publicOrgData.contact_entities?.name || 'Órgão Público',
                secondary_name: secondaryParts.length > 0 ? secondaryParts.join(' • ') : undefined,
                city_info: cityInfo,
              });
            } else {
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'public_org',
                display_name: 'Órgão Público',
                secondary_name: `#${link.target_id.slice(-8)}`,
              });
            }
          } catch (error) {
            console.error('Error processing public org link:', error);
            enriched.push({
              ...link,
              target_kind: link.target_kind || 'public_org',
              display_name: 'Órgão Público',
              secondary_name: `#${link.target_id.slice(-8)}`,
            });
          }
        } else if (link.link_type === 'entidade' && link.target_kind === 'association_union') {
          // Handle association/union entities
          try {
            const { data: entityData } = await supabase
              .from('contact_entities')
              .select(`
                id,
                name,
                contact_entity_associations (
                  official_name,
                  acronym,
                  cnpj,
                  city_id,
                  site_cities (
                    name,
                    uf,
                    distance_km_to_indaiatuba
                  )
                )
              `)
              .eq('id', link.target_id)
              .single();

            if (entityData) {
              const associationDetails = entityData.contact_entity_associations?.[0];
              
              // Format CNPJ if available
              const formatCNPJ = (cnpj: string) => {
                if (!cnpj) return '';
                const cleaned = cnpj.replace(/\D/g, '');
                if (cleaned.length === 14) {
                  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                }
                return cnpj;
              };

              // Build secondary info
              const secondaryParts = [];
              if (associationDetails?.acronym) {
                secondaryParts.push(associationDetails.acronym);
              }
              if (associationDetails?.cnpj) {
                secondaryParts.push(formatCNPJ(associationDetails.cnpj));
              }

              // Get city info if available
              let cityInfo: CityInfo | undefined;
              if (associationDetails?.site_cities) {
                cityInfo = associationDetails.site_cities;
                secondaryParts.push(`${associationDetails.site_cities.name} - ${associationDetails.site_cities.uf}`);
              }

              // Use official_name from details or fallback to entity name
              const displayName = associationDetails?.official_name || entityData.name || 'Associação/Sindicato';

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'association_union',
                display_name: displayName,
                secondary_name: secondaryParts.length > 0 ? secondaryParts.join(' • ') : undefined,
                city_info: cityInfo,
              });
            } else {
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'association_union',
                display_name: 'Associação/Sindicato',
                secondary_name: `#${link.target_id.slice(-8)}`,
              });
            }
          } catch (error) {
            console.error('Error processing association link:', error);
            enriched.push({
              ...link,
              target_kind: link.target_kind || 'association_union',
              display_name: 'Associação/Sindicato',
              secondary_name: `#${link.target_id.slice(-8)}`,
            });
          }
        } else if (link.link_type === 'entidade' && link.target_kind === 'external_partner') {
          // Handle external partner entities
          try {
            const { data: partnerData } = await supabase
              .from('contact_entities')
              .select(`
                id,
                name,
                contact_entity_external_partners (
                  official_name,
                  trade_name,
                  cnpj,
                  partner_type,
                  site_cities (
                    name,
                    uf
                  )
                )
              `)
              .eq('id', link.target_id)
              .single();

            if (partnerData) {
              // Get details from external partner details (if exists)
              const partnerDetails = partnerData.contact_entity_external_partners?.[0];
              const displayName = partnerDetails?.official_name || partnerData.name;
              const secondaryParts: string[] = [];
              
              if (partnerDetails?.cnpj) {
                const cnpjFormatted = partnerDetails.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
                secondaryParts.push(cnpjFormatted);
              }
              
              if (partnerDetails?.trade_name) {
                secondaryParts.push(partnerDetails.trade_name);
              }
              
              if (partnerDetails?.partner_type) {
                secondaryParts.push(partnerDetails.partner_type);
              }

              const cityInfo = partnerDetails?.site_cities ? {
                name: partnerDetails.site_cities.name,
                uf: partnerDetails.site_cities.uf
              } : undefined;

              enriched.push({
                ...link,
                target_kind: link.target_kind || 'external_partner',
                display_name: displayName,
                secondary_name: secondaryParts.length > 0 ? secondaryParts.join(' • ') : undefined,
                city_info: cityInfo
              });
            } else {
              enriched.push({
                ...link,
                target_kind: link.target_kind || 'external_partner',
                display_name: 'Parceiro Externo',
                secondary_name: `#${link.target_id.slice(-8)}`,
              });
            }
          } catch (error) {
            console.error('Error processing external partner link:', error);
            enriched.push({
              ...link,
              target_kind: link.target_kind || 'external_partner',
              display_name: 'Parceiro Externo',
              secondary_name: `#${link.target_id.slice(-8)}`,
            });
          }
        } else {
          // For other types, use the target_id as display name
          enriched.push({
            ...link,
            target_kind: link.target_kind || 'unified_customer',
            display_name: link.target_id,
          });
        }
      }

      setEnrichedLinks(enriched);
      setLoading(false);
    };

    enrichLinks();
  }, [contactLinks, groups]);

  return { enrichedLinks, loading };
};
