
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface FullscreenDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  className?: string;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disableAutoFocus?: boolean;
  disableFocusTrap?: boolean;
  persistent?: boolean;
}

export const FullscreenDialogContent = ({
  className,
  children,
  open,
  onOpenChange,
  disableAutoFocus,
  disableFocusTrap,
  persistent = false,
  ...props
}: FullscreenDialogContentProps) => {
  const handleOpenChange = (newOpen: boolean) => {
    // If persistent is true and trying to close, ignore
    if (persistent && !newOpen) {
      return;
    }
    onOpenChange(newOpen);
  };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={!disableFocusTrap} {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            if (disableAutoFocus) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (persistent) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (persistent) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (persistent) e.preventDefault();
          }}
          className={cn(
            "fixed inset-0 z-50 w-screen h-screen bg-background outline-none grid grid-rows-[auto_1fr_auto]",
            className
          )}
        >
          <DialogPrimitive.Title className="sr-only">Diálogo</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Conteúdo em tela cheia</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
