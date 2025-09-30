import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PermissionGuard } from "@/components/PermissionGuard";
import { ColumnFilterPopover } from "@/components/ColumnFilterPopover";


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Search, Plus, Edit2, Trash2, Upload, Download, Languages, MoreHorizontal, Power, PowerOff, Filter } from "lucide-react";
import Papa from "papaparse";

import { useAutoTranslation } from '@/hooks/useAutoTranslation';
import { useBackgroundTranslation } from '@/hooks/useBackgroundTranslation';
import { useMolecularImageGenerator } from "@/hooks/useMolecularImageGenerator";
import { useUserProfile } from "@/hooks/useUserProfile";
import SiteProductsCSVImportModal from "@/components/site/SiteProductsCSVImportModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Family { id: string; name: string; name_en: string; is_active: boolean; }
interface Segment { id: string; name: string; name_en: string; is_active: boolean; }
interface Group { id: string; name: string; name_en: string; is_active: boolean; }
interface Product {
  id?: string;
  name: string;
  name_en: string | null;
  name_id: string | null;
  family_id: string | null;
  compound_type: string | null;
  compound_type_en: string | null;
  molecular_formula: string | null;
  molecular_weight: number | null;
  molecular_structure_image_url: string | null;
  product_format: 'solid' | 'liquid' | null;
  product_image_url: string | null;
  cas_number: string | null;
  cas_note: string | null;
  cas_note_en: string | null;
  is_active: boolean;
  created_by?: string;
  updated_at?: string;
  group_id?: string;
  group_name?: string;
}

interface ProductsTabProps {
  onOpenProductForm?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  refreshCounter?: number;
}

