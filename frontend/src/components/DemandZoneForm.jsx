import { useState, useEffect } from 'react'
import axios from 'axios'

function DemandZoneForm({ onSubmit }) {
  const today = new Date('2025-06-20');
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [formData, setFormData] = useState({
    ticker: '',
    start_date: oneYearAgo.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0],
    interval: '1d',
    leginMinBodyPercent: 50,
    legoutMinBodyPercent: 50,
    baseMaxBodyPercent: 47,
    minBaseCandles: 1,
    maxBaseCandles: 5,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setmData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Normalize ticker: uppercase and append .NS if not present
    const normalizedTicker = formData ticker.toUpperCase().endsWith('.NS')
      ? formData.ticker.toUpperCase()
      : `${formData.ticker.toUpperCase()}.NS`

    const payload = {
      ...formData,
      ticker: normalizedTicker,
      leginMinBodyPercent: parseInt(formData.leginMinBodyPercent, 10),
      legoutMinBodyPercent: parseInt(formData.legoutMinBodyPercent, 10),
      baseMaxBodyPercent: parseInt(formData.baseMaxBodyPercent, 10),
      minBaseCandles: parseInt(formData.minBaseCandles, 10),
      maxBaseCandles: parseInt(formData.maxBaseCandles, 10),
    }

    try {
      const response = await axios.post('/demand-zones', payload)
      onSubmit(response.data, null)
    } catch (error) {
      onSubmit(null, error.response?.data?.detail || 'An error occurred while fetching demand zones')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">Ticker</label>
        <input
          type="text"
          id="ticker"
          name="ticker"
          value={formData.ticker}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., RELIANCE"
        />
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <div>
        <label htmlFor="interval" className="block text-sm font-medium text-gray-700">Interval</label>
        <select
          id="interval"
          name="interval"
          value={formData.interval}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="1d">Daily</option>
          <option value="1h">Hourly</option>
          <option value="1wk">Weekly</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="leginMinBodyPercent" className="block text-sm font-medium text-gray-700">Leg-in Candle Body Min %</label>
          <input
            type="number"
            id="leginMinBodyPercent"
            name="leginMinBodyPercent"
            value={formData.leginMinBodyPercent}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="legoutMinBodyPercent" className="block text-sm font-medium text-gray-700">Leg-out Candle Body Min %</label>
          <input
            type="number"
            id="legoutMinBodyPercent"
            name="legoutMinBodyPercent"
            value={formData.legoutMinBodyPercent}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="baseMaxBodyPercent" className="block text-sm font-medium text-gray-700">Base Candle Maximum Body %</label>
          <input
            type="number"
            id="baseMaxBodyPercent"
            name="baseMaxBodyPercent"
            value={formData.baseMaxBodyPercent}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="minBaseCandles" className="block text-sm font-medium text-gray-700">Min Number of Base Candles</label>
          <input
            type="number"
            id="minBaseCandles"
            name="minBaseCandles"
            value={formData.minBaseCandles}
            onChange={handleChange}
            min="1"
            step="1"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="maxBaseCandles" className="block text-sm font-medium text-gray-700">Max Number of Base Candles</label>
          <input
            type="number"
            id="maxBaseCandles"
            name="maxBaseCandles"
            value={formData.maxBaseCandles}
            onChange={handleChange}
            min="1"
            step="1"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700">
        Find Demand Zones
      </button>
    </form>
  )
}

export default DemandZoneForm