import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { templatesService } from '@/services/templates.service';
import { Template } from '@/types/models.types';
import { formatDistanceToNow } from 'date-fns';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  GitBranch,
  Eye,
  GitCompare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { TemplateVersionComparison } from './TemplateVersionComparison';

interface TemplateVersionHistoryProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewVersion?: (version: Template) => void;
}

export const TemplateVersionHistory: React.FC<TemplateVersionHistoryProps> = ({
  templateId,
  open,
  onOpenChange,
  onViewVersion,
}) => {
  const [selectedVersions, setSelectedVersions] = useState<[Template | null, Template | null]>([
    null,
    null,
  ]);
  const [showComparison, setShowComparison] = useState(false);

  const {
    data: versions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['template-versions', templateId],
    queryFn: () => templatesService.getTemplateVersions(templateId),
    enabled: open,
  });

  const getStatusIcon = (status: Template['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'superseded':
        return <GitBranch className="h-4 w-4 text-gray-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: Template['status']): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'superseded':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const handleVersionSelect = (version: Template) => {
    if (!selectedVersions[0]) {
      setSelectedVersions([version, null]);
    } else if (!selectedVersions[1]) {
      setSelectedVersions([selectedVersions[0], version]);
    } else {
      // Replace the second selection
      setSelectedVersions([selectedVersions[0], version]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions[0] && selectedVersions[1]) {
      setShowComparison(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedVersions([null, null]);
  };

  if (showComparison && selectedVersions[0] && selectedVersions[1]) {
    return (
      <TemplateVersionComparison
        version1={selectedVersions[0]}
        version2={selectedVersions[1]}
        open={showComparison}
        onOpenChange={(open: boolean) => {
          setShowComparison(open);
          if (!open) {
            handleClearSelection();
          }
        }}
      />
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Template Version History"
      description="View all versions of this template and compare changes between versions."
      size="xl"
    >
      <div className="space-y-4">

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load version history. Please try again.</p>
          </div>
        )}

        {versions && versions.length > 0 && (
          <>
            {/* Comparison Controls */}
            {(selectedVersions[0] || selectedVersions[1]) && (
              <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <GitCompare className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {selectedVersions[0] && selectedVersions[1]
                      ? `Comparing v${selectedVersions[0].version} and v${selectedVersions[1].version}`
                      : `Selected v${selectedVersions[0]?.version || selectedVersions[1]?.version} - Select another version to compare`}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selectedVersions[0] && selectedVersions[1] && (
                    <Button size="sm" onClick={handleCompare}>
                      Compare Versions
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleClearSelection}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-[500px] overflow-y-auto pr-4">
              <div className="space-y-4">
                {versions.map((version, index) => {
                  const isSelected =
                    selectedVersions[0]?.id === version.id ||
                    selectedVersions[1]?.id === version.id;
                  const isLatest = index === 0;

                  return (
                    <div
                      key={version.id}
                      className={`rounded-lg border p-4 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(version.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">
                                  Version {version.version}
                                </h4>
                                {isLatest && (
                                  <Badge variant="secondary" className="text-xs">
                                    Latest
                                  </Badge>
                                )}
                                <Badge variant={getStatusBadgeVariant(version.status)}>
                                  {version.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{version.name}</p>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Created:</span>{' '}
                              <span className="font-medium text-gray-900">
                                {formatDistanceToNow(new Date(version.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            {version.approvedAt && (
                              <div>
                                <span className="text-gray-500">Approved:</span>{' '}
                                <span className="font-medium text-gray-900">
                                  {formatDistanceToNow(new Date(version.approvedAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            )}
                            {version.rejectedAt && (
                              <div>
                                <span className="text-gray-500">Rejected:</span>{' '}
                                <span className="font-medium text-gray-900">
                                  {formatDistanceToNow(new Date(version.rejectedAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Category:</span>{' '}
                              <span className="font-medium text-gray-900">
                                {version.category}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Language:</span>{' '}
                              <span className="font-medium text-gray-900">
                                {version.language}
                              </span>
                            </div>
                            {version.qualityScore !== undefined && (
                              <div>
                                <span className="text-gray-500">Quality Score:</span>{' '}
                                <span className="font-medium text-gray-900">
                                  {version.qualityScore}/100
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Usage Count:</span>{' '}
                              <span className="font-medium text-gray-900">
                                {version.usageCount}
                              </span>
                            </div>
                          </div>

                          {version.rejectionReason && (
                            <div className="mt-3 rounded-md bg-red-50 p-3">
                              <p className="text-sm font-medium text-red-900">
                                Rejection Reason:
                              </p>
                              <p className="mt-1 text-sm text-red-700">
                                {version.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewVersion?.(version)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant={isSelected ? 'primary' : 'outline'}
                            onClick={() => handleVersionSelect(version)}
                          >
                            <GitCompare className="mr-2 h-4 w-4" />
                            {isSelected ? 'Selected' : 'Select'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="flex justify-between text-sm text-gray-600">
              <span>Total versions: {versions.length}</span>
              <span>
                Active versions:{' '}
                {versions.filter((v) => v.status === 'approved' || v.status === 'pending').length}
              </span>
            </div>
          </>
        )}

        {versions && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitBranch className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No versions found</h3>
            <p className="mt-2 text-sm text-gray-600">
              This template doesn't have any version history yet.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
