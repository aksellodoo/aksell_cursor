
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface CustomFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CustomFullscreenModal = ({
  isOpen,
  onClose,
  children,
  className
}: CustomFullscreenModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Prevent any potential focus/blur events from closing the modal
      const preventAutoClose = (e: Event) => {
        e.stopPropagation();
      };
      
      // Add event listeners to prevent unwanted closing
      window.addEventListener('blur', preventAutoClose, true);
      window.addEventListener('focus', preventAutoClose, true);
      document.addEventListener('visibilitychange', preventAutoClose, true);
      
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('blur', preventAutoClose, true);
        window.removeEventListener('focus', preventAutoClose, true);
        document.removeEventListener('visibilitychange', preventAutoClose, true);
      };
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div
        className={cn(
          "relative z-50 w-full h-full bg-background flex flex-col animate-in fade-in-0 duration-300 max-w-none max-h-none overflow-hidden",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
