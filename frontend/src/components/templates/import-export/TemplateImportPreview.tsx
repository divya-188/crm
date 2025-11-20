import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileJson } from 'lucide-react';

interface ImportPreviewTemplate {
  name: string;
  displayName?: string;
  category: string;
  language: string;
  status: 'valid' | 'invalid' | 'duplicate';
  errors?: string[];
  warnings?: string[];
}

interface TemplateImportPreviewProps {
  preview: {
    totalTemplates: number;
    validTemplates: number;
    invalidTemplates: number;
    duplicates: number;
    templates: ImportPreviewTemplate[];
  };
  onBack: () => void;
}

const TemplateImportPreview: React.FC<TemplateImportPreviewProps> = ({ preview, onBack }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'duplicate':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Valid
          </span>
        );
      case 'invalid':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Invalid
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Duplicate
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{preview.totalTemplates}</p>
            </div>
            <FileJson className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wide">Valid</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{preview.validTemplates}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 uppercase tracking-wide">Invalid</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{preview.invalidTemplates}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-600 uppercase tracking-wide">Duplicates</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{preview.duplicates}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Template Details</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.templates.map((template, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(template.status)}
                        {getStatusBadge(template.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
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
                    <td className="px-4 py-3">
                      {template.errors && template.errors.length > 0 && (
                        <div className="space-y-1">
                          {template.errors.map((error, errorIndex) => (
                            <p key={errorIndex} className="text-xs text-red-600">
                              • {error}
                            </p>
                          ))}
                        </div>
                      )}
                      {template.warnings && template.warnings.length > 0 && (
                        <div className="space-y-1">
                          {template.warnings.map((warning, warningIndex) => (
                            <p key={warningIndex} className="text-xs text-yellow-600">
                              • {warning}
                            </p>
                          ))}
                        </div>
                      )}
                      {(!template.errors || template.errors.length === 0) &&
                        (!template.warnings || template.warnings.length === 0) &&
                        template.status === 'valid' && (
                          <span className="text-xs text-gray-400">No issues</span>
                        )}
                      {template.status === 'duplicate' && (
                        <span className="text-xs text-yellow-600">
                          Template with this name already exists
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Message */}
      {preview.validTemplates === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Cannot Import</h4>
              <p className="text-sm text-red-700 mt-1">
                No valid templates found. Please fix the errors and try again.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900">Ready to Import</h4>
              <p className="text-sm text-green-700 mt-1">
                {preview.validTemplates} template{preview.validTemplates !== 1 ? 's' : ''} will be
                imported.
                {preview.invalidTemplates > 0 &&
                  ` ${preview.invalidTemplates} invalid template${
                    preview.invalidTemplates !== 1 ? 's' : ''
                  } will be skipped.`}
                {preview.duplicates > 0 &&
                  ` ${preview.duplicates} duplicate${
                    preview.duplicates !== 1 ? 's' : ''
                  } will be skipped.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateImportPreview;
