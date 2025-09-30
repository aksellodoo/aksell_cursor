import React from "react";
import { useParams } from "react-router-dom";
import PaginaInicial from "./PaginaInicial";
import PaginaInicialEN from "./PaginaInicialEN";
import Empresa from "./Empresa";
import EmpresaEN from "./EmpresaEN";
import Produtos from "./Produtos";
import ProdutosEN from "./ProdutosEN";
import SitePrivacyPolicyPublic from "./SitePrivacyPolicyPublic";

import SiteLayout from "./SiteLayout";

const SitePageRouter: React.FC = () => {
  const { section = "home", lang = "pt" } = useParams<{ section?: string; lang?: string }>();

  // Handle default cases and missing language parameters
  const effectiveLang = lang || "pt";
  const effectiveSection = section || "home";

  // Home page routing
  if (effectiveSection === "home") {
    if (effectiveLang === "en") {
      return (
        <SiteLayout>
          <PaginaInicialEN />
        </SiteLayout>
      );
    }
    return (
      <SiteLayout>
        <PaginaInicial />
      </SiteLayout>
    );
  }

  // Company page routing
  if (effectiveSection === "empresa") {
    if (effectiveLang === "en") {
      return (
        <SiteLayout>
          <EmpresaEN />
        </SiteLayout>
      );
    }
    return (
      <SiteLayout>
        <Empresa />
      </SiteLayout>
    );
  }

  // Products page routing - handle both "produtos" and "products"
  if (effectiveSection === "produtos" || effectiveSection === "products") {
    if (effectiveLang === "en") {
      return (
        <SiteLayout>
          <ProdutosEN />
        </SiteLayout>
      );
    }
    return (
      <SiteLayout>
        <Produtos />
      </SiteLayout>
    );
  }

  // Privacy policy routing
  if (effectiveSection === "privacidade") {
    return (
      <SiteLayout>
        <SitePrivacyPolicyPublic key={effectiveLang} />
      </SiteLayout>
    );
  }

  // Default fallback to home page
  return (
    <SiteLayout>
      <PaginaInicial />
    </SiteLayout>
  );
};

export default SitePageRouter;
