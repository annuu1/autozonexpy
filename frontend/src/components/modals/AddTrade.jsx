//a trade modal having the trade details like entry sl target etc
import Modal from "../ui/Modal"
import Button from "../ui/Button"
// If you still get an 'Element type is invalid' error, check that Modal and Button are valid React components and are exported correctly from ../ui/Modal and ../ui/Button.

const AddTrade = ({ isOpen, onClose, ticker, trades }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Trade">
            {
                trades.map((trade, index) => (
                    <div key={index}>
                        <form action="" onSubmit={(e) => e.preventDefault()} className="flex items-center justify-center space-y-4 space-x-1">
                            <div className="flex gap-2 border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm">
                                <label htmlFor="entry_price">Entry Price</label>
                                <input type="number" id="entry_price" name="entry_price" value={parseFloat(trade.entry_price).toFixed(2)} />
                            </div>
                            <div className="flex gap-2 border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm">
                                <label htmlFor="sl">SL</label>
                                <input type="number" id="sl" name="sl" value={parseFloat(trade.sl).toFixed(2)} />
                            </div>
                            <div className="flex gap-2 border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm">
                                <label htmlFor="target">Target</label>
                                <input type="number" id="target" name="target" value={parseFloat(trade.target).toFixed(2)} />
                            </div>  
                            <div className="flex justify-center items-center">
                            <input type="submit" value="+" className="bg-green-500 text-white p-2 rounded-full" />
                            </div>
                        </form>
                    </div>
                ))
            }
        </Modal>
    )   
}

export default AddTrade
