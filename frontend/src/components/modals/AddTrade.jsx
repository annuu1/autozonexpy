import { useState, useEffect } from "react"
import Modal from "../ui/Modal"
import Button from "../ui/Button"
import { addTrade } from "../../services/api"

const AddTrade = ({ isOpen, onClose, ticker, trades }) => {
  const [tradeData, setTradeData] = useState([])

  // Initialize state from props when modal opens
  useEffect(() => {
    if (isOpen) {
      setTradeData(
        trades.map((trade) => ({
          entry_price: trade.entry_price,
          sl: trade.sl,
          target: trade.target,
          note: "",
          trade_type: "BUY", // or default as per your UI
        }))
      )
    }
  }, [isOpen, trades])

  const handleInputChange = (index, field, value) => {
    const updated = [...tradeData]
    updated[index][field] = value
    setTradeData(updated)
  }

  const handleSubmit = async (index) => {
    const { entry_price, sl, target, note, trade_type } = tradeData[index]
    try {
      await addTrade(
        ticker,
        parseFloat(Number(entry_price).toFixed(2)),
        parseFloat(Number(sl).toFixed(2)),
        parseFloat(Number(target).toFixed(2)),
        trade_type,
        note
      )
      alert("Trade added successfully!")
      onClose() // or remove this trade from state if needed
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Trade - ${ticker}`}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {tradeData.map((trade, index) => (
          <form
            key={index}
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(index)
            }}
            className="flex flex-wrap items-end gap-2 border border-gray-300 bg-white/80 rounded-md p-3 backdrop-blur-sm"
          >
            <div className="flex flex-col text-xs w-[80px]">
              <label className="text-gray-600 mb-1">Entry</label>
              <input
                type="number"
                value={trade.entry_price}
                onChange={(e) => handleInputChange(index, "entry_price", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col text-xs w-[70px]">
              <label className="text-gray-600 mb-1">SL</label>
              <input
                type="number"
                value={trade.sl}
                onChange={(e) => handleInputChange(index, "sl", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col text-xs w-[80px]">
              <label className="text-gray-600 mb-1">Target</label>
              <input
                type="number"
                value={trade.target}
                onChange={(e) => handleInputChange(index, "target", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Optional trade type select */}
            <div className="flex flex-col text-xs w-[80px]">
              <label className="text-gray-600 mb-1">Type</label>
              <select
                value={trade.trade_type}
                onChange={(e) => handleInputChange(index, "trade_type", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-400"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div className="flex flex-col text-xs flex-1 min-w-[140px]">
              <label className="text-gray-600 mb-1">Note</label>
              <textarea
                value={trade.note}
                onChange={(e) => handleInputChange(index, "note", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm resize-none h-[36px] focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
              >
                +
              </Button>
            </div>
          </form>
        ))}
      </div>
    </Modal>
  )
}

export default AddTrade
