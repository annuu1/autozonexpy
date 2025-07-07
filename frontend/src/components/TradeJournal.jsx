import React from "react"

export const TradeJournal = () => {
    return (
        <div id="webcrumbs">
            <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-neutral-50 to-blue-50 min-h-screen">
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Stock Trading Journal</h1>
                                <p className="text-gray-600">Track and analyze your trading performance</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-neutral-500">Total Trades</p>
                                <p className="text-2xl font-bold text-gray-900" id="totalTrades">
                                    0
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-neutral-500">Win Rate</p>
                                <p className="text-2xl font-bold text-green-600" id="winRate">
                                    0%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-neutral-50 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-500">add_circle</span>
                                Add New Trade
                            </h2>
                            <form
                                className="space-y-4"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const formData = new FormData(e.target)
                                    const trade = {
                                        id: Date.now(),
                                        date: formData.get("date"),
                                        symbol: formData.get("symbol"),
                                        type: formData.get("type"),
                                        quantity: parseFloat(formData.get("quantity")),
                                        entryPrice: parseFloat(formData.get("entryPrice")),
                                        exitPrice: parseFloat(formData.get("exitPrice")),
                                        notes: formData.get("notes"),
                                        pnl:
                                            (parseFloat(formData.get("exitPrice")) -
                                                parseFloat(formData.get("entryPrice"))) *
                                            parseFloat(formData.get("quantity"))
                                    }

                                    const trades = JSON.parse(localStorage.getItem("stockTrades") || "[]")
                                    trades.push(trade)
                                    localStorage.setItem("stockTrades", JSON.stringify(trades))

                                    e.target.reset()

                                    const event = new CustomEvent("tradesUpdated")
                                    window.dispatchEvent(event)
                                }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Symbol
                                        </label>
                                        <input
                                            type="text"
                                            name="symbol"
                                            placeholder="AAPL"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                                        <select
                                            name="type"
                                            required
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Long">Long</option>
                                            <option value="Short">Short</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            step="0.01"
                                            placeholder="100"
                                            required
                                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            Entry Price
                                        </label>
                                        <input
                                            type="number"
                                            name="entryPrice"
                                            step="0.01"
                                            placeholder="150.00"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exit Price</label>
                                    <input
                                        type="number"
                                        name="exitPrice"
                                        step="0.01"
                                        placeholder="155.00"
                                        required
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                                    <textarea
                                        name="notes"
                                        rows="3"
                                        placeholder="Add your trading notes..."
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-600 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    Add Trade
                                </button>
                            </form>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-500">analytics</span>
                                Performance Overview
                            </h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-neutral-500">Total P&L</p>
                                    <p className="text-2xl font-bold" id="totalPnl">
                                        $0.00
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-gray-500">Avg P&L</p>
                                    <p className="text-2xl font-bold" id="avgPnl">
                                        $0.00
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-neutral-500">Best Trade</p>
                                    <p className="text-2xl font-bold text-green-600" id="bestTrade">
                                        $0.00
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <p className="text-sm text-gray-500">Worst Trade</p>
                                    <p className="text-2xl font-bold text-red-600" id="worstTrade">
                                        $0.00
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="font-semibold mb-3">Monthly Performance</h3>
                                <div className="h-48 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                                        <p>Charts will appear after adding trades</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary-500">history</span>
                            Trade History
                        </h2>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center gap-2">
                                <span className="material-symbols-outlined">filter_list</span>
                                Filter
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to clear all trades?")) {
                                        localStorage.removeItem("stockTrades")
                                        const event = new CustomEvent("tradesUpdated")
                                        window.dispatchEvent(event)
                                    }
                                }}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">delete</span>
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Symbol</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Entry</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Exit</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">P&L</th>
                                    <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="tradesTableBody">
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-neutral-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl">inbox</span>
                                            <p>No trades recorded yet. Add your first trade above!</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <script
                    dangerouslySetInnerHTML={{
                        __html: `
	      function updateStats() {
	        const trades = JSON.parse(localStorage.getItem('stockTrades') || '[]');
	        const totalTrades = trades.length;
	        
	        document.getElementById('totalTrades').textContent = totalTrades;
	        
	        if (totalTrades > 0) {
	          const winningTrades = trades.filter(trade => trade.pnl > 0).length;
	          const winRate = Math.round((winningTrades / totalTrades) * 100);
	          document.getElementById('winRate').textContent = winRate + '%';
	          
	          const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
	          const avgPnl = totalPnl / totalTrades;
	          const bestTrade = Math.max(...trades.map(trade => trade.pnl));
	          const worstTrade = Math.min(...trades.map(trade => trade.pnl));
	          
	          document.getElementById('totalPnl').textContent = '$' + totalPnl.toFixed(2);
	          document.getElementById('totalPnl').className = totalPnl >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600';
	          
	          document.getElementById('avgPnl').textContent = '$' + avgPnl.toFixed(2);
	          document.getElementById('avgPnl').className = avgPnl >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600';
	          
	          document.getElementById('bestTrade').textContent = '$' + bestTrade.toFixed(2);
	          document.getElementById('worstTrade').textContent = '$' + worstTrade.toFixed(2);
	        } else {
	          document.getElementById('winRate').textContent = '0%';
	          document.getElementById('totalPnl').textContent = '$0.00';
	          document.getElementById('avgPnl').textContent = '$0.00';
	          document.getElementById('bestTrade').textContent = '$0.00';
	          document.getElementById('worstTrade').textContent = '$0.00';
	        }
	      }
	      
	      function updateTradesTable() {
	        const trades = JSON.parse(localStorage.getItem('stockTrades') || '[]');
	        const tbody = document.getElementById('tradesTableBody');
	        
	        if (trades.length === 0) {
	          tbody.innerHTML = '<tr ><td colspan="8" class="py-8 text-center text-gray-500"><div class="flex flex-col items-center gap-2"><span class="material-symbols-outlined text-4xl">inbox</span><p>No trades recorded yet. Add your first trade above!</p></div></td></tr>';
	          return;
	        }
	        
	        tbody.innerHTML = trades.sort((a, b) => new Date(b.date) - new Date(a.date)).map(trade => {
	          const pnlClass = trade.pnl >= 0 ? 'text-green-600' : 'text-red-600';
	          return \`
	            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
	              <td class="py-3 px-4">\${trade.date}</td>
	              <td class="py-3 px-4 font-medium">\${trade.symbol}</td>
	              <td class="py-3 px-4">
	                <span class="px-2 py-1 rounded-full text-xs font-medium \${trade.type === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">\${trade.type}</span>
	              </td>
	              <td class="py-3 px-4">\${trade.quantity}</td>
	              <td class="py-3 px-4">$\${trade.entryPrice.toFixed(2)}</td>
	              <td class="py-3 px-4">$\${trade.exitPrice.toFixed(2)}</td>
	              <td class="py-3 px-4 font-medium \${pnlClass}">$\${trade.pnl.toFixed(2)}</td>
	              <td class="py-3 px-4">
	                <button onclick="deleteTrade(\${trade.id})" class="text-red-500 hover:text-red-700 transition-colors duration-200">
	                  <span class="material-symbols-outlined">delete</span>
	                </button>
	              </td>
	            </tr>
	          \`;
	        }).join('');
	      }
	      
	      function deleteTrade(tradeId) {
	        if (confirm('Are you sure you want to delete this trade?')) {
	          const trades = JSON.parse(localStorage.getItem('stockTrades') || '[]');
	          const updatedTrades = trades.filter(trade => trade.id !== tradeId);
	          localStorage.setItem('stockTrades', JSON.stringify(updatedTrades));
	          
	          const event = new CustomEvent('tradesUpdated');
	          window.dispatchEvent(event);
	        }
	      }
	      
	      window.addEventListener('tradesUpdated', () => {
	        updateStats();
	        updateTradesTable();
	      });
	      
	      updateStats();
	      updateTradesTable();
	    `
                    }}
                />

                {/* Next: "Add trade filtering by date range, symbol, or trade type" */}
                {/* Next: "Add chart visualization for P&L over time using ApexCharts" */}
                {/* Next: "Add export functionality to CSV or PDF" */}
                {/* Next: "Add trade editing capability" */}
                {/* Next: "Add advanced analytics like Sharpe ratio, max drawdown" */}
            </div>
        </div>
    )
}
