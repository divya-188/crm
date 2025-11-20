import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './FlowBuilder.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Play,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Upload,
  Grid3x3,
  Trash2,
  Eye,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { NodePalette, nodeTypes } from '@/components/flow-builder';
import {
  MessageNodeModal,
  ConditionNodeModal,
  InputNodeModal,
  APINodeModal,
  DelayNodeModal,
  MessageNodeData,
  ConditionNodeData,
  InputNodeData,
  APINodeData,
  DelayNodeData,
} from '@/components/flow-builder/modals';
import ExecutionPanel from '@/components/flow-builder/ExecutionPanel';
import TestDataModal from '@/components/flow-builder/TestDataModal';
import { flowsService } from '@/services/flows.service';
import toast from '@/lib/toast';

// Start with empty canvas - users drag nodes to build flows
const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const FlowBuilderContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [backgroundVariant, setBackgroundVariant] = useState<BackgroundVariant>(
    BackgroundVariant.Dots
  );
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView, getNodes, getEdges, project, setViewport } = useReactFlow();
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

  // Set default zoom to 30% on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewport({ x: 0, y: 0, zoom: 0.3 }, { duration: 0 });
    }, 100);
    return () => clearTimeout(timer);
  }, [setViewport]);

  // Auto-collapse sidebar on mount for more canvas space
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Find the Menu button in the header
      const menuButtons = document.querySelectorAll('button');
      let toggleButton: HTMLButtonElement | null = null;
      
      // Find the button with Menu icon (has svg with specific path)
      menuButtons.forEach((btn) => {
        const svg = btn.querySelector('svg');
        if (svg && btn.className.includes('hover:bg-neutral-100')) {
          toggleButton = btn;
        }
      });
      
      if (toggleButton) {
        // Check if sidebar is currently expanded
        const sidebar = document.querySelector('aside') as HTMLElement;
        const wasExpanded = sidebar && sidebar.offsetWidth > 80;
        
        // Collapse sidebar if expanded
        if (wasExpanded) {
          toggleButton.click();
        }
        
        // Restore sidebar on unmount
        return () => {
          const sidebar = document.querySelector('aside') as HTMLElement;
          const isCollapsed = sidebar && sidebar.offsetWidth <= 80;
          
          if (isCollapsed && toggleButton) {
            toggleButton.click();
          }
        };
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Modal states
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Execution visualization states
  const [testDataModalOpen, setTestDataModalOpen] = useState(false);
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [executionPath, setExecutionPath] = useState<string[]>([]);
  const [executionContext, setExecutionContext] = useState<Record<string, any>>({});
  const [executionError, setExecutionError] = useState<string | undefined>();
  const [isExecutionRunning, setIsExecutionRunning] = useState(false);
  const [currentExecutionStep, setCurrentExecutionStep] = useState(0);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Open configuration modal for a node
  const openNodeConfig = useCallback((nodeId: string, nodeType: string) => {
    setSelectedNodeId(nodeId);
    
    switch (nodeType) {
      case 'message':
        setMessageModalOpen(true);
        break;
      case 'condition':
        setConditionModalOpen(true);
        break;
      case 'input':
        setInputModalOpen(true);
        break;
      case 'api':
        setApiModalOpen(true);
        break;
      case 'delay':
        setDelayModalOpen(true);
        break;
      default:
        console.warn('No configuration modal for node type:', nodeType);
    }
  }, []);

  // Get current node data for modal
  const getSelectedNodeData = useCallback(() => {
    if (!selectedNodeId) return undefined;
    const node = getNodes().find((n) => n.id === selectedNodeId);
    return node?.data;
  }, [selectedNodeId, getNodes]);

  // Save message node configuration
  const handleSaveMessageNode = useCallback((data: MessageNodeData) => {
    if (!selectedNodeId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: data.label || 'Send Message',
              message: data.message,
              isValid: true,
            },
          };
        }
        return node;
      })
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  // Save condition node configuration
  const handleSaveConditionNode = useCallback((data: ConditionNodeData) => {
    if (!selectedNodeId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          const conditionSummary = `${data.rules.length} condition${data.rules.length !== 1 ? 's' : ''} (${data.logic})`;
          return {
            ...node,
            data: {
              ...node.data,
              label: data.label || 'Condition',
              condition: conditionSummary,
              logic: data.logic,
              rules: data.rules,
              isValid: true,
            },
          };
        }
        return node;
      })
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  // Save input node configuration
  const handleSaveInputNode = useCallback((data: InputNodeData) => {
    if (!selectedNodeId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: data.label || 'Get User Input',
              prompt: data.prompt,
              variableName: data.variableName,
              inputType: data.inputType,
              validation: data.validation,
              errorMessage: data.errorMessage,
              isValid: true,
            },
          };
        }
        return node;
      })
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  // Save API node configuration
  const handleSaveAPINode = useCallback((data: APINodeData) => {
    if (!selectedNodeId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: data.label || 'API Request',
              method: data.method,
              url: data.url,
              headers: data.headers,
              body: data.body,
              responseVariable: data.responseVariable,
              timeout: data.timeout,
              isValid: true,
            },
          };
        }
        return node;
      })
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  // Save delay node configuration
  const handleSaveDelayNode = useCallback((data: DelayNodeData) => {
    if (!selectedNodeId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: data.label || 'Delay',
              duration: data.duration,
              unit: data.unit,
              isValid: true,
            },
          };
        }
        return node;
      })
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate flow has at least a start node
      if (nodes.length === 0) {
        toast.error('Cannot save an empty flow');
        return;
      }

      // Check if any nodes need configuration
      const unconfiguredNodes = nodes.filter(
        (node) => node.type !== 'start' && node.data.isValid === false
      );
      
      if (unconfiguredNodes.length > 0) {
        toast.error(
          `Please configure ${unconfiguredNodes.length} node${
            unconfiguredNodes.length > 1 ? 's' : ''
          } before saving`
        );
        return;
      }

      const flowPayload = {
        name: flowName,
        description: `Flow with ${nodes.length} nodes and ${edges.length} connections`,
        triggerType: 'manual' as const, // Default trigger type
        flowData: {
          nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type || 'unknown',
            position: node.position,
            data: node.data,
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined,
          })),
        },
      };

      console.log('Saving flow:', flowPayload);

      let savedFlow;
      if (flowId) {
        // Update existing flow
        savedFlow = await flowsService.updateFlow(flowId, flowPayload);
        toast.success('Flow updated successfully');
      } else {
        // Create new flow
        savedFlow = await flowsService.createFlow(flowPayload);
        setFlowId(savedFlow.id);
        toast.success('Flow created successfully');
      }

      console.log('Flow saved:', savedFlow);
    } catch (error: any) {
      console.error('Error saving flow:', error);
      toast.error(error.response?.data?.message || 'Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    setTestDataModalOpen(true);
  };

  const handleStartTest = async (testData: Record<string, any>) => {
    try {
      // First, save the flow if it has an ID, otherwise create a temporary test
      if (!flowId) {
        toast.error('Please save the flow before testing');
        return;
      }

      setExecutionPanelOpen(true);
      setExecutionLogs([]);
      setExecutionPath([]);
      setExecutionContext({});
      setExecutionError(undefined);
      setCurrentExecutionStep(0);

      const result = await flowsService.testFlow(flowId, testData);

      if (result.success) {
        setExecutionLogs(result.logs);
        setExecutionPath(result.executionPath);
        setExecutionContext(result.finalContext);
        toast.success('Flow test completed successfully');
      } else {
        setExecutionError(result.error);
        setExecutionLogs(result.logs);
        setExecutionPath(result.executionPath);
        setExecutionContext(result.finalContext);
        toast.error(`Flow test failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Test execution error:', error);
      setExecutionError(error.message || 'Failed to execute test');
      toast.error('Failed to execute flow test');
    }
  };

  const handlePlayExecution = () => {
    setIsExecutionRunning(true);
  };

  const handlePauseExecution = () => {
    setIsExecutionRunning(false);
  };

  const handleResetExecution = () => {
    setIsExecutionRunning(false);
    setCurrentExecutionStep(0);
    highlightExecutionPath(0);
  };

  const handleExecutionStepChange = (step: number) => {
    setCurrentExecutionStep(step);
    highlightExecutionPath(step);
  };

  const highlightExecutionPath = (step: number) => {
    // Highlight nodes and edges up to the current step
    setNodes((nds) =>
      nds.map((node) => {
        const isInPath = executionPath.slice(0, step + 1).includes(node.id);
        const isCurrent = executionPath[step] === node.id;
        return {
          ...node,
          style: {
            ...node.style,
            opacity: isInPath ? 1 : 0.3,
            boxShadow: isCurrent
              ? '0 0 0 3px rgba(139, 92, 246, 0.5)'
              : undefined,
          },
        };
      })
    );

    setEdges((eds) =>
      eds.map((edge) => {
        const sourceIndex = executionPath.indexOf(edge.source);
        const targetIndex = executionPath.indexOf(edge.target);
        const isInPath =
          sourceIndex !== -1 &&
          targetIndex !== -1 &&
          targetIndex === sourceIndex + 1 &&
          targetIndex <= step;
        return {
          ...edge,
          animated: isInPath,
          style: {
            ...edge.style,
            stroke: isInPath ? '#8b5cf6' : '#e5e7eb',
            strokeWidth: isInPath ? 3 : 2,
            opacity: isInPath ? 1 : 0.3,
          },
        };
      })
    );
  };

  // Auto-advance execution steps
  useEffect(() => {
    if (isExecutionRunning && currentExecutionStep < executionLogs.length) {
      const timer = setTimeout(() => {
        const nextStep = currentExecutionStep + 1;
        setCurrentExecutionStep(nextStep);
        highlightExecutionPath(nextStep);

        if (nextStep >= executionLogs.length) {
          setIsExecutionRunning(false);
        }
      }, 1000); // 1 second per step

      return () => clearTimeout(timer);
    }
  }, [isExecutionRunning, currentExecutionStep, executionLogs.length]);

  // Reset node styles when execution panel closes
  useEffect(() => {
    if (!executionPanelOpen) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: {
            ...node.style,
            opacity: 1,
            boxShadow: undefined,
          },
        }))
      );
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: '#8b5cf6',
            strokeWidth: 2,
            opacity: 1,
          },
        }))
      );
    }
  }, [executionPanelOpen]);

  const handleExport = () => {
    const flowData = {
      name: flowName,
      nodes,
      edges,
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${flowName.replace(/\s+/g, '-').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const flowData = JSON.parse(event.target?.result as string);
            setFlowName(flowData.name || 'Imported Flow');
            setNodes(flowData.nodes || []);
            setEdges(flowData.edges || []);
          } catch (error) {
            console.error('Error importing flow:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleFitView = () => {
    fitView({ duration: 300, padding: 0.2 });
  };

  const toggleBackgroundVariant = () => {
    setBackgroundVariant((prev) =>
      prev === BackgroundVariant.Dots
        ? BackgroundVariant.Lines
        : prev === BackgroundVariant.Lines
        ? BackgroundVariant.Cross
        : BackgroundVariant.Dots
    );
  };

  const handleDeleteSelected = () => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getEdges().filter((edge) => edge.selected);
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
    }
  };

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('nodeLabel');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      // Calculate position relative to the React Flow canvas
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type: type,
        position,
        data: { 
          label: label || type,
          nodeType: type,
          isValid: false, // New nodes need configuration
          onConfigure: (nodeId: string, nodeType: string) => openNodeConfig(nodeId, nodeType),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter((id) => id + 1);
    },
    [project, nodeIdCounter, setNodes, openNodeConfig]
  );

  // Update existing nodes with onConfigure callback when component mounts
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onConfigure: (nodeId: string, nodeType: string) => openNodeConfig(nodeId, nodeType),
        },
      }))
    );
  }, [openNodeConfig, setNodes]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-neutral-200 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="text-2xl font-bold text-neutral-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2"
              placeholder="Flow Name"
            />
            <span className="text-sm text-neutral-500">Draft</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Test
            </Button>
            {executionLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExecutionPanelOpen(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                View Execution
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="gap-2"
              disabled={isSaving}
              loading={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette Sidebar */}
        <NodePalette />

        {/* Flow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
            }}
          >
          {/* Background Grid */}
          <Background
            variant={backgroundVariant}
            gap={16}
            size={1}
            color="#e5e7eb"
          />

          {/* Controls */}
          <Controls
            showZoom={true}
            showFitView={true}
            showInteractive={true}
            position="bottom-right"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />

          {/* MiniMap */}
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'start':
                  return '#10b981';
                case 'end':
                  return '#f43f5e';
                case 'message':
                  return '#8b5cf6';
                case 'condition':
                  return '#06b6d4';
                case 'input':
                  return '#f59e0b';
                case 'delay':
                  return '#0891b2';
                case 'api':
                case 'webhook':
                case 'assignment':
                  return '#3b82f6';
                default:
                  return '#64748b';
              }
            }}
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-left"
            style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />

          {/* Toolbar Panel */}
          <Panel position="top-left" className="bg-white rounded-lg shadow-lg border border-neutral-200 p-2">
            <div className="flex items-center gap-1">
              <button
                className="p-2 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Coming Soon)"
                disabled
              >
                <Undo className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                className="p-2 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Coming Soon)"
                disabled
              >
                <Redo className="w-4 h-4 text-neutral-600" />
              </button>
              <div className="w-px h-6 bg-neutral-200 mx-1" />
              <button
                className="p-2 hover:bg-neutral-100 rounded transition-colors"
                title="Zoom In"
                onClick={handleZoomIn}
              >
                <ZoomIn className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                className="p-2 hover:bg-neutral-100 rounded transition-colors"
                title="Zoom Out"
                onClick={handleZoomOut}
              >
                <ZoomOut className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                className="p-2 hover:bg-neutral-100 rounded transition-colors"
                title="Fit View"
                onClick={handleFitView}
              >
                <Maximize className="w-4 h-4 text-neutral-600" />
              </button>
              <div className="w-px h-6 bg-neutral-200 mx-1" />
              <button
                className="p-2 hover:bg-neutral-100 rounded transition-colors"
                title="Toggle Background"
                onClick={toggleBackgroundVariant}
              >
                <Grid3x3 className="w-4 h-4 text-neutral-600" />
              </button>
              <button
                className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
                title="Delete Selected (Delete key)"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Panel>

          {/* Info Panel */}
          <Panel position="top-right">
            <Card variant="elevated" padding="sm" className="min-w-[200px]">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Nodes:</span>
                  <span className="font-semibold text-neutral-900">{nodes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Connections:</span>
                  <span className="font-semibold text-neutral-900">{edges.length}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Tip: Hold Shift to select multiple nodes
                  </p>
                </div>
              </div>
            </Card>
          </Panel>
        </ReactFlow>
        </div>
      </div>

      {/* Configuration Modals */}
      <MessageNodeModal
        isOpen={messageModalOpen}
        onClose={() => {
          setMessageModalOpen(false);
          setSelectedNodeId(null);
        }}
        onSave={handleSaveMessageNode}
        initialData={getSelectedNodeData()}
      />

      <ConditionNodeModal
        isOpen={conditionModalOpen}
        onClose={() => {
          setConditionModalOpen(false);
          setSelectedNodeId(null);
        }}
        onSave={handleSaveConditionNode}
        initialData={getSelectedNodeData()}
      />

      <InputNodeModal
        isOpen={inputModalOpen}
        onClose={() => {
          setInputModalOpen(false);
          setSelectedNodeId(null);
        }}
        onSave={handleSaveInputNode}
        initialData={getSelectedNodeData()}
      />

      <APINodeModal
        isOpen={apiModalOpen}
        onClose={() => {
          setApiModalOpen(false);
          setSelectedNodeId(null);
        }}
        onSave={handleSaveAPINode}
        initialData={getSelectedNodeData()}
      />

      <DelayNodeModal
        isOpen={delayModalOpen}
        onClose={() => {
          setDelayModalOpen(false);
          setSelectedNodeId(null);
        }}
        onSave={handleSaveDelayNode}
        initialData={getSelectedNodeData()}
      />

      {/* Test Data Modal */}
      <TestDataModal
        isOpen={testDataModalOpen}
        onClose={() => setTestDataModalOpen(false)}
        onStartTest={handleStartTest}
      />

      {/* Execution Panel */}
      <AnimatePresence>
        {executionPanelOpen && (
          <ExecutionPanel
            isOpen={executionPanelOpen}
            onClose={() => setExecutionPanelOpen(false)}
            logs={executionLogs}
            executionPath={executionPath}
            finalContext={executionContext}
            isRunning={isExecutionRunning}
            currentStep={currentExecutionStep}
            onPlay={handlePlayExecution}
            onPause={handlePauseExecution}
            onReset={handleResetExecution}
            onStepChange={handleExecutionStepChange}
            error={executionError}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const FlowBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
};

export default FlowBuilder;
