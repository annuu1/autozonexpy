import React, { useEffect, useState, Component } from 'react';
import { getTrades, updateTrade, deleteTrade, toggleTradeVerified, addTrade, getRealtimeData } from '../../services/api';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { ChevronUp, ChevronDown, Edit, Trash2, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
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

const TradesTable = () => {
  const [trades, setTrades] = useState([]);
  const [realtimeData, setRealtimeData] = useState({});
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [editTrade, setEditTrade] = useState(null);
  const [newTrade, setNewTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'add'
  const [searchParams, setSearchParams] = useState({ symbol: '', status: '' });
  const [percentDiff, setPercentDiff] = useState('');
  const [targetRatio, setTargetRatio] = useState('1:2');
  const [formErrors, setFormErrors] = useState({});
  const itemsPerPage = 10;

  // Debounced search update for symbol and status
  const debouncedSearch = debounce((params) => {
    setSearchParams(params);
    setCurrentPage(1);
  }, 300);

  // Fetch trades
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const response = await getTrades(
          currentPage,
          itemsPerPage,
          sortConfig.key,
          sortConfig.direction,
          searchParams.symbol,
          searchParams.status
        );
        setTrades(response.trades || []);
        setTotalPages(response.total_pages || 1);
        setTotalCount(response.total_count || 0);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [currentPage, sortConfig, searchParams]);

  // Fetch real-time data
  useEffect(() => {
    const fetchRealtimeData = async () => {
      try {
        setRealtimeLoading(true);
        const tickers = [...new Set(trades.map((trade) => trade.symbol))];
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
    };
    if (trades.length > 0) {
      fetchRealtimeData();
    }
  }, [trades]);

  // Calculate percent difference between LTP and entry_price
  const calculatePercentDiff = (trade) => {
    const ltp = realtimeData[trade.symbol]?.ltp;
    if (!ltp || !trade.entry_price) return 'N/A';
    return ((ltp - trade.entry_price) / trade.entry_price * 100).toFixed(2);
  };

  // Filter trades by percent difference
  const filteredTrades = trades.filter((trade) => {
    if (!percentDiff) return true;
    const percentDiffValue = calculatePercentDiff(trade);
    if (percentDiffValue === 'N/A') return false;
    return Math.abs(percentDiffValue) <= parseFloat(percentDiff);
  });

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

  const calculateTargetPrice = (entry_price, stop_loss, trade_type, ratio) => {
    if (!entry_price || !stop_loss) return '';
    const diff = Math.abs(entry_price - stop_loss);
    const multiplier = ratio === '1:2' ? 2 : 3;
    return trade_type === 'BUY'
      ? Math.round(entry_price + diff * multiplier)
      : Math.round(entry_price - diff * multiplier);
  };

  const validateTrade = (trade) => {
    const errors = {};
    if (!trade.symbol.trim()) {
      errors.symbol = 'Symbol is required';
    }
    if (!trade.entry_price || trade.entry_price <= 0) {
      errors.entry_price = 'Entry price must be positive';
    }
    if (!trade.stop_loss || trade.stop_loss <= 0) {
      errors.stop_loss = 'Stop loss must be positive';
    }
    if (!trade.target_price || trade.target_price <= 0) {
      errors.target_price = 'Target price must be positive';
    }
    if (trade.entry_price && trade.stop_loss && trade.trade_type === 'BUY' && trade.stop_loss >= trade.entry_price) {
      errors.stop_loss = 'Stop Loss must be less than Entry Price for BUY';
    }
    if (trade.entry_price && trade.stop_loss && trade.trade_type === 'SELL' && trade.stop_loss <= trade.entry_price) {
      errors.stop_loss = 'Stop Loss must be greater than Entry Price for SELL';
    }
    if (trade.entry_price && trade.target_price && trade.trade_type === 'BUY' && trade.target_price <= trade.entry_price) {
      errors.target_price = 'Target Price must be greater than Entry Price for BUY';
    }
    if (trade.entry_price && trade.target_price && trade.trade_type === 'SELL' && trade.target_price >= trade.entry_price) {
      errors.target_price = 'Target Price must be less than Entry Price for SELL';
    }
    return errors;
  };

  const handleEdit = (trade) => {
    setEditTrade({ ...trade });
    setTargetRatio('1:2');
    setModalMode('edit');
    setIsModalOpen(true);
    setFormErrors({});
  };

  const handleAddTrade = () => {
    setNewTrade({
      symbol: '',
      entry_price: '',
      stop_loss: '',
      target_price: '',
      trade_type: 'BUY',
      status: 'OPEN',
      note: '',
    });
    setTargetRatio('1:2');
    setModalMode('add');
    setIsModalOpen(true);
    setFormErrors({});
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validateTrade(editTrade);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    }
    try {
      const updatedTrade = await updateTrade(editTrade._id, editTrade);
      setTrades(trades.map((t) => (t._id === updatedTrade._id ? updatedTrade : t)));
      setIsModalOpen(false);
      setEditTrade(null);
      setFormErrors({});
      toast.success('Trade updated successfully');
    } catch (err) {
      setError(err.message);
      const errorDetail = err.message.includes('detail') ? JSON.parse(err.message.split('detail: ')[1]) : err.message;
      if (Array.isArray(errorDetail)) {
        errorDetail.forEach((e) => toast.error(e.msg));
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateTrade(newTrade);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Object.values(errors).forEach((error) => toast.error(error));
      return;
    }
    try {
      const response = await addTrade(
        newTrade.symbol,
        newTrade.entry_price,
        newTrade.stop_loss,
        newTrade.target_price,
        newTrade.trade_type,
        newTrade.note
      );
      setTrades([response, ...trades].slice(0, itemsPerPage));
      setTotalCount((prev) => prev + 1);
      setTotalPages(Math.ceil((totalCount + 1) / itemsPerPage));
      setIsModalOpen(false);
      setNewTrade(null);
      setFormErrors({});
      toast.success('Trade created successfully');
    } catch (err) {
      setError(err.message);
      const errorDetail = err.message.includes('detail') ? JSON.parse(err.message.split('detail: ')[1]) : err.message;
      if (Array.isArray(errorDetail)) {
        errorDetail.forEach((e) => toast.error(e.msg));
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleDelete = async (tradeId) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteTrade(tradeId);
        const updatedTrades = trades.filter((t) => t._id !== tradeId);
        setTrades(updatedTrades);
        setTotalCount((prev) => prev - 1);
        const newTotalPages = Math.ceil((totalCount - 1) / itemsPerPage);
        setTotalPages(newTotalPages);
        if (updatedTrades.length === 0 && currentPage > 1 && currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
        toast.success('Trade deleted successfully');
      } catch (err) {
        setError(err.message);
        const errorDetail = err.message.includes('detail') ? JSON.parse(err.message.split('detail: ')[1]) : err.message;
        if (Array.isArray(errorDetail)) {
          errorDetail.forEach((e) => toast.error(e.msg));
        } else {
          toast.error(err.message);
        }
      }
    }
  };

  const handleToggleVerified = async (tradeId, currentVerified) => {
    try {
      const updatedTrade = await toggleTradeVerified(tradeId, !currentVerified);
      setTrades(trades.map((t) => (t._id === tradeId ? updatedTrade : t)));
      toast.success(`Trade marked as ${!currentVerified ? 'verified' : 'unverified'}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    if (name === 'percent_diff') {
      setPercentDiff(value);
    } else {
      debouncedSearch((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditTrade(null);
    setNewTrade(null);
    setTargetRatio('1:2');
    setFormErrors({});
  };

  const handleFormChange = (field, value, isEditMode) => {
    const trade = isEditMode ? { ...editTrade } : { ...newTrade };
    trade[field] = field === 'entry_price' || field === 'stop_loss' || field === 'target_price'
      ? parseFloat(value) || ''
      : value;

    if ((field === 'entry_price' || field === 'stop_loss' || field === 'trade_type' || field === 'targetRatio') && trade.entry_price && trade.stop_loss) {
      trade.target_price = calculateTargetPrice(trade.entry_price, trade.stop_loss, trade.trade_type, field === 'targetRatio' ? value : targetRatio);
    }

    if (isEditMode) {
      setEditTrade(trade);
    } else {
      setNewTrade(trade);
    }
    if (field === 'targetRatio') {
      setTargetRatio(value);
    }
    setFormErrors(validateTrade(trade));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const renderForm = (trade, isEditMode) => (
    <form
      onSubmit={isEditMode ? handleUpdate : handleCreate}
      className="flex flex-wrap items-end gap-3 border border-gray-300 bg-white/80 rounded-lg p-4 backdrop-blur-sm shadow-sm"
    >
      <div className="flex flex-col text-xs w-[140px]">
        <label className="text-gray-600 font-medium mb-1">Symbol</label>
        <input
          type="text"
          value={trade?.symbol || ''}
          onChange={(e) => handleFormChange('symbol', e.target.value, isEditMode)}
          className={`px-3 py-1.5 border ${formErrors.symbol ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all`}
          placeholder="Enter symbol"
          required
        />
        {formErrors.symbol && <p className="text-red-500 text-xs mt-1">{formErrors.symbol}</p>}
      </div>
      <div className="flex flex-col text-xs w-[100px]">
        <label className="text-gray-600 font-medium mb-1">Entry Price</label>
        <input
          type="number"
          step="1"
          value={trade?.entry_price || ''}
          onChange={(e) => handleFormChange('entry_price', e.target.value, isEditMode)}
          className={`px-3 py-1.5 border ${formErrors.entry_price ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all`}
          placeholder="0"
          required
        />
        {formErrors.entry_price && <p className="text-red-500 text-xs mt-1">{formErrors.entry_price}</p>}
      </div>
      <div className="flex flex-col text-xs w-[100px]">
        <label className="text-gray-600 font-medium mb-1">Stop Loss</label>
        <input
          type="number"
          step="1"
          value={trade?.stop_loss || ''}
          onChange={(e) => handleFormChange('stop_loss', e.target.value, isEditMode)}
          className={`px-3 py-1.5 border(interval) ${formErrors.stop_loss ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all`}
          placeholder="0"
          required
        />
        {formErrors.stop_loss && <p className="text-red-500 text-xs mt-1">{formErrors.stop_loss}</p>}
      </div>
      <div className="flex flex-col text-xs w-[100px]">
        <label className="text-gray-600 font-medium mb-1">Target Price</label>
        <input
          type="number"
          step="1"
          value={trade?.target_price || ''}
          onChange={(e) => handleFormChange('target_price', e.target.value, isEditMode)}
          className={`px-3 py-1.5 border ${formErrors.target_price ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all`}
          placeholder="0"
          required
        />
        {formErrors.target_price && <p className="text-red-500 text-xs mt-1">{formErrors.target_price}</p>}
      </div>
      <div className="flex flex-col text-xs w-[100px]">
        <label className="text-gray-600 font-medium mb-1">Target Ratio</label>
        <select
          value={targetRatio}
          onChange={(e) => handleFormChange('targetRatio', e.target.value, isEditMode)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
        >
          <option value="1:2">1:2</option>
          <option value="1:3">1:3</option>
        </select>
      </div>
      <div className="flex flex-col text-xs w-[100px]">
        <label className="text-gray-600 font-medium mb-1">Trade Type</label>
        <select
          value={trade?.trade_type || 'BUY'}
          onChange={(e) => handleFormChange('trade_type', e.target.value, isEditMode)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
          required
        >
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>
      <div className="flex flex-col text-xs w-[100px]">
        <label className="text-gray-600 font-medium mb-1">Status</label>
        <select
          value={trade?.status || 'OPEN'}
          onChange={(e) => handleFormChange('status', e.target.value, isEditMode)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
          required
        >
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>
      <div className="flex flex-col text-xs w-[220px]">
        <label className="text-gray-600 font-medium mb-1">Note</label>
        <textarea
          value={trade?.note || ''}
          onChange={(e) => handleFormChange('note', e.target.value, isEditMode)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none h-16"
          placeholder="Enter note"
        />
      </div>
      <div className="flex space-x-3 mt-3 w-full">
        <button
          type="button"
          onClick={handleModalClose}
          className="flex-1 px-4 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          {isEditMode ? 'Save' : 'Add Trade'}
        </button>
      </div>
    </form>
  );

  return (
    <ErrorBoundary>
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col text-xs w-[200px]">
                <label className="text-gray-600 font-medium mb-1">Search Symbol</label>
                <input
                  type="text"
                  name="symbol"
                  value={searchParams.symbol}
                  onChange={handleSearchChange}
                  placeholder="Enter symbol..."
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex flex-col text-xs w-[150px]">
                <label className="text-gray-600 font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={searchParams.status}
                  onChange={handleSearchChange}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                >
                  <option value="">All</option>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div className="flex flex-col text-xs w-[150px]">
                <label className="text-gray-600 font-medium mb-1">Max % Difference</label>
                <input
                  type="number"
                  step="0.1"
                  name="percent_diff"
                  value={percentDiff}
                  onChange={handleSearchChange}
                  placeholder="e.g., 1 for ≤1%"
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleAddTrade}
              className="flex items-center px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Trade
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 animate-pulse">Loading trades...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredTrades.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No trades available</div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0">
                    <tr>
                      {[
                        { key: 'realtime_data', label: 'Realtime Data' },
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
                          className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${key === 'realtime_data' ? 'w-32' : ''}`}
                          onClick={key !== 'actions' && key !== 'realtime_data' ? () => handleSort(key) : undefined}
                        >
                          {label}
                          {key !== 'actions' && key !== 'realtime_data' && renderSortIcon(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrades.map((trade) => (
                      <tr key={trade._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {realtimeLoading ? (
                            <span className="text-gray-500 animate-pulse">Fetching...</span>
                          ) : (
                            <div className="flex flex-col space-y-1">
                              <span>{trade.symbol}</span>
                              <span>LTP: {realtimeData[trade.symbol]?.ltp ?? 'N/A'}</span>
                              <span>Day's Low: {realtimeData[trade.symbol]?.day_low ?? 'N/A'}</span>
                              <span>% Diff: {calculatePercentDiff(trade)}%</span>
                            </div>
                          )}
                        </td>
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
                    {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} trades
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
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          title={modalMode === 'edit' ? `Edit Trade - ${editTrade?.symbol || ''}` : 'Add New Trade'}
        >
          {modalMode === 'edit' ? renderForm(editTrade, true) : renderForm(newTrade, false)}
        </Modal>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      </Card>
    </ErrorBoundary>
  );
};

export default TradesTable;