import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export interface DateRange {
  start: string;
  end: string;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESET_RANGES = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'This Month', days: 'month' as const },
  { label: 'Last Month', days: 'lastMonth' as const },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);

  const handlePresetClick = (preset: typeof PRESET_RANGES[0]) => {
    const end = new Date();
    let start = new Date();

    if (typeof preset.days === 'number') {
      start.setDate(end.getDate() - preset.days);
    } else if (preset.days === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset.days === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
    }

    const range = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };

    setTempRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    const start = new Date(value.start);
    const end = new Date(value.end);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        <span>{formatDateRange()}</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Date Range"
      >
        <div className="space-y-6">
          {/* Preset Ranges */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_RANGES.map((preset) => (
                <motion.button
                  key={preset.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePresetClick(preset)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  {preset.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Custom Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempRange.start}
                  onChange={(e) =>
                    setTempRange({ ...tempRange, start: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempRange.end}
                  onChange={(e) =>
                    setTempRange({ ...tempRange, end: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
