import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  XCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useTemplateEditorStore, ValidationError, ValidationWarning } from '@/stores/template-editor.store';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ValidationPanelProps {
  className?: string;
}

interface GroupedValidation {
  field: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * ValidationPanel Component
 * 
 * Displays validation errors and warnings with:
 * - Field references and grouping
 * - Error severity indicators
 * - Jump to field functionality
 * - Collapsible error groups
 * - Clear error messages with codes
 * 
 * Requirements: 10.7, 20.1, 20.2
 */
export const ValidationPanel: React.FC<ValidationPanelProps> = ({ className }) => {
  const {
    validationErrors,
    validationWarnings,
    setActiveComponent,
  } = useTemplateEditorStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showWarnings, setShowWarnings] = useState(true);

  // Group errors and warnings by field
  const groupedValidations = useMemo(() => {
    const groups = new Map<string, GroupedValidation>();

    // Group errors
    validationErrors.forEach((error) => {
      const field = error.field || 'general';
      if (!groups.has(field)) {
        groups.set(field, { field, errors: [], warnings: [] });
      }
      groups.get(field)!.errors.push(error);
    });

    // Group warnings
    validationWarnings.forEach((warning) => {
      const field = warning.field || 'general';
      if (!groups.has(field)) {
        groups.set(field, { field, errors: [], warnings: [] });
      }
      groups.get(field)!.warnings.push(warning);
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Sort by: errors first, then by field name
      if (a.errors.length > 0 && b.errors.length === 0) return -1;
      if (a.errors.length === 0 && b.errors.length > 0) return 1;
      return a.field.localeCompare(b.field);
    });
  }, [validationErrors, validationWarnings]);

  // Toggle group expansion
  const toggleGroup = (field: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  // Expand all groups
  const expandAll = () => {
    setExpandedGroups(new Set(groupedValidations.map((g) => g.field)));
  };

  // Collapse all groups
  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Jump to field - maps field names to component sections
  const jumpToField = (field: string) => {
    const fieldMap: Record<string, string> = {
      name: 'basic',
      displayName: 'basic',
      category: 'basic',
      language: 'basic',
      description: 'basic',
      'header': 'header',
      'header.text': 'header',
      'header.type': 'header',
      'body': 'body',
      'body.text': 'body',
      'footer': 'footer',
      'footer.text': 'footer',
      'buttons': 'buttons',
      'placeholders': 'placeholders',
    };

    // Find the component section for this field
    let componentSection = 'basic';
    for (const [key, value] of Object.entries(fieldMap)) {
      if (field.startsWith(key)) {
        componentSection = value;
        break;
      }
    }

    // Set active component
    setActiveComponent(componentSection as any);

    // Scroll to the component section
    setTimeout(() => {
      const element = document.getElementById(`component-${componentSection}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Get human-readable field name
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: 'Template Name',
      displayName: 'Display Name',
      category: 'Category',
      language: 'Language',
      description: 'Description',
      'header': 'Header',
      'header.text': 'Header Text',
      'header.type': 'Header Type',
      'body': 'Body',
      'body.text': 'Body Text',
      'footer': 'Footer',
      'footer.text': 'Footer Text',
      'buttons': 'Buttons',
      'placeholders': 'Placeholders',
      'general': 'General',
    };

    // Try exact match first
    if (labels[field]) {
      return labels[field];
    }

    // Try partial match
    for (const [key, value] of Object.entries(labels)) {
      if (field.startsWith(key)) {
        return value;
      }
    }

    // Fallback: capitalize and format
    return field
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' > ');
  };

  // Get severity badge
  const getSeverityBadge = (hasErrors: boolean, warningCount: number) => {
    if (hasErrors) {
      return (
        <Badge variant="danger" size="sm" dot>
          Error
        </Badge>
      );
    }
    if (warningCount > 0) {
      return (
        <Badge variant="warning" size="sm" dot>
          Warning
        </Badge>
      );
    }
    return null;
  };

  if (groupedValidations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-lg border border-green-200 bg-green-50 p-6',
          className
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Info className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-900">
              No Validation Issues
            </h3>
            <p className="mt-1 text-sm text-green-700">
              Your template passes all validation checks. You can proceed to submit it for approval.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const totalErrors = validationErrors.length;
  const totalWarnings = validationWarnings.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      {/* Summary Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {totalErrors > 0 ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Validation Issues Found
              </h3>
              <div className="mt-1 flex items-center space-x-3 text-sm">
                {totalErrors > 0 && (
                  <span className="text-red-600">
                    {totalErrors} error{totalErrors !== 1 ? 's' : ''}
                  </span>
                )}
                {totalWarnings > 0 && (
                  <span className="text-yellow-600">
                    {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {totalWarnings > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWarnings(!showWarnings)}
              >
                {showWarnings ? 'Hide' : 'Show'} Warnings
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Validation Groups */}
      <div className="space-y-3">
        {groupedValidations.map((group) => {
          const hasErrors = group.errors.length > 0;
          const hasWarnings = group.warnings.length > 0;
          const isExpanded = expandedGroups.has(group.field);

          // Skip if only warnings and warnings are hidden
          if (!hasErrors && !showWarnings) {
            return null;
          }

          return (
            <motion.div
              key={group.field}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-lg border bg-white overflow-hidden',
                hasErrors ? 'border-red-200' : 'border-yellow-200'
              )}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.field)}
                className={cn(
                  'w-full flex items-center justify-between p-4 text-left transition-colors',
                  hasErrors
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'bg-yellow-50 hover:bg-yellow-100'
                )}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {getFieldLabel(group.field)}
                      </span>
                      {getSeverityBadge(hasErrors, group.warnings.length)}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-600">
                      {group.errors.length > 0 && (
                        <span>
                          {group.errors.length} error{group.errors.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {group.errors.length > 0 && group.warnings.length > 0 && (
                        <span className="mx-1">•</span>
                      )}
                      {group.warnings.length > 0 && showWarnings && (
                        <span>
                          {group.warnings.length} warning{group.warnings.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToField(group.field);
                    }}
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Jump to field</span>
                  </Button>
                </div>
              </button>

              {/* Group Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-4 space-y-3">
                      {/* Errors */}
                      {group.errors.map((error, index) => (
                        <motion.div
                          key={`error-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start space-x-3 rounded-lg bg-red-50 p-3"
                        >
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-900">
                              {error.message}
                            </p>
                            {error.code && (
                              <p className="mt-1 text-xs text-red-700 font-mono">
                                Code: {error.code}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Warnings */}
                      {showWarnings && group.warnings.map((warning, index) => (
                        <motion.div
                          key={`warning-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (group.errors.length + index) * 0.05 }}
                          className="flex items-start space-x-3 rounded-lg bg-yellow-50 p-3"
                        >
                          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-yellow-900">
                              {warning.message}
                            </p>
                            {warning.code && (
                              <p className="mt-1 text-xs text-yellow-700 font-mono">
                                Code: {warning.code}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">
              Need Help?
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              Click "Jump to field" to navigate directly to the component that needs attention.
              Fix all errors before submitting your template for approval.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ValidationPanel;
