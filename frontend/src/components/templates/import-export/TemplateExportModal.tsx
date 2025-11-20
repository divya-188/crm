import React, { useState } from 'react';
import { X, Download, FileJson, CheckSquare, Square, Info } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { templatesService } from '@/services/templates.service';
import Toast from '@/lib/toast-system';
import { Template } from '@/types/models.types';

interface TemplateExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedTemplateIds?: string[];
}

const TemplateExportModal: React.FC<TemplateExportModalProps> = ({
  isOpen,
  onClose,
  preSelectedTemplateIds = [],
}) => {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(preSelectedTemplateIds);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [exportAll, setExportAll] = useState(preSelectedTemplateIds.length === 0);

  // Fetch templates for selection
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', { includeArchived }],
    queryFn: () =>
      templatesService.getTemplates({
        page: 1,
        limit: 1000,
        includeArchived,
      }),
    enabled: isOpen,
  });

  const exportMutation = useMutation({
    mutationFn: (options: {
      templateIds?: string[];
      includeArchived: boolean;
      includeAnalytics: boolean;
      includeHistory: boolean;
    }) => templatesService.exportTemplates(options),
    onSuccess: (data) => {
      // Create a blob and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = exportAll
        ? `templates-export-${timestamp}.json`
        : `templates-export-${selectedTemplateIds.length}-${timestamp}.json`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Toast.success(
        `Successfully exported ${data.templates.length} template${
          data.templates.length !== 1 ? 's' : ''
        }`
      );
      handleClose();
    },
    onError: (error: any) => {
      Toast.error(error.response?.data?.message || 'Failed to export templates');
    },
  });

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSelectAll = () => {
    if (templatesData?.data) {
      setSelectedTemplateIds(templatesData.data.map((t) => t.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTemplateIds([]);
  };

  const handleExport = () => {
    const options = {
      templateIds: exportAll ? undefined : selectedTemplateIds,
      includeArchived,
      includeAnalytics,
      includeHistory,
    };

    exportMutation.mutate(options);
  };

  const handleClose = () => {
    setSelectedTemplateIds(preSelectedTemplateIds);
    setExportAll(preSelectedTemplateIds.length === 0);
    setIncludeArchived(false);
    setIncludeAnalytics(false);
    setIncludeHistory(false);
    onClose();
  };

  if (!isOpen) return null;

  const templates = templatesData?.data || [];
  const selectedCount = exportAll ? templates.length : selectedTemplateIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Templates</h2>
            <p className="text-sm text-gray-500 mt-1">
              Export templates to JSON format for backup or migration
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={exportMutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Export Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Export Options</h3>

              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={exportAll}
                    onChange={(e) => {
                      setExportAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedTemplateIds([]);
                      }
                    }}
                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">Export all templates</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Export all templates in your account
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      Include archived templates
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Include templates that have been archived
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={includeAnalytics}
                    onChange={(e) => setIncludeAnalytics(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      Include analytics data
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Include usage statistics and performance metrics
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      Include status history
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Include approval status changes and timestamps
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Template Selection */}
            {!exportAll && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    Select Templates ({selectedTemplateIds.length} selected)
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileJson className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No templates found</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left w-12">
                              <input
                                type="checkbox"
                                checked={
                                  templates.length > 0 &&
                                  selectedTemplateIds.length === templates.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleSelectAll();
                                  } else {
                                    handleDeselectAll();
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Language
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {templates.map((template) => (
                            <tr
                              key={template.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleToggleTemplate(template.id)}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedTemplateIds.includes(template.id)}
                                  onChange={() => handleToggleTemplate(template.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {template.name}
                                  </p>
                                  {template.displayName && (
                                    <p className="text-xs text-gray-500">{template.displayName}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{template.category}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{template.language}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    template.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : template.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : template.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {template.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900">Export Information</h4>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Exported templates can be imported into any environment</li>
                    <li>Templates will be exported in JSON format</li>
                    <li>Metadata like IDs and timestamps are for reference only</li>
                    <li>Imported templates will start in DRAFT status</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            disabled={exportMutation.isPending}
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={selectedCount === 0 || exportMutation.isPending}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  Export {selectedCount} Template{selectedCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateExportModal;
