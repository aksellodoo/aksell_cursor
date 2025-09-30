import { Node, Edge } from '@xyflow/react';

// Mapeamento entre tipos de template e tipos do WorkflowBuilder
const NODE_TYPE_MAPPING = {
  'trigger': 'triggerNode',
  'task': 'taskNode', 
  'condition': 'conditionNode',
  'delay': 'delayNode',
  'notification': 'notificationNode',
  'approval': 'approvalNode',
  'form': 'formNode',
  'webhook': 'webhookNode',
  'loop': 'loopNode',
  // Mapeamento reverso também
  'triggerNode': 'trigger',
  'taskNode': 'task',
  'conditionNode': 'condition', 
  'delayNode': 'delay',
  'notificationNode': 'notification',
  'approvalNode': 'approval',
  'formNode': 'form',
  'webhookNode': 'webhook',
  'loopNode': 'loop',
};

export const convertTemplateToBuilder = (templateDefinition: any): { nodes: Node[], edges: Edge[] } => {
  if (!templateDefinition || !templateDefinition.nodes) {
    return { nodes: [], edges: [] };
  }

  const convertedNodes = templateDefinition.nodes.map((node: any) => ({
    ...node,
    type: NODE_TYPE_MAPPING[node.type] || node.type,
  }));

  const convertedEdges = templateDefinition.edges || [];

  return {
    nodes: convertedNodes,
    edges: convertedEdges,
  };
};

export const convertBuilderToTemplate = (nodes: Node[], edges: Edge[]): any => {
  const convertedNodes = nodes.map((node) => ({
    ...node,
    type: NODE_TYPE_MAPPING[node.type] || node.type,
  }));

  return {
    nodes: convertedNodes,
    edges: edges,
  };
};

export const getNodeTypeLabel = (type: string): string => {
  const labels = {
    'trigger': 'Trigger',
    'triggerNode': 'Trigger',
    'task': 'Tarefa',
    'taskNode': 'Tarefa',
    'condition': 'Condição',
    'conditionNode': 'Condição',
    'delay': 'Aguardar',
    'delayNode': 'Aguardar',
    'notification': 'Notificação',
    'notificationNode': 'Notificação',
    'approval': 'Aprovação',
    'approvalNode': 'Aprovação',
    'form': 'Formulário',
    'formNode': 'Formulário',
    'webhook': 'Webhook',
    'webhookNode': 'Webhook',
    'loop': 'Loop',
    'loopNode': 'Loop',
  };
  
  return labels[type] || type;
};

// Melhorar conversão para preservar todos os dados
export const convertTemplateToBuilderEnhanced = (templateDefinition: any): { nodes: Node[], edges: Edge[] } => {
  console.log('🔄 Converting template to builder format:', templateDefinition);
  
  if (!templateDefinition || !templateDefinition.nodes) {
    console.warn('⚠️ Template definition is invalid or missing nodes');
    return { nodes: [], edges: [] };
  }

  const convertedNodes = templateDefinition.nodes.map((node: any) => {
    // Preserve all original node properties and enhance with required data
    const convertedNode = {
      ...node,
      // Convert type if needed for React Flow compatibility
      type: NODE_TYPE_MAPPING[node.type] || node.type,
      data: {
        // Preserve all existing data
        ...node.data,
        // Ensure we have essential properties for display
        label: node.data?.label || getNodeTypeLabel(node.type),
        title: node.data?.title || node.data?.label || getNodeTypeLabel(node.type),
        description: node.data?.description || '',
        // Preserve workflow-specific properties
        assignedTo: node.data?.assignedTo,
        assignedDepartment: node.data?.assignedDepartment,
        assignedUsers: node.data?.assignedUsers,
        priority: node.data?.priority,
        dueDate: node.data?.dueDate,
        conditions: node.data?.conditions,
        duration: node.data?.duration,
        message: node.data?.message,
        recipients: node.data?.recipients,
        approvers: node.data?.approvers,
        formFields: node.data?.formFields,
        webhookUrl: node.data?.webhookUrl,
        loopCondition: node.data?.loopCondition,
        // Preserve any other custom properties
        ...Object.keys(node.data || {}).reduce((acc, key) => {
          if (!['label', 'title', 'description'].includes(key)) {
            acc[key] = node.data[key];
          }
          return acc;
        }, {} as any)
      },
      // Preserve position
      position: node.position || { x: 0, y: 0 },
      // Preserve other React Flow properties
      draggable: node.draggable,
      selectable: node.selectable,
      deletable: node.deletable,
      width: node.width,
      height: node.height,
      style: node.style,
      className: node.className,
      sourcePosition: node.sourcePosition,
      targetPosition: node.targetPosition,
      hidden: node.hidden,
      selected: node.selected,
      zIndex: node.zIndex,
    };
    
    console.log('✅ Converted node:', {
      id: convertedNode.id,
      type: convertedNode.type,
      originalType: node.type,
      data: convertedNode.data
    });
    return convertedNode;
  });

  const convertedEdges = (templateDefinition.edges || []).map((edge: any) => ({
    ...edge,
    // Ensure edge has all required properties
    id: edge.id || `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'default',
    style: edge.style,
    className: edge.className,
    data: edge.data,
    animated: edge.animated,
    hidden: edge.hidden,
    selected: edge.selected,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    labelStyle: edge.labelStyle,
    labelShowBg: edge.labelShowBg,
    labelBgStyle: edge.labelBgStyle,
    labelBgPadding: edge.labelBgPadding,
    labelBgBorderRadius: edge.labelBgBorderRadius,
  }));

  console.log('✅ Final conversion result:', { 
    nodes: convertedNodes.length, 
    edges: convertedEdges.length,
    nodeTypes: convertedNodes.map(n => n.type),
    edgeTypes: convertedEdges.map(e => e.type)
  });

  return {
    nodes: convertedNodes,
    edges: convertedEdges,
  };
};