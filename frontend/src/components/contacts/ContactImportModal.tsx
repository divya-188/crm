import { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useImportContacts } from '@/hooks/useContacts';
import { motion } from 'framer-motion';

interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactImportModal = ({ isOpen, onClose }: ContactImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportContacts();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      await importMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const csvContent = 'phone,firstName,lastName,email,tags,notes\n+1234567890,John,Doe,john@example.com,"vip;customer",Important client';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Contacts" size="lg">
      <div className="space-y-6">
        {/* Instructions */}
        <Alert
          variant="info"
          title="Import Instructions"
          message="Upload a CSV file with contact information. Required column: phone. Optional columns: firstName, lastName, email, tags (semicolon-separated), notes. Download the template below for the correct format."
        />

        {/* Download Template */}
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CSV Template
        </Button>

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Choose Different File
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Select File
              </Button>
            </div>
          )}
        </div>

        {/* Import Result */}
        {importMutation.isSuccess && importMutation.data && (
          <Alert
            variant="success"
            title="Import Successful"
            message={`Imported ${importMutation.data.imported} contacts.${
              importMutation.data.failed > 0
                ? ` ${importMutation.data.failed} contacts failed to import.`
                : ''
            }`}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || importMutation.isPending}
          >
            {importMutation.isPending ? 'Importing...' : 'Import Contacts'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
