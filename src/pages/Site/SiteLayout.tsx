import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";


interface SiteLayoutProps {
  children: React.ReactNode;
}

const SiteLayout: React.FC<SiteLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sora">
      {/* Cookie Consent Banner */}
      <CookieConsentBanner />

      {/* Botão de Login - acesso ao sistema */}
      <div className="fixed top-4 right-4 z-50">
        <Button asChild>
          <NavLink to="/auth">
            Entrar
          </NavLink>
        </Button>
      </div>

      {/* Conteúdo das páginas do site */}
      <div id="conteudo" className="min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default SiteLayout;