export function ProductsTab({ onOpenProductForm, onEditProduct, onDeleteProduct, refreshCounter }: ProductsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile } = useUserProfile();

  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  // Hook para tradução em background
  const { translateMissingFields, isTranslating: isBackgroundTranslating, progress } = useBackgroundTranslation();

  // Hook para geração de imagens moleculares
  const { 
    imageUrl: molecularImageUrl, 
    isGenerating: isGeneratingMolecularImage, 
    error: molecularImageError, 
    generateImage: generateMolecularImage, 
    clearImage: clearMolecularImage 
  } = useMolecularImageGenerator();

  // Estados para geração em batch
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  

  // Carregar dados
  const loadProducts = async () => {
    try {
      console.log('=== ProductsTab: Carregando produtos ===');
      
      // Load products with explicit foreign key hints to avoid ambiguity
      const { data: productsData, error: productsError } = await supabase
        .from("site_products")
        .select(`
          *,
          site_product_names!site_products_name_id_fkey(id, name, name_en)
        `)
        .order("is_active", { ascending: false })
        .order("name", { foreignTable: "site_product_names" });
      
      if (productsError) {
        console.error('Erro ao carregar produtos:', productsError);
        throw productsError;
      }
      
      console.log('Produtos carregados:', productsData?.length || 0);
      
      // Load product-group mappings
      const { data: mappingsData, error: mappingsError } = await supabase
        .from("site_product_groups_map")
        .select(`
          product_id,
          group_id,
          site_product_groups(name)
        `);
      
      if (mappingsError) {
        console.error('Erro ao carregar mapeamentos:', mappingsError);
        throw mappingsError;
      }
      
      // Transform data to flatten the joined fields and normalize product_format
      const transformedData = productsData?.map(product => {
        const mapping = mappingsData?.find(m => m.product_id === product.id);
        
        // Normalizar product_format
        let normalizedFormat: 'solid' | 'liquid' | null = null;
        if (product.product_format) {
          const format = product.product_format.toLowerCase();
          if (format === 'solid' || format === 'solido' || format === 'sólido') {
            normalizedFormat = 'solid';
          } else if (format === 'liquid' || format === 'liquido' || format === 'líquido') {
            normalizedFormat = 'liquid';
          }
        }
        
        return {
          ...product,
          name: product.site_product_names?.name || product.name || "",
          name_en: product.site_product_names?.name_en || product.name_en || null,
          group_id: mapping?.group_id || null,
          group_name: mapping?.site_product_groups?.name || null,
          product_format: normalizedFormat
        };
      }) || [];
      
      console.log('Produtos transformados:', transformedData.length);
      setProducts(transformedData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({ title: "Erro", description: "Erro ao carregar produtos", variant: "destructive" });
    }
  };

  const loadFamilies = async () => {
    try {
      const { data, error } = await supabase
        .from("site_product_families")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setFamilies(data || []);
    } catch (error) {
      console.error("Erro ao carregar famílias:", error);
    }
  };

  const loadSegments = async () => {
    try {
      const { data, error } = await supabase
        .from("site_product_segments")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setSegments(data || []);
    } catch (error) {
      console.error("Erro ao carregar segmentos:", error);
    }
  };

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("site_product_groups")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadProducts(), loadFamilies(), loadSegments(), loadGroups()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Recarregar quando refreshCounter mudar
  useEffect(() => {
    if (refreshCounter !== undefined && refreshCounter > 0) {
      loadAll();
    }
  }, [refreshCounter]);

  const handleGenerateMissingStructures = async () => {
    const productsWithMissingStructures = products.filter(p => 
      p.molecular_formula && 
      !p.molecular_structure_image_url
    );

    if (productsWithMissingStructures.length === 0) {
      toast({ 
        title: "Nenhuma estrutura para gerar", 
        description: "Todos os produtos com fórmula molecular já possuem estrutura." 
      });
      return;
    }

    setIsGeneratingBatch(true);
    setBatchProgress({ current: 0, total: productsWithMissingStructures.length });

    try {
      for (let i = 0; i < productsWithMissingStructures.length; i++) {
        const product = productsWithMissingStructures[i];
        setBatchProgress({ current: i + 1, total: productsWithMissingStructures.length });
        
        await generateMolecularImage(product.molecular_formula!, product.id!);
        
        // Pequeno delay entre as gerações
        if (i < productsWithMissingStructures.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast({ 
        title: "Geração de estruturas concluída!", 
        description: `${productsWithMissingStructures.length} estruturas geradas com sucesso.` 
      });
      loadProducts();
    } catch (error) {
      console.error("Erro na geração em batch:", error);
      toast({ 
        title: "Erro", 
        description: "Erro ao gerar estruturas moleculares", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingBatch(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const exportCSV = async () => {
    try {
      // Fetch all mapping data for enrichment
      const [segmentsMapData, applicationsMapData, groupsMapData] = await Promise.all([
        supabase.from("site_product_segments_map").select(`
          product_id,
          site_product_segments(name)
        `),
        supabase.from("site_product_applications_map").select(`
          product_id,
          site_product_applications(name)
        `),
        supabase.from("site_product_groups_map").select(`
          product_id,
          site_product_groups(name)
        `)
      ]);

      const headers = [
        "name", "name_en", "family", "segments", "applications", "groups",
        "compound_type", "compound_type_en", "molecular_formula", "molecular_weight",
        "molecular_structure_image_url", "product_format", "product_image_url",
        "cas_number", "cas_note", "cas_note_en", "is_active"
      ];

      const rows = products.map(product => {
        // Get segments for this product
        const productSegments = segmentsMapData.data?.filter(s => s.product_id === product.id)
          .map(s => s.site_product_segments?.name).filter(Boolean) || [];
        
        // Get applications for this product
        const productApplications = applicationsMapData.data?.filter(a => a.product_id === product.id)
          .map(a => a.site_product_applications?.name).filter(Boolean) || [];
        
        // Get groups for this product
        const productGroups = groupsMapData.data?.filter(g => g.product_id === product.id)
          .map(g => g.site_product_groups?.name).filter(Boolean) || [];

        return [
          product.name || "",
          product.name_en || "",
          families.find(f => f.id === product.family_id)?.name || "",
          productSegments.join("; "),
          productApplications.join("; "),
          productGroups.join("; "),
          product.compound_type || "",
          product.compound_type_en || "",
          product.molecular_formula || "",
          product.molecular_weight || "",
          product.molecular_structure_image_url || "",
          product.product_format || "",
          product.product_image_url || "",
          product.cas_number || "",
          product.cas_note || "",
          product.cas_note_en || "",
          product.is_active ? "true" : "false"
        ];
      });

      const csvContent = Papa.unparse([headers, ...rows]);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "produtos_completo.csv";
      link.click();
      
      toast({ title: "Sucesso", description: "CSV exportado com sucesso!" });
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast({ title: "Erro", description: "Erro ao exportar CSV", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = !product.is_active;
      
      const { error } = await supabase
        .from('site_products')
        .update({ is_active: newStatus })
        .eq('id', product.id);
      
      if (error) throw error;
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_active: newStatus } : p
      ));
      
      toast({
        title: "Status atualizado",
        description: `Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do produto",
        variant: "destructive"
      });
    }
  };


  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Sort alphabetically by name
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    
    // Apply global search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.name_en && product.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.compound_type && product.compound_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.molecular_formula && product.molecular_formula.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.cas_number && product.cas_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply name column filter
    if (nameFilter) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
        (product.name_en && product.name_en.toLowerCase().includes(nameFilter.toLowerCase()))
      );
    }
    
    // Apply group column filter
    if (groupFilter) {
      filtered = filtered.filter(product =>
        product.group_name && product.group_name.toLowerCase().includes(groupFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, searchTerm, nameFilter, groupFilter]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <PermissionGuard pageName="Dados do Site" action="modify" hideWhenNoAccess>
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>
          </PermissionGuard>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <PermissionGuard pageName="Dados do Site" action="modify" hideWhenNoAccess>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => translateMissingFields()}
              disabled={isBackgroundTranslating}
            >
              <Languages className="h-4 w-4 mr-2" />
              {isBackgroundTranslating ? `Traduzindo... ${progress}%` : 'Traduzir'}
            </Button>
          </PermissionGuard>
          <PermissionGuard pageName="Dados do Site" action="modify" hideWhenNoAccess>
            <Button 
              onClick={handleGenerateMissingStructures} 
              disabled={isGeneratingBatch}
              variant="outline"
              size="sm"
            >
              {isGeneratingBatch ? `Gerando... (${batchProgress.current}/${batchProgress.total})` : "Gerar Estruturas Faltantes"}
            </Button>
          </PermissionGuard>
        </div>
        
        <div className="flex gap-2">
          <PermissionGuard 
            pageName="Dados do Site" 
            action="modify" 
            hideWhenNoAccess
          >
            <Button onClick={onOpenProductForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </PermissionGuard>
        </div>
      </div>


      {/* Products table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span>Nome</span>
                        <ColumnFilterPopover
                          column="Nome"
                          value={nameFilter}
                          onChange={setNameFilter}
                          onClear={() => setNameFilter("")}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 ${nameFilter ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Filtrar por nome"
                          >
                            <Filter className="h-3 w-3" />
                          </Button>
                        </ColumnFilterPopover>
                        {nameFilter && (
                          <Badge variant="secondary" className="text-xs">
                            {nameFilter}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <span>Grupo do Produto</span>
                        <ColumnFilterPopover
                          column="Grupo do Produto"
                          value={groupFilter}
                          onChange={setGroupFilter}
                          onClear={() => setGroupFilter("")}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 ${groupFilter ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Filtrar por grupo"
                          >
                            <Filter className="h-3 w-3" />
                          </Button>
                        </ColumnFilterPopover>
                        {groupFilter && (
                          <Badge variant="secondary" className="text-xs">
                            {groupFilter}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CAS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name || "Nome não disponível"}</div>
                        {product.name_en && (
                          <div className="text-xs text-muted-foreground">{product.name_en}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.group_name || "-"}
                      </TableCell>
                      <TableCell>{product.compound_type || "-"}</TableCell>
                      <TableCell>{product.cas_number || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <PermissionGuard pageName="Dados do Site" action="modify" hideWhenNoAccess>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditProduct?.(product)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                                {product.is_active ? (
                                  <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDeleteProduct?.(product)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </PermissionGuard>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
        </div>
      )}

      {/* CSV Import Modal */}
      <SiteProductsCSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImported={loadAll}
      />
    </div>
  );
}
