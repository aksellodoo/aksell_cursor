import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import aksellSymbol from "@/assets/aksell-symbol.png";

export function FloatingSidebarToggle() {
  const { open, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  // Only show on desktop when sidebar is closed
  if (isMobile || open) return null;

  return (
    <button
      onClick={toggleSidebar}
      className="fixed bottom-6 z-50 p-3 bg-card border border-border rounded-full shadow-lg hover:scale-105 transition-[left,transform] duration-200 peer-data-[collapsible=offcanvas]:left-4 peer-data-[collapsible=icon]:left-[calc(var(--sidebar-width-icon)+theme(spacing.4))]"
      aria-label="Abrir menu"
    >
      <img 
        src={aksellSymbol} 
        alt="Aksell" 
        className="w-6 h-6"
      />
    </button>
  );
}