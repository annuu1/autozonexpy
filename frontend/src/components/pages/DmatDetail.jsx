import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHoldings } from '../../services/dmat';

const Overview = ({ dmat }) => (
  <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl">
    <h2 className="text-2xl font-bold text-gray-100 mb-6">Account Overview</h2>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-400 text-sm font-medium">Account Name</p>
        <p className="text-gray-100 text-lg">{dmat.name}</p>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">Broker</p>
        <p className="text-gray-100 text-lg">{dmat.broker}</p>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">Balance</p>
        <p className="text-gray-100 text-lg">₹{Number(dmat.balance).toLocaleString('en-IN')}</p>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium">Status</p>
        <p className={`text-lg ${dmat.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
          {dmat.status}
        </p>
      </div>
    </div>
  </div>
);

const AddTrade = ({ onAddTrade, dmatId }) => {
  const [trade, setTrade] = useState({ stock: '', instrumentName: '', quantity: '', price: '', type: 'buy' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trade.stock && trade.instrumentName && trade.quantity && trade.price) {
      onAddTrade(dmatId, {
        ...trade,
        id: Date.now(),
        date: new Date().toLocaleDateString()
      });
      setTrade({ stock: '', instrumentName: '', quantity: '', price: '', type: 'buy' });
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Add New Trade</h2>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label className="text-gray-400 text-sm font-medium block mb-2">Stock Symbol</label>
          <input
            type="text"
            value={trade.stock}
            onChange={(e) => setTrade({ ...trade, stock: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Enter stock symbol (e.g., IDEA)"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm font-medium block mb-2">Instrument Name</label>
          <input
            type="text"
            value={trade.instrumentName}
            onChange={(e) => setTrade({ ...trade, instrumentName: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Enter instrument name (e.g., Vodafone Idea Ltd)"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm font-medium block mb-2">Quantity</label>
          <input
            type="number"
            value={trade.quantity}
            onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Enter quantity"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm font-medium block mb-2">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={trade.price}
            onChange={(e) => setTrade({ ...trade, price: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="Enter price"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm font-medium block mb-2">Type</label>
          <select
            value={trade.type}
            onChange={(e) => setTrade({ ...trade, type: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Add Trade
        </button>
      </form>
    </div>
  );
};

const Holdings = ({ holdings }) => (
  <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl">
    <h2 className="text-2xl font-bold text-gray-100 mb-6">Holdings</h2>
    {holdings?.length === 0 ? (
      <p className="text-gray-400 text-center py-4">No holdings available.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-sm font-medium border-b border-gray-700">
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Instrument</th>
              <th className="py-3 px-4">Sector</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Sellable Qty</th>
              <th className="py-3 px-4">Avg Price</th>
              <th className="py-3 px-4">LTP</th>
              <th className="py-3 px-4">Holding Cost</th>
              <th className="py-3 px-4">Market Value</th>
              <th className="py-3 px-4">P&L</th>
            </tr>
          </thead>
          <tbody>
            {holdings?.map((holding) => {
              const pnl = holding.closingPrice && holding.averagePrice ? (holding.closingPrice - holding.averagePrice) * holding.quantity : 0;
              return (
                <tr
                  key={holding.scripId || holding.displaySymbol}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all duration-200"
                >
                  <td className="py-3 px-4 text-gray-100">{holding.displaySymbol}</td>
                  <td className="py-3 px-4 text-gray-100">{holding.instrumentName || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-100">{holding.sector || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-100">{holding.quantity}</td>
                  <td className="py-3 px-4 text-gray-100">{holding.sellableQuantity || holding.quantity}</td>
                  <td className="py-3 px-4 text-gray-100">₹{Number(holding.averagePrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-gray-100">
                    {holding.closingPrice ? `₹${Number(holding.closingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-gray-100">₹{Number(holding.holdingCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-gray-100">₹{Number(holding.mktValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className={`py-3 px-4 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {pnl >= 0 ? '↑' : '↓'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const DmatDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [holdings, setHoldings] = useState([]);

  // Mock DMAT data (to simulate API call)
  const dmat = {
    id: parseInt(id),
    name: `DMAT Account ${id || ''}`,
    broker: "Sample Broker",
    balance: 100000,
    status: "Active",
    holdings: holdings
  };

  // Mock addTrade function (to simulate API call)
  const addTrade = (dmatId, trade) => {
    setHoldings((prevHoldings) => [
      ...prevHoldings,
      {
        displaySymbol: trade.stock,
        instrumentName: trade.instrumentName,
        averagePrice: parseFloat(trade.price),
        quantity: parseInt(trade.quantity),
        holdingCost: parseFloat(trade.price) * parseInt(trade.quantity),
        mktValue: parseFloat(trade.price) * parseInt(trade.quantity),
        closingPrice: parseFloat(trade.price),
        scripId: Date.now().toString(),
        sector: 'N/A',
        sellableQuantity: parseInt(trade.quantity),
        instrumentType: 'Equity',
        exchangeSegment: 'nse_cm',
        exchangeIdentifier: 'N/A',
        isAlternateScrip: false,
        securityType: 'EQUITY STOCK',
        securitySubType: 'EQUITY STOCK',
        date: trade.date
      }
    ]);
  };

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const response = await getHoldings();
        setHoldings(response.data);
      } catch (error) {
        console.error('Failed to fetch holdings:', error);
      }
    };
    fetchHoldings();
  }, []);

  if (!dmat) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-gray-700">
          <p className="text-gray-400 text-center text-lg">DMAT account not found.</p>
          <Link to="/" className="text-blue-400 hover:text-blue-500 mt-4 block text-center font-medium">
            Back to DMAT List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">{dmat.name || 'DMAT Account'}</h1>
          <Link to="/" className="text-blue-400 hover:text-blue-500 font-medium transition-all duration-200">
            Back to DMAT List
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-gray-700">
          <button
            className={`pb-3 px-4 text-gray-400 font-semibold text-lg transition-all duration-200 ${
              activeTab === 'overview' ? 'border-b-2 border-blue-500 text-gray-100' : 'hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`pb-3 px-4 text-gray-400 font-semibold text-lg transition-all duration-200 ${
              activeTab === 'trades' ? 'border-b-2 border-blue-500 text-gray-100' : 'hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('trades')}
          >
            Add Trade
          </button>
          <button
            className={`pb-3 px-4 text-gray-400 font-semibold text-lg transition-all duration-200 ${
              activeTab === 'holdings' ? 'border-b-2 border-blue-500 text-gray-100' : 'hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('holdings')}
          >
            Holdings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && <Overview dmat={dmat} />}
        {activeTab === 'trades' && <AddTrade dmatId={dmat.id} onAddTrade={addTrade} />}
        {activeTab === 'holdings' && <Holdings holdings={dmat.holdings} />}
      </div>
    </div>
  );
};

export default DmatDetail;