import React, { useEffect, useState, Component, useCallback } from 'react';
import { getAllZones, deleteZone } from '../../services/zones';
import { getRealtimeData } from '../../services/api';
import Card from '../ui/Card';
import { ChevronUp, ChevronDown, Trash2, RefreshCcw } from 'lucide-react';
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
  const [searchParams, setSearchParams] = useState({ ticker: '', pattern: '', timeframe: '' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [realtimeData, setRealtimeData] = useState({});
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [percentDiff, setPercentDiff] = useState('');
  const [priceType, setPriceType] = useState('ltp');
  const [zoneToDelete, setZoneToDelete] = useState(null);

  // Debounced search update for ticker and pattern
  const debouncedSearch = useCallback(debounce((params) => {
    setSearchParams(prev => ({ ...prev, ...params }));
    setCurrentPage(1);
  }, 300), []);

  // Fetch zones
  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllZones(
        currentPage, itemsPerPage, sortConfig.key, sortConfig.direction, searchParams.ticker, searchParams.pattern, searchParams.timeframe
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

  // ✅ Fetch realtime data (manual trigger only)
  const fetchRealtimeData = useCallback(async () => {
    if (!zones || zones.length === 0) {
      toast.info("No zones available for realtime fetch.");
      return;
    }

    try {
      setRealtimeLoading(true);
      const tickers = zones.map(zone => zone?.ticker).filter(Boolean).map(String);
      if (tickers.length === 0) return;
      const data = await getRealtimeData(tickers);

      const dataMap = (data || []).reduce((acc, item) => {
        if (item?.symbol) {
          acc[item.symbol] = {
            ltp: item.ltp != null ? Number(item.ltp) : null,
            day_low: item.day_low != null ? Number(item.day_low) : null
          };
        }
        return acc;
      }, {});

      setRealtimeData(dataMap);
      toast.success("Realtime data refreshed.");
    } catch (err) {
      console.error("Error fetching realtime data:", err);
      toast.error("Failed to fetch realtime data");
    } finally {
      setRealtimeLoading(false);
    }
  }, [zones]);

    // ✅ Debounced zones fetch
    useEffect(() => {
      const handler = setTimeout(() => {
        fetchZones();
      }, 400);
      return () => clearTimeout(handler);
    }, [searchParams, currentPage, itemsPerPage, sortConfig, fetchZones]);

  // Calculate percent difference between price (LTP or Day's Low) and proximal line
  const calculatePercentDiff = (zone) => {
    if (!zone?.ticker || !zone?.proximal_line) return null;
    try {
      const price = priceType === 'ltp'
        ? (realtimeData[zone.ticker]?.ltp ?? null)
        : (realtimeData[zone.ticker]?.day_low ?? null);
      if (price === null || price === undefined || isNaN(price)) return null;
      const proximalLine = Number(zone.proximal_line);
      if (isNaN(proximalLine) || proximalLine === 0) return null;
      const percentDiff = ((price - proximalLine) / proximalLine) * 100;
      return isFinite(percentDiff) ? Number(percentDiff.toFixed(2)) : null;
    } catch (error) {
      console.error('Error calculating percent difference:', error);
      return null;
    }
  };


  // Filter zones by percent difference
  const filteredZones = zones.filter(zone => {
    if (!percentDiff) return true;
    const diff = calculatePercentDiff(zone);
    if (diff === null) return false;
    return Math.abs(diff) <= parseFloat(percentDiff);
  });

  useEffect(() => {
    if (zones.length > 0) {
      // fetchRealtimeData();
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
    setSearchParams((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleDeleteClick = (zone) => {
    setZoneToDelete(zone);
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;
    
    try {
      await deleteZone(zoneToDelete.zone_id);
      toast.success('Zone deleted successfully');
      // Refresh the zones list
      await fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete zone');
    } finally {
      setZoneToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setZoneToDelete(null);
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  // ✅ add RefreshCcw button into controls
  const renderControls = () => (
    <div className="flex gap-3">
      <button
        onClick={fetchRealtimeData}
        disabled={realtimeLoading}
        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
        title="Refresh Realtime Data"
      >
        <RefreshCcw className={`w-4 h-4 ${realtimeLoading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
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

  const timeframeOptions = [
    { value: '', label: 'All Timeframes' },
    { value: '1d', label: '1 Day' },
    { value: '4h', label: '4 Hours' },
    { value: '1h', label: '1 Hour' },
    { value: '15m', label: '15 Minutes' },
    { value: '5m', label: '5 Minutes' },
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    debouncedSearch({ [name]: value });
  };

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
            <div className="flex flex-wrap gap-4 mb-4">
  <div className="flex flex-col text-xs w-[200px]">
    <label className="text-gray-600 font-medium mb-1">Ticker</label>
    <input
      type="text"
      name="ticker"
      placeholder="Filter by ticker..."
      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
      onChange={handleFilterChange}
      value={searchParams.ticker}
    />
  </div>
  <div className="flex flex-col text-xs w-[200px]">
    <label className="text-gray-600 font-medium mb-1">Pattern</label>
    <select
      name="pattern"
      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
      onChange={handleFilterChange}
      value={searchParams.pattern}
    >
      <option value="">All Patterns</option>
      <option value="DBR">DBR</option>
      <option value="RBR">RBR</option>
    </select>
  </div>
  <div className="flex flex-col text-xs w-[200px]">
    <label className="text-gray-600 font-medium mb-1">Timeframe</label>
    <select
      name="timeframe"
      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
      onChange={handleFilterChange}
      value={searchParams.timeframe}
    >
      <option value="">Select Timeframe</option>
      <option value="3mo">3 Months</option>
      <option value="1mo">1 Month</option>
      <option value="1wk">1 Week</option>
      <option value="1d">1 Day</option>
      <option value="1h">1 Hour</option>
      <option value="15m">15 Minutes</option>
      <option value="5m">5 Minutes</option>
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
      <div className="flex flex-wrap gap-4">{renderControls()}</div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteClick(zone)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        
        {/* Delete Confirmation Modal */}
        {zoneToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the zone for {zoneToDelete.ticker}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </ErrorBoundary>
  );
};

export default AllZonesTable;