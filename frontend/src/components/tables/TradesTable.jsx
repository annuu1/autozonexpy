import React, { useEffect, useState, Component } from 'react';
import { getTrades, updateTrade, deleteTrade, toggleTradeVerified } from '../../services/api';
import Card from '../ui/Card';
import { ChevronUp, ChevronDown, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-500">
          Something went wrong: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

const TradesTable = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [editTrade, setEditTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const response = await getTrades(currentPage, itemsPerPage, sortConfig.key, sortConfig.direction);
        setTrades(response.trades || []);
        setTotalPages(response.total_pages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [currentPage, sortConfig]);

  const sortedTrades = trades;

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (trade) => {
    setEditTrade({ ...trade });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedTrade = await updateTrade(editTrade._id, editTrade);
      setTrades(trades.map((t) => (t._id === updatedTrade._id ? updatedTrade : t)));
      setIsModalOpen(false);
      setEditTrade(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (tradeId) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteTrade(tradeId);
        setTrades(trades.filter((t) => t._id !== tradeId));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleToggleVerified = async (tradeId, currentVerified) => {
    try {
      const updatedTrade = await toggleTradeVerified(tradeId, !currentVerified);
      setTrades(trades.map((t) => (t._id === tradeId ? updatedTrade : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditTrade(null);
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <ErrorBoundary>
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 animate-pulse">Loading trades...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : trades.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No trades available</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0">
                  <tr>
                    {[
                      { key: 'symbol', label: 'Symbol' },
                      { key: 'entry_price', label: 'Entry Price' },
                      { key: 'stop_loss', label: 'Stop Loss' },
                      { key: 'target_price', label: 'Target Price' },
                      { key: 'trade_type', label: 'Trade Type' },
                      { key: 'status', label: 'Status' },
                      { key: 'created_at', label: 'Created At' },
                      { key: 'alert_sent', label: 'Alert Sent' },
                      { key: 'entry_alert_sent', label: 'Entry Alert Sent' },
                      { key: 'verified', label: 'Verified' },
                      { key: 'note', label: 'Note' },
                      { key: 'actions', label: 'Actions' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={key !== 'actions' ? () => handleSort(key) : undefined}
                      >
                        {label}
                        {key !== 'actions' && renderSortIcon(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTrades.map((trade) => (
                    <tr key={trade._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.symbol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.entry_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.stop_loss}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.target_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.trade_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trade.status === 'OPEN'
                              ? 'bg-green-100 text-green-800'
                              : trade.status === 'CLOSED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(trade.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trade.alert_sent ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {trade.alert_sent ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trade.entry_alert_sent ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {trade.entry_alert_sent ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trade.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {trade.verified ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.note}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(trade)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit Trade"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(trade._id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleVerified(trade._id, trade.verified)}
                            className={`p-1 ${
                              trade.verified ? 'text-gray-600 hover:text-gray-800' : 'text-green-600 hover:text-green-800'
                            }`}
                            title={trade.verified ? 'Mark as Unverified' : 'Mark as Verified'}
                          >
                            {trade.verified ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center mt-4 px-6 py-3 bg-gray-50/80">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, trades.length)} of {trades.length} trades
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        } transition-colors`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Edit Trade</h3>
              <form onSubmit={handleUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Symbol</label>
                  <input
                    type="text"
                    value={editTrade?.symbol || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, symbol: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTrade?.entry_price || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, entry_price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTrade?.stop_loss || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, stop_loss: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Target Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTrade?.target_price || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, target_price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Trade Type</label>
                  <select
                    value={editTrade?.trade_type || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, trade_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    required
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editTrade?.status || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                    required
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <textarea
                    value={editTrade?.note || ''}
                    onChange={(e) => setEditTrade({ ...editTrade, note: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>
    </ErrorBoundary>
  );
};

export default TradesTable;