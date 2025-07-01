import React, { useEffect, useState, useMemo, Component } from 'react';
import { getTrades } from '../../services/api';
import Card from '../ui/Card';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
                      { key: 'note', label: 'Note' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort(key)}
                      >
                        {label}
                        {renderSortIcon(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTrades.map((trade) => (
                    <tr
                      key={trade._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.note}</td>
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
      </Card>
    </ErrorBoundary>
  );
};

export default TradesTable;