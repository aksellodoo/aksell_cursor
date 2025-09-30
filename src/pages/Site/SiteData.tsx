
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Archive, Layers } from "lucide-react";
import { ProductsTab } from "@/components/site/ProductsTab";

import { PackagingTab } from "@/components/site/PackagingTab";
import { PalletsTab } from "@/components/site/PalletsTab";
import { ProductEditorFullscreen } from "@/components/site/ProductEditorFullscreen";

export default function SiteData() {
  const [activeTab, setActiveTab] = useState(() => {
    // Get tab from URL params or default to 'products'
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'products';
  });
  

  // Product editor state
  const [isProductFormOpen, setIsProductFormOpen] = useState(() => {
    return sessionStorage.getItem('product-form-open') === 'true';
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    if (value === 'products') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', value);
    }
    window.history.replaceState(null, '', url.toString());
  };

  // Listen for browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get('tab') || 'products';
      setActiveTab(tabFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // Product form handlers
  const handleOpenProductForm = () => {
    setSelectedProduct(null);
    setIsProductFormOpen(true);
    sessionStorage.setItem('product-form-open', 'true');
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsProductFormOpen(true);
    sessionStorage.setItem('product-form-open', 'true');
  };

  const handleCloseProductForm = () => {
    setIsProductFormOpen(false);
    setSelectedProduct(null);
    sessionStorage.removeItem('product-form-open');
    setRefreshCounter(prev => prev + 1);
  };

  const handleDeleteProduct = (product) => {
    // This will be handled directly in ProductsTab
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="packaging" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Embalagens
          </TabsTrigger>
          <TabsTrigger value="pallets" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Pallets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <ProductsTab 
            onOpenProductForm={handleOpenProductForm}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            refreshCounter={refreshCounter}
          />
        </TabsContent>


        <TabsContent value="packaging" className="mt-6">
          <PackagingTab />
        </TabsContent>

        <TabsContent value="pallets" className="mt-6">
          <PalletsTab />
        </TabsContent>
      </Tabs>


      {/* Product Editor Fullscreen Modal */}
      <ProductEditorFullscreen
        isOpen={isProductFormOpen}
        onClose={handleCloseProductForm}
        product={selectedProduct}
        onSuccess={handleCloseProductForm}
      />
    </div>
  );
}
