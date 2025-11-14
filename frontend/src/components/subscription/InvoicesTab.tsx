import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface InvoicesTabProps {
  invoices: any[];
  loading: boolean;
  onDownload: (invoiceId: string) => void;
}

export default function InvoicesTab({ invoices, loading, onDownload }: InvoicesTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-12 text-center"
      >
        <div className="text-gray-400 mb-4">
          <FileText className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Invoices Yet</h3>
        <p className="text-gray-600">Your invoices and transactions will appear here</p>
      </motion.div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'unpaid':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      processing: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <h3 className="text-xl font-bold text-gray-900">Invoices & Transactions</h3>
        <p className="text-sm text-gray-600">View and download your payment history</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice, index) => (
              <motion.tr
                key={invoice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(invoice.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.items?.[0]?.description || invoice.metadata?.planName || 'Subscription Payment'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {invoice.subscription?.plan?.billingCycle || invoice.metadata?.billingCycle || 'Monthly'} billing
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${parseFloat(invoice.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{invoice.currency}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(invoice.status)}
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDownload(invoice.id)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total Invoices: <span className="font-semibold text-gray-900">{invoices.length}</span>
          </div>
          <div className="text-sm text-gray-600">
            Total Paid:{' '}
            <span className="font-semibold text-green-600">
              $
              {invoices
                .filter((inv) => inv.status === 'paid')
                .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
