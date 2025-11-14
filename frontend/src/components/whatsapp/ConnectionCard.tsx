import React from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  QrCode,
  RefreshCw,
  Trash2,
  Power,
  Edit,
} from 'lucide-react';
import { WhatsAppConnection } from '../../services/whatsapp.service';
import Badge from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionCardProps {
  connection: WhatsAppConnection;
  onShowQR: (connection: WhatsAppConnection) => void;
  onReconnect: (connection: WhatsAppConnection) => void;
  onDisconnect: (connection: WhatsAppConnection) => void;
  onEdit?: (connection: WhatsAppConnection) => void;
  onDelete: (connection: WhatsAppConnection) => void;
  viewMode?: 'grid' | 'list';
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onShowQR,
  onReconnect,
  onDisconnect,
  onEdit,
  onDelete,
  viewMode = 'grid',
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'success',
          label: 'Connected',
        };
      case 'disconnected':
        return {
          icon: XCircle,
          color: 'neutral',
          label: 'Disconnected',
        };
      case 'connecting':
        return {
          icon: Clock,
          color: 'warning',
          label: 'Connecting',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'danger',
          label: 'Failed',
        };
      default:
        return {
          icon: XCircle,
          color: 'neutral',
          label: 'Unknown',
        };
    }
  };

  const statusConfig = getStatusConfig(connection.status);
  const StatusIcon = statusConfig.icon;

  const cardClassName = viewMode === 'list'
    ? 'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm hover:shadow-md transition-all relative flex items-center gap-6'
    : 'bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm hover:shadow-md transition-all relative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: viewMode === 'grid' ? -4 : 0 }}
      className={cardClassName}
    >
      {/* Header */}
      <div className={viewMode === 'list' ? 'flex items-center gap-3 flex-1' : 'flex items-start justify-between mb-4'}>
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              connection.type === 'meta_api'
                ? 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-600'
                : 'bg-primary-100 dark:bg-primary-900/20 text-primary-600'
            }`}
          >
            {connection.type === 'meta_api' ? (
              <Cloud className="w-6 h-6" />
            ) : (
              <Smartphone className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">{connection.name}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {connection.type === 'meta_api' ? 'Meta Business API' : 'QR Code Connection'}
            </p>
          </div>
        </div>
        
        {viewMode === 'list' && (
          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <Badge variant={statusConfig.color as any} className="flex items-center gap-1">
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
            
            {/* Phone Number */}
            {connection.phoneNumber && (
              <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden md:block">
                {connection.phoneNumber}
              </span>
            )}
            
            {/* Last Connected */}
            {connection.lastConnectedAt && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400 hidden lg:block">
                {formatDistanceToNow(new Date(connection.lastConnectedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        )}

        {/* Actions Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-neutral-600" />
          </motion.button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-20"
              >
                {connection.type === 'baileys' && connection.status !== 'connected' && (
                  <button
                    onClick={() => {
                      onShowQR(connection);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-neutral-900 dark:text-white"
                  >
                    <QrCode className="w-4 h-4" />
                    Show QR Code
                  </button>
                )}
                
                {connection.status === 'disconnected' && (
                  <button
                    onClick={() => {
                      onReconnect(connection);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-neutral-900 dark:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reconnect
                  </button>
                )}
                
                {connection.status === 'connected' && (
                  <button
                    onClick={() => {
                      onDisconnect(connection);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-neutral-900 dark:text-white"
                  >
                    <Power className="w-4 h-4" />
                    Disconnect
                  </button>
                )}
                
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(connection);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 text-neutral-900 dark:text-white"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onDelete(connection);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-danger-50 dark:hover:bg-danger-900/20 text-danger-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Status Badge - Grid View Only */}
      {viewMode === 'grid' && (
        <div className="mb-4">
          <Badge variant={statusConfig.color as any} className="flex items-center gap-1 w-fit">
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>
        </div>
      )}

      {/* Details - Grid View Only */}
      {viewMode === 'grid' && (
        <div className="space-y-2 text-sm">
          {connection.phoneNumber && (
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Phone Number:</span>
              <span className="font-medium text-neutral-900 dark:text-white">{connection.phoneNumber}</span>
            </div>
          )}
          
          {connection.lastConnectedAt && (
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Last Connected:</span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {formatDistanceToNow(new Date(connection.lastConnectedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}

          {connection.type === 'meta_api' && connection.phoneNumberId && (
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">Phone Number ID:</span>
              <span className="font-mono text-xs text-neutral-900 dark:text-white">
                {connection.phoneNumberId.slice(0, 12)}...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions - Grid View Only */}
      {viewMode === 'grid' && connection.status === 'connecting' && connection.type === 'baileys' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onShowQR(connection)}
          className="mt-4 w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          View QR Code
        </motion.button>
      )}
    </motion.div>
  );
};
