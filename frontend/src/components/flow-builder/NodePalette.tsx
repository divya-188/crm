import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  GitBranch,
  Clock,
  ArrowRight,
  Keyboard,
  Square,
  Zap,
  Send,
  Table,
  UserPlus,
  Tag,
  Edit3,
  Play,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import Input from '@/components/ui/Input';

// Node type definitions
export interface NodeTypeDefinition {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

export interface NodeCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  nodes: NodeTypeDefinition[];
}

// Define all available node types
export const nodeCategories: NodeCategory[] = [
  {
    name: 'Messages',
    icon: MessageSquare,
    nodes: [
      {
        type: 'message',
        label: 'Send Message',
        icon: MessageSquare,
        description: 'Send a text message to the user',
        color: '#8b5cf6',
      },
      {
        type: 'template',
        label: 'Send Template',
        icon: FileText,
        description: 'Send a WhatsApp template message',
        color: '#7c3aed',
      },
    ],
  },
  {
    name: 'Logic',
    icon: GitBranch,
    nodes: [
      {
        type: 'condition',
        label: 'Condition',
        icon: GitBranch,
        description: 'Branch based on conditions',
        color: '#06b6d4',
      },
      {
        type: 'delay',
        label: 'Delay',
        icon: Clock,
        description: 'Wait for a specified time',
        color: '#0891b2',
      },
      {
        type: 'jump',
        label: 'Jump to Node',
        icon: ArrowRight,
        description: 'Jump to another node in the flow',
        color: '#0e7490',
      },
    ],
  },
  {
    name: 'Input',
    icon: Keyboard,
    nodes: [
      {
        type: 'input',
        label: 'Capture Input',
        icon: Keyboard,
        description: 'Capture user text input',
        color: '#f59e0b',
      },
      {
        type: 'button',
        label: 'Button Choice',
        icon: Square,
        description: 'Present buttons for user selection',
        color: '#d97706',
      },
    ],
  },
  {
    name: 'Actions',
    icon: Zap,
    nodes: [
      {
        type: 'api',
        label: 'API Request',
        icon: Zap,
        description: 'Make an HTTP API request',
        color: '#3b82f6',
      },
      {
        type: 'webhook',
        label: 'Webhook',
        icon: Send,
        description: 'Send data to a webhook URL',
        color: '#2563eb',
      },
      {
        type: 'spreadsheet',
        label: 'Google Sheets',
        icon: Table,
        description: 'Read/write to Google Sheets',
        color: '#1d4ed8',
      },
      {
        type: 'assignment',
        label: 'Assign Agent',
        icon: UserPlus,
        description: 'Assign conversation to an agent',
        color: '#1e40af',
      },
      {
        type: 'tag',
        label: 'Add Tag',
        icon: Tag,
        description: 'Add tags to the contact',
        color: '#1e3a8a',
      },
      {
        type: 'customField',
        label: 'Update Field',
        icon: Edit3,
        description: 'Update contact custom field',
        color: '#6366f1',
      },
    ],
  },

];

interface NodePaletteProps {
  onNodeDragStart?: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onNodeDragStart }) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeLabel: string
  ) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('nodeLabel', nodeLabel);
    event.dataTransfer.effectAllowed = 'move';
    
    if (onNodeDragStart) {
      onNodeDragStart(event, nodeType);
    }
  };

  // Filter nodes based on search query
  const filteredCategories = nodeCategories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.type.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.nodes.length > 0);

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-72 bg-white border-r border-neutral-200 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">
          Node Palette
        </h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No nodes found</p>
            <p className="text-xs text-neutral-400 mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.name);
            const CategoryIcon = category.icon;

            return (
              <div key={category.name} className="space-y-2">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-4 h-4 text-neutral-500 group-hover:text-primary-500 transition-colors" />
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                      {category.name}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({category.nodes.length})
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isCollapsed ? 0 : 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </motion.div>
                </button>

                {/* Category Nodes */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {category.nodes.map((node) => {
                        const NodeIcon = node.icon;

                        return (
                          <div
                            key={node.type}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, node.type, node.label)
                            }
                            className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-white cursor-move hover:border-primary-300 hover:shadow-soft transition-all group hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              borderLeftWidth: '3px',
                              borderLeftColor: node.color,
                            }}
                          >
                            <div
                              className="p-2 rounded-lg flex-shrink-0"
                              style={{
                                backgroundColor: `${node.color}15`,
                              }}
                            >
                              <div style={{ color: node.color }}>
                                <NodeIcon className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-neutral-900 mb-0.5">
                                {node.label}
                              </h4>
                              <p className="text-xs text-neutral-500 line-clamp-2">
                                {node.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Tip */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50">
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded bg-primary-100 flex-shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-700 mb-0.5">
              Drag & Drop
            </p>
            <p className="text-xs text-neutral-500">
              Drag nodes onto the canvas to build your flow
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NodePalette;
