import React from 'react';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Template } from '@/types/models.types';
import { format } from 'date-fns';
import {
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface TemplateVersionComparisonProps {
  version1: Template;
  version2: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateVersionComparison: React.FC<TemplateVersionComparisonProps> = ({
  version1,
  version2,
  open,
  onOpenChange,
}) => {
  // Ensure version1 is the older version
  const [olderVersion, newerVersion] =
    version1.version < version2.version ? [version1, version2] : [version2, version1];

  const hasChanged = (field: keyof Template) => {
    return olderVersion[field] !== newerVersion[field];
  };

  const renderFieldComparison = (
    label: string,
    oldValue: any,
    newValue: any,
    changed: boolean
  ) => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {!changed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
          <div
            className={`rounded-lg border p-3 ${
              changed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {oldValue || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {changed && (
              <Badge variant="secondary" className="text-xs">
                Changed
              </Badge>
            )}
          </div>
          <div
            className={`rounded-lg border p-3 ${
              changed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {newValue || <span className="text-gray-400 italic">Not set</span>}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderButtonsComparison = () => {
    const oldButtons = olderVersion.buttons || [];
    const newButtons = newerVersion.buttons || [];
    const changed =
      JSON.stringify(oldButtons) !== JSON.stringify(newButtons);

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Buttons</span>
            {!changed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
          <div
            className={`rounded-lg border p-3 ${
              changed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {oldButtons.length > 0 ? (
              <div className="space-y-2">
                {oldButtons.map((button, index) => (
                  <div key={index} className="rounded border border-gray-300 bg-white p-2">
                    <div className="text-xs font-medium text-gray-500">{button.type}</div>
                    <div className="text-sm text-gray-900">{button.text}</div>
                    {button.url && (
                      <div className="text-xs text-gray-600 truncate">{button.url}</div>
                    )}
                    {button.phoneNumber && (
                      <div className="text-xs text-gray-600">{button.phoneNumber}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">No buttons</span>
            )}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Buttons</span>
            {changed && (
              <Badge variant="secondary" className="text-xs">
                Changed
              </Badge>
            )}
          </div>
          <div
            className={`rounded-lg border p-3 ${
              changed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {newButtons.length > 0 ? (
              <div className="space-y-2">
                {newButtons.map((button, index) => (
                  <div key={index} className="rounded border border-gray-300 bg-white p-2">
                    <div className="text-xs font-medium text-gray-500">{button.type}</div>
                    <div className="text-sm text-gray-900">{button.text}</div>
                    {button.url && (
                      <div className="text-xs text-gray-600 truncate">{button.url}</div>
                    )}
                    {button.phoneNumber && (
                      <div className="text-xs text-gray-600">{button.phoneNumber}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">No buttons</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVariablesComparison = () => {
    const oldVariables = olderVersion.variables || [];
    const newVariables = newerVersion.variables || [];
    const changed =
      JSON.stringify(oldVariables) !== JSON.stringify(newVariables);

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Variables</span>
            {!changed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </div>
          <div
            className={`rounded-lg border p-3 ${
              changed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {oldVariables.length > 0 ? (
              <div className="space-y-1">
                {oldVariables.map((variable, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-mono text-gray-900">{variable.name}</span>
                    <span className="text-gray-500"> = </span>
                    <span className="text-gray-700">{variable.example}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">No variables</span>
            )}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Variables</span>
            {changed && (
              <Badge variant="secondary" className="text-xs">
                Changed
              </Badge>
            )}
          </div>
          <div
            className={`rounded-lg border p-3 ${
              changed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            {newVariables.length > 0 ? (
              <div className="space-y-1">
                {newVariables.map((variable, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-mono text-gray-900">{variable.name}</span>
                    <span className="text-gray-500"> = </span>
                    <span className="text-gray-700">{variable.example}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">No variables</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const changedFields = [
    'name',
    'category',
    'language',
    'content',
    'header',
    'footer',
    'status',
  ].filter((field) => hasChanged(field as keyof Template));

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Version Comparison"
      description={`Comparing changes between version ${olderVersion.version} and version ${newerVersion.version}`}
      size="full"
    >
      <div className="space-y-4">

        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Version {olderVersion.version}</div>
              <div className="text-xs text-gray-600">
                {format(new Date(olderVersion.createdAt), 'MMM d, yyyy')}
              </div>
              <Badge variant="neutral" className="mt-1">
                {olderVersion.status}
              </Badge>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Version {newerVersion.version}</div>
              <div className="text-xs text-gray-600">
                {format(new Date(newerVersion.createdAt), 'MMM d, yyyy')}
              </div>
              <Badge variant="neutral" className="mt-1">
                {newerVersion.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {changedFields.length > 0 ? (
              <>
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">
                  {changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">No changes detected</span>
              </>
            )}
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto pr-4">
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">How to read this comparison:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>
                    <span className="text-red-700">Red background</span> shows the old value
                  </li>
                  <li>
                    <span className="text-green-700">Green background</span> shows the new value
                  </li>
                  <li>
                    <span className="text-gray-700">Gray background</span> indicates no change
                  </li>
                </ul>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h3>
              <div className="space-y-4">
                {renderFieldComparison(
                  'Template Name',
                  olderVersion.name,
                  newerVersion.name,
                  hasChanged('name')
                )}
                {renderFieldComparison(
                  'Category',
                  olderVersion.category,
                  newerVersion.category,
                  hasChanged('category')
                )}
                {renderFieldComparison(
                  'Language',
                  olderVersion.language,
                  newerVersion.language,
                  hasChanged('language')
                )}
              </div>
            </div>

            <div className="border-t my-6" />

            {/* Template Content */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Template Content</h3>
              <div className="space-y-4">
                {renderFieldComparison(
                  'Header',
                  olderVersion.header,
                  newerVersion.header,
                  hasChanged('header')
                )}
                {renderFieldComparison(
                  'Body Content',
                  olderVersion.content,
                  newerVersion.content,
                  hasChanged('content')
                )}
                {renderFieldComparison(
                  'Footer',
                  olderVersion.footer,
                  newerVersion.footer,
                  hasChanged('footer')
                )}
              </div>
            </div>

            <div className="border-t my-6" />

            {/* Buttons */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Buttons</h3>
              {renderButtonsComparison()}
            </div>

            <div className="border-t my-6" />

            {/* Variables */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Variables</h3>
              {renderVariablesComparison()}
            </div>

            <div className="border-t my-6" />

            {/* Status and Metadata */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Status & Metadata</h3>
              <div className="space-y-4">
                {renderFieldComparison(
                  'Status',
                  olderVersion.status,
                  newerVersion.status,
                  hasChanged('status')
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Quality Score</span>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-900">
                        {olderVersion.qualityScore !== undefined
                          ? `${olderVersion.qualityScore}/100`
                          : 'Not calculated'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Quality Score</span>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-900">
                        {newerVersion.qualityScore !== undefined
                          ? `${newerVersion.qualityScore}/100`
                          : 'Not calculated'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Usage Count</span>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-900">{olderVersion.usageCount}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Usage Count</span>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm text-gray-900">{newerVersion.usageCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reasons (if any) */}
            {(olderVersion.rejectionReason || newerVersion.rejectionReason) && (
              <>
                <div className="border-t my-6" />
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Rejection Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {olderVersion.rejectionReason ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                          <p className="mt-1 text-sm text-red-700">
                            {olderVersion.rejectionReason}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <p className="text-sm text-gray-400 italic">Not rejected</p>
                        </div>
                      )}
                    </div>
                    <div>
                      {newerVersion.rejectionReason ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                          <p className="mt-1 text-sm text-red-700">
                            {newerVersion.rejectionReason}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <p className="text-sm text-gray-400 italic">Not rejected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
