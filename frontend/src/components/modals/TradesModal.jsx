import React from 'react';
import Modal from '../ui/Modal';

const TradesModal = ({ isOpen, onClose, trades }) => {
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Trades">
            {/* the fresh table to display the trades  */}
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="px-4 py-2">Entry Price</th>
                        <th className="px-4 py-2">SL</th>
                        <th className="px-4 py-2">Target</th>
                        <th className="px-4 py-2">Trade Type</th>
                        <th className="px-4 py-2">Trade Score</th>
                        <th className="px-4 py-2">Freshness</th>
                        <th className="px-4 py-2">Trade ID</th>
                        <th className="px-4 py-2">Trade Date</th>
                        <th className="px-4 py-2">Trade Status</th>
                        <th className="px-4 py-2">Trade Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {trades?.length === 0 && (
                        <tr>
                            <td colSpan={10} className="text-center py-4">No trades found</td>
                        </tr>
                    )}
                    {trades?.map((trade) => (
                        <tr key={trade._id}>
                            <td className="px-4 py-2">{trade.entry_price}</td>
                            <td className="px-4 py-2">{trade.sl}</td>
                            <td className="px-4 py-2">{trade.target}</td>
                            <td className="px-4 py-2">{trade.trade_type}</td>
                            <td className="px-4 py-2">{trade.trade_score}</td>
                            <td className="px-4 py-2">{trade.freshness}</td>
                            <td className="px-4 py-2">{trade.trade_id}</td>
                            <td className="px-4 py-2">{trade.trade_date}</td>
                            <td className="px-4 py-2">{trade.trade_status}</td>
                            <td className="px-4 py-2">{trade.trade_notes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Modal>
    );
};

export default TradesModal;