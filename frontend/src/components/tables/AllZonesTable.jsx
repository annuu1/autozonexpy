import React, { useEffect, useState, Component, useCallback } from 'react';
import { getAllZones } from '../../services/zones';
import { getRealtimeData } from '../../services/api';
import Card from '../ui/Card';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debounce } from 'lodash';

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

const AllZonesTable = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'trade_score', direction: 'desc' });
  const [searchParams, setSearchParams] = useState({ ticker: '', pattern: '' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [realtimeData, setRealtimeData] = useState({});
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [percentDiff, setPercentDiff] = useState('');
  const [priceType, setPriceType] = useState('ltp'); // 'ltp' or 'day_low'

  // Debounced search update for ticker and pattern
  const debouncedSearch = useCallback(
    debounce((params) => {
      setSearchParams(params);
      setCurrentPage(1);
    }, 300),
    []
  );

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllZones(
        currentPage,
        itemsPerPage,
        sortConfig.key,
        sortConfig.direction,
        searchParams.ticker,
        searchParams.pattern
      );
      setZones(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalCount(response.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortConfig, searchParams]);

  // Fetch realtime data for zones
  const fetchRealtimeData = useCallback(async () => {
    try {
      setRealtimeLoading(true);
      const tickers = [...new Set(zones.map((zone) => zone.ticker))];
      if (tickers.length > 0) {
        const realtime = await getRealtimeData(tickers);
        const realtimeMap = {};
        realtime.forEach((data) => {
          realtimeMap[data.symbol] = { ltp: data.ltp, day_low: data.day_low };
        });
        setRealtimeData(realtimeMap);
      }
    } catch (err) {
      toast.error('Failed to fetch real-time data');
      console.error('Realtime data error:', err);
    } finally {
      setRealtimeLoading(false);
    }
  }, [zones]);

  // Calculate percent difference between price (LTP or Day's Low) and proximal line
  const calculatePercentDiff = (zone) => {
    const price = realtimeData[zone.ticker]?.[priceType];
    if (!price || !zone.proximal_line) return null;
    return ((price - zone.proximal_line) / zone.proximal_line * 100).toFixed(2);
  };

  // Filter zones by percent difference
  const filteredZones = zones.filter((zone) => {
    if (!percentDiff) return true;
    const diff = calculatePercentDiff(zone);
    if (diff === null) return false;
    return Math.abs(diff) <= parseFloat(percentDiff);
  });

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    if (zones.length > 0) {
      fetchRealtimeData();
    }
  }, [zones, fetchRealtimeData]);

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

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    debouncedSearch((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const renderRowsPerPageSelector = () => (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Rows per page:</span>
      <select
        value={itemsPerPage}
        onChange={handleItemsPerPageChange}
        className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={200}>200</option>
        <option value={500}>500</option>
      </select>
    </div>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          «
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          ‹
        </button>
        <span className="px-3 py-1">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          ›
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          »
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading zones: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col text-xs w-[200px]">
                <label className="text-gray-600 font-medium mb-1">Search Ticker</label>
                <input
                  type="text"
                  name="ticker"
                  value={searchParams.ticker}
                  onChange={handleSearchChange}
                  placeholder="Enter ticker..."
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex flex-col text-xs w-[150px]">
                <label className="text-gray-600 font-medium mb-1">Pattern</label>
                <select
                  name="pattern"
                  value={searchParams.pattern}
                  onChange={handleSearchChange}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                >
                  <option value="">All</option>
                  <option value="DBR">DBR</option>
                  <option value="RBR">RBR</option>
                </select>
              </div>
              <div className="flex flex-col text-xs w-[200px]">
                <label className="text-gray-600 font-medium mb-1">Max % Difference</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={percentDiff}
                    onChange={(e) => setPercentDiff(e.target.value)}
                    placeholder="Filter by %"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  />
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                  >
                    <option value="ltp">LTP</option>
                    <option value="day_low">Day's Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredZones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No zones available</div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('ticker')}
                      >
                        Ticker {renderSortIcon('ticker')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('zone_id')}
                      >
                        Zone ID {renderSortIcon('zone_id')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeframes
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('proximal_line')}
                      >
                        Proximal {renderSortIcon('proximal_line')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('distal_line')}
                      >
                        Distal {renderSortIcon('distal_line')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('trade_score')}
                      >
                        Score {renderSortIcon('trade_score')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('pattern')}
                      >
                        Pattern {renderSortIcon('pattern')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('timestamp')}
                      >
                        Created {renderSortIcon('timestamp')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredZones.map((zone) => (
                      <tr key={zone._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {zone.ticker}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {zone.zone_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Array.isArray(zone.timeframes) ? zone.timeframes.join(', ') : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.proximal_line?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {zone.distal_line?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            zone.trade_score > 5 ? 'bg-green-100 text-green-800' : 
                            zone.trade_score > 3 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {zone.trade_score}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            zone.pattern === 'DBR' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {zone.pattern}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(zone.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {realtimeLoading ? (
                            <span className="text-gray-400 text-xs">Loading...</span>
                          ) : calculatePercentDiff(zone) !== null ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(calculatePercentDiff(zone)) > 0 ? 'text-green-800 bg-green-100' : 
                              parseFloat(calculatePercentDiff(zone)) < 0 ? 'text-red-800 bg-red-100' :
                              'text-gray-800 bg-gray-100'
                            }`}>
                              {parseFloat(calculatePercentDiff(zone)) > 0 ? '+' : ''}{calculatePercentDiff(zone)}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  {renderRowsPerPageSelector()}
                  {renderPagination()}
                </div>
              </>
            )}
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      </Card>
    </ErrorBoundary>
  );
};

export default AllZonesTable;