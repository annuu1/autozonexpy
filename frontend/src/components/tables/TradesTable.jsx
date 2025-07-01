import React, { useEffect, useState } from 'react';
import { getTrades } from '../../services/api';
import Card from '../ui/Card';

const TradesTable = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const data = await getTrades();
        setTrades(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  return (
    <Card>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading trades...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entry Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stop Loss</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trade Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alert Sent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entry Alert Sent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trades.map((trade) => (
                <tr key={trade._id}>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.symbol}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.entry_price}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.stop_loss}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.target_price}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.trade_type}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.status}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(trade.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.alert_sent ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.entry_alert_sent ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{trade.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

export default TradesTable;
