import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ChatterPanel } from "./ChatterPanel";
import { cn } from "@/lib/utils";

interface ChatterLayoutProps {
  children: React.ReactNode;
  recordType?: string;
  recordId?: string;
  recordName?: string;
  showFixedChatter?: boolean;
  className?: string;
}

// Define routes that should show fixed chatter panel
const FIXED_CHATTER_ROUTES = [
  '/users/',
  '/departments/',
  '/tasks/',
  '/employees/',
  '/permissions/'
];


export const ChatterLayout = ({ 
  children, 
  recordType,
  recordId,
  recordName,
  showFixedChatter = false,
  className = ""
}: ChatterLayoutProps) => {
  const location = useLocation();
  const [isChatterOpen, setIsChatterOpen] = useState(false);
  
  // Determine if current route should show fixed chatter
  const shouldShowFixedChatter = () => {
    if (!recordType || !recordId) return false;
    
    // Check if it's a detail/edit route (has ID in path)
    const isDetailRoute = FIXED_CHATTER_ROUTES.some(route => 
      location.pathname.startsWith(route) && 
      location.pathname !== route.slice(0, -1) // Not the base list route
    );
    
    return isDetailRoute || showFixedChatter;
  };

  const isFixedChatterEnabled = shouldShowFixedChatter();

  return (
    <div className={cn("relative", className)}>
      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        isFixedChatterEnabled ? "mr-0" : ""
      )}>
        {children}
      </div>

      {/* Fixed Chatter Panel - only show on detail/edit routes */}
      {isFixedChatterEnabled && recordType && recordId && (
        <ChatterPanel
          recordType={recordType}
          recordId={recordId}
          recordName={recordName}
          mode="fixed"
          onClose={() => setIsChatterOpen(false)}
        />
      )}

    </div>
  );
};