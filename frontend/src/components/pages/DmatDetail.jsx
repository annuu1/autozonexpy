import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHoldings } from '../../services/dmat';

const Overview = ({ dmat }) => (
  <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
    <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
    <p className="text-white/80">Account Name: {dmat.name}</p>
    <p className="text-white/80">Broker: {dmat.broker}</p>
    <p className="text-white/80">Balance: ₹{Number(dmat.balance).toLocaleString()}</p>
    <p className="text-white/80">Status: {dmat.status}</p>
  </div>
);

const AddTrade = ({ onAddTrade, dmatId }) => {
  const [trade, setTrade] = useState({ stock: '', quantity: '', price: '', type: 'buy' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trade.stock && trade.quantity && trade.price) {
      onAddTrade(dmatId, { ...trade, id: Date.now(), date: new Date().toLocaleDateString() });
      setTrade({ stock: '', quantity: '', price: '', type: 'buy' });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-4">Add Trade</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="text-white/80 block mb-1">Stock Symbol</label>
          <input
            type="text"
            value={trade.stock}
            onChange={(e) => setTrade({ ...trade, stock: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter stock symbol"
          />
        </div>
        <div>
          <label className="text-white/80 block mb-1">Quantity</label>
          <input
            type="number"
            value={trade.quantity}
            onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quantity"
          />
        </div>
        <div>
          <label className="text-white/80 block mb-1">Price (₹)</label>
          <input
            type="number"
            value={trade.price}
            onChange={(e) => setTrade({ ...trade, price: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter price"
          />
        </div>
        <div>
          <label className="text-white/80 block mb-1">Type</label>
          <select
            value={trade.type}
            onChange={(e) => setTrade({ ...trade, type: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
        >
          Add Trade
        </button>
      </form>
    </div>
  );
};

const Holdings = ({ holdings }) => (
  <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
    <h2 className="text-xl font-semibold text-white mb-4">Holdings</h2>
    {holdings.length === 0 ? (
      <p className="text-white/80">No holdings available.</p>
    ) : (
      <div className="grid gap-4">
        {holdings.map((holding) => (
          <div key={holding.id || holding.displaySymbol} className="border-b border-white/10 pb-2">
            <p className="text-white/80">Stock: {holding.displaySymbol}</p>
            <p className="text-white/80">Quantity: {holding.quantity}</p>
            <p className="text-white/80">Avg Price: ₹{Number(holding.averagePrice).toLocaleString()}</p>
            <p className="text-white/80">Type: {holding.type}</p>
            <p className="text-white/80">LTP: {holding.closingPrice}</p>
            <p className="text-white/80">Sector: {holding.sector}</p>
          </div>
        ))}
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
    name: `DMAT Account ${id? id : ''}`,
    broker: "Sample Broker",
    balance: 100000,
    status: "Active",
    holdings: holdings
  };

  // Mock addTrade function (to simulate API call)
  const addTrade = (dmatId, trade) => {
    setHoldings((prevHoldings) => [...prevHoldings, trade]);
  };

  useEffect(()=>{
    const fetchHoldings = async ()=>{
      const response = await getHoldings();
      setHoldings(response.data);
    }
    fetchHoldings();
  },[])

  if (!dmat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <p className="text-white/80 text-center">DMAT account not found.</p>
          <Link to="/" className="text-blue-400 hover:text-blue-500 mt-4 block text-center">
            Back to DMAT List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">{dmat.name ? dmat.name : 'DMAT Account'}</h1>
          <Link to="/" className="text-blue-400 hover:text-blue-500">
            Back to DMAT List
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            className={`pb-2 px-4 text-white/80 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-white' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`pb-2 px-4 text-white/80 font-semibold ${activeTab === 'trades' ? 'border-b-2 border-blue-500 text-white' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            Add Trade
          </button>
          <button
            className={`pb-2 px-4 text-white/80 font-semibold ${activeTab === 'holdings' ? 'border-b-2 border-blue-500 text-white' : ''}`}
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