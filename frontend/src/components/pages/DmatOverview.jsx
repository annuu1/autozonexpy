import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DmatOverview = ({ dmats, addDmat }) => {
  const [newDmat, setNewDmat] = useState({ name: '', broker: '', balance: '' });
  const [activeTab, setActiveTab] = useState('list');

  const handleAddDmat = (e) => {
    e.preventDefault();
    if (newDmat.name && newDmat.broker && newDmat.balance) {
      addDmat(newDmat);
      setNewDmat({ name: '', broker: '', balance: '' });
      setActiveTab('list');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">DMAT Accounts</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            className={`pb-2 px-4 text-white/80 font-semibold ${activeTab === 'list' ? 'border-b-2 border-blue-500 text-white' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            DMAT List
          </button>
          <button
            className={`pb-2 px-4 text-white/80 font-semibold ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-white' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add DMAT
          </button>
        </div>

        {/* Content */}
        {activeTab === 'list' && (
          <div className="grid gap-4">
            {dmats.length === 0 ? (
              <p className="text-white/80 text-center">No DMAT accounts added yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {dmats.map((dmat) => (
                  <Link
                    key={dmat.id}
                    to={`/dmat/${dmat.id}`}
                    className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <h2 className="text-xl font-semibold text-white">{dmat.name}</h2>
                    <p className="text-white/80">Broker: {dmat.broker}</p>
                    <p className="text-white/80">Balance: ₹{Number(dmat.balance).toLocaleString()}</p>
                    <p className="text-white/80">Status: {dmat.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Add New DMAT Account</h2>
            <form onSubmit={handleAddDmat} className="grid gap-4">
              <div>
                <label className="text-white/80 block mb-1">Account Name</label>
                <input
                  type="text"
                  value={newDmat.name}
                  onChange={(e) => setNewDmat({ ...newDmat, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter account name"
                />
              </div>
              <div>
                <label className="text-white/80 block mb-1">Broker</label>
                <input
                  type="text"
                  value={newDmat.broker}
                  onChange={(e) => setNewDmat({ ...newDmat, broker: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter broker name"
                />
              </div>
              <div>
                <label className="text-white/80 block mb-1">Balance (₹)</label>
                <input
                  type="number"
                  value={newDmat.balance}
                  onChange={(e) => setNewDmat({ ...newDmat, balance: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter balance"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
              >
                Add DMAT
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DmatOverview;