
import { useState, useEffect } from "react";
import { CustomFullscreenModal } from "@/components/ui/custom-fullscreen-modal";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";
import { CitiesTab } from "./CitiesTab";

interface CitiesFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CitiesFullscreenModal({ isOpen, onClose }: CitiesFullscreenModalProps) {
  // Persist modal state in sessionStorage
  useEffect(() => {
    if (isOpen) {
      sessionStorage.setItem('cities-modal-open', 'true');
    } else {
      sessionStorage.removeItem('cities-modal-open');
    }
  }, [isOpen]);

  // Restore modal state on page load
  useEffect(() => {
    const wasOpen = sessionStorage.getItem('cities-modal-open') === 'true';
    if (wasOpen && !isOpen) {
      // This effect runs when component mounts and modal should be open
      // but we don't want to automatically open it here to avoid infinite loops
    }
  }, []);

  const handleClose = () => {
    sessionStorage.removeItem('cities-modal-open');
    onClose();
  };

  return (
    <CustomFullscreenModal isOpen={isOpen} onClose={handleClose}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-xl font-semibold">Gestão de Cidades</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <CitiesTab />
      </div>
    </CustomFullscreenModal>
  );
}
