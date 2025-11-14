import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { whatsappService, WhatsAppConnection } from '../../services/whatsapp.service';
import toast from '../../lib/toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: WhatsAppConnection;
  onSuccess: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  connection,
  onSuccess,
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(connection.status);

  useEffect(() => {
    if (isOpen) {
      loadQRCode();
      // Poll for connection status
      const interval = setInterval(checkConnectionStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadQRCode = async () => {
    setIsLoading(true);
    try {
      const code = await whatsappService.getQRCode(connection.id);
      setQrCode(code);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const updatedConnection = await whatsappService.getConnection(connection.id);
      setConnectionStatus(updatedConnection.status);
      
      if (updatedConnection.status === 'connected') {
        toast.success('WhatsApp connected successfully!');
        onSuccess();
        onClose();
      }
    } catch (error) {
      // Silently fail status check
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await whatsappService.reconnectConnection(connection.id);
      await loadQRCode();
      toast.success('QR code refreshed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to refresh QR code');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code">
      <div className="space-y-6">
        {/* Status Banner */}
        {connectionStatus === 'connecting' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center gap-3"
          >
            <Spinner size="sm" className="text-warning-600" />
            <div>
              <p className="font-medium text-warning-900">Waiting for scan...</p>
              <p className="text-sm text-warning-700">
                Open WhatsApp on your phone and scan the QR code
              </p>
            </div>
          </motion.div>
        )}

        {connectionStatus === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-success-600" />
            <div>
              <p className="font-medium text-success-900">Connected!</p>
              <p className="text-sm text-success-700">
                Your WhatsApp is now connected
              </p>
            </div>
          </motion.div>
        )}

        {connectionStatus === 'failed' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-danger-600" />
            <div>
              <p className="font-medium text-danger-900">Connection Failed</p>
              <p className="text-sm text-danger-700">
                Please try refreshing the QR code
              </p>
            </div>
          </motion.div>
        )}

        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center py-8">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p className="text-sm text-neutral-600">Loading QR code...</p>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-neutral-200">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
              
              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="absolute -bottom-4 -right-4 bg-primary-500 text-white p-3 rounded-full shadow-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-neutral-900 mb-3">How to connect:</h4>
          <ol className="space-y-2 text-sm text-neutral-700">
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600">1.</span>
              <span>Open WhatsApp on your phone</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600">2.</span>
              <span>
                Tap <strong>Menu</strong> or <strong>Settings</strong> and select{' '}
                <strong>Linked Devices</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600">3.</span>
              <span>
                Tap <strong>Link a Device</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600">4.</span>
              <span>Point your phone at this screen to scan the QR code</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
