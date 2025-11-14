import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import toast from '@/lib/toast';
import { analyticsService } from '@/services';
import { DateRange } from './DateRangeSelector';

interface ExportButtonProps {
  type: 'conversations' | 'campaigns' | 'agents' | 'flows';
  dateRange?: DateRange;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  type,
  dateRange,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      setShowMenu(false);

      const blob = await analyticsService.exportAnalytics(type, dateRange, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-20"
          >
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary-500" />
              <span>Export as CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
            >
              <FileText className="w-4 h-4 text-danger-500" />
              <span>Export as PDF</span>
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
};
