import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Lock, Archive, EyeOff } from 'lucide-react';
import { getDepartmentIcon } from '@/utils/departmentIcons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentTreeItem } from '@/pages/DocumentManagement';

interface TreeNodeProps {
  node: DocumentTreeItem;
  isSelected: boolean;
  isExpanded: boolean;
  selectedNodeId?: string;
  onSelect: (node: DocumentTreeItem) => void;
  onToggle: (nodeId: string) => void;
  level: number;
  expandedNodes?: Set<string>;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  isSelected,
  isExpanded,
  selectedNodeId,
  onSelect,
  onToggle,
  level,
  expandedNodes
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: node.id,
    disabled: node.type === 'department' // Only allow folder dragging
  });

  const [dragStarted, setDragStarted] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = node.children.length > 0;
  
  const getStatusIcon = () => {
    if (node.status === 'archived') return <Archive className="h-3 w-3" />;
    if (node.status === 'hidden') return <EyeOff className="h-3 w-3" />;
    return null;
  };

  const getStatusColor = () => {
    switch (node.status) {
      case 'archived': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'hidden': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group select-none',
        isDragging && 'opacity-50'
      )}
      {...attributes}
    >
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent/50',
          isSelected && 'bg-accent text-accent-foreground',
          level > 0 && 'ml-4'
        )}
        onClick={(e) => {
          // Only trigger click if not in middle of drag operation
          if (!dragStarted && !isDragging) {
            onSelect(node);
          }
        }}
        onMouseDown={() => setDragStarted(false)}
        onDragStart={() => setDragStarted(true)}
        {...(node.type === 'folder' ? listeners : {})}
      >
        {/* Toggle Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="flex items-center justify-center w-4 h-4 hover:bg-accent rounded-sm"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-4" />}

        {/* Icon */}
        <div className="flex items-center gap-1">
          {node.type === 'department' ? (
            <div 
              className="flex items-center justify-center w-6 h-6 rounded-full text-white"
              style={{ backgroundColor: node.color }}
            >
              {React.createElement(getDepartmentIcon(node.name), { 
                className: "h-3 w-3" 
              })}
            </div>
          ) : isExpanded ? (
            <FolderOpen className="h-4 w-4 text-amber-600" />
          ) : (
            <Folder className="h-4 w-4 text-amber-600" />
          )}
          
          {node.has_custom_acl && (
            <Lock className="h-3 w-3 text-orange-500" />
          )}
          
          {getStatusIcon()}
        </div>

        {/* Name */}
        <span 
          className={cn(
            'flex-1 text-sm font-medium truncate',
            node.status === 'archived' && 'text-muted-foreground',
            node.status === 'hidden' && 'text-muted-foreground italic'
          )}
        >
          {node.name}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
           {node.children.map(child => (
             <TreeNode
               key={child.id}
               node={child}
               isSelected={selectedNodeId === child.id}
               isExpanded={expandedNodes?.has ? expandedNodes.has(child.id) : false}
               selectedNodeId={selectedNodeId}
               expandedNodes={expandedNodes}
               onSelect={onSelect}
               onToggle={onToggle}
               level={level + 1}
             />
           ))}
        </div>
      )}
    </div>
  );
};