import React, { useState } from 'react'
import StockChart from './chart/StockChart'
import axios from 'axios'

const ZoneCharts = () => {
  const [ticker, setTicker] = useState('ABB')
  const [interval, setInterval] = useState('1d')
  const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const intervals = [
    { value: '1d', label: 'Daily' },
    { value: '1h', label: 'Hourly' },
    { value: '1wk', label: 'Weekly' },
    { value: '30m', label: '30 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '5m', label: '5 Minutes' },
  ]

  const popularTickers = [
    'ABB', 'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 
    'HINDUNILVR', 'INFY', 'ITC', 'SBIN', 'BHARTIARTL'
  ]

  const fetchZones = async () => {
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const normalizedTicker = ticker.toUpperCase().endsWith('.NS')
        ? ticker.toUpperCase()
        : `${ticker.toUpperCase()}.NS`

      const payload = {
        ticker: normalizedTicker,
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        higher_interval: interval,
        lower_interval: interval === '1d' ? '1h' : '15m',
        leginMinBodyPercent: 50,
        ltf_leginMinBodyPercent: 50,
        legoutMinBodyPercent: 50,
        ltf_legoutMinBodyPercent: 50,
        baseMaxBodyPercent: 50,
        ltf_baseMaxBodyPercent: 50,
        minLeginMovement: 7,
        ltf_minLeginMovement: 3,
        minLegoutMovement: 7,
        ltf_minLegoutMovement: 3,
        minBaseCandles: 1,
        maxBaseCandles: 5,
        detectLowerZones: true,
      }

      const response = await axios.post('/demand-zones', payload)
      setZones(response.data || [])
      console.log('Fetched zones:', response.data)
    } catch (error) {
      console.error('Error fetching zones:', error)
      setError(error.response?.data?.detail || 'Failed to fetch demand zones')
      setZones([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTickerChange = (e) => {
    setTicker(e.target.value)
    setZones([]) // Clear zones when ticker changes
  }

  const handleIntervalChange = (e) => {
    setInterval(e.target.value)
    setZones([]) // Clear zones when interval changes
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock Chart with Demand Zones</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticker Symbol
            </label>
            <input
              type="text"
              value={ticker}
              onChange={handleTickerChange}
              placeholder="e.g., RELIANCE, TCS, ABB"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Interval
            </label>
            <select
              value={interval}
              onChange={handleIntervalChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              {intervals.map(int => (
                <option key={int.value} value={int.value}>
                  {int.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchZones}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Loading...
                </span>
              ) : (
                'Load Zones & Chart'
              )}
            </button>
          </div>
        </div>

        {/* Popular Tickers */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Popular tickers:</p>
          <div className="flex flex-wrap gap-2">
            {popularTickers.map(popularTicker => (
              <button
                key={popularTicker}
                onClick={() => {
                  setTicker(popularTicker)
                  setZones([])
                }}
                className={`px-3 py-1 text-sm rounded-full border transition-colors duration-150 ${
                  ticker.toUpperCase() === popularTicker
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white/60 text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {popularTicker}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Summary */}
        {zones.length > 0 && (
          <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Zones Found: {zones.length}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-700">Fresh Zones:</span>
                <span className="ml-2 text-green-600">
                  {zones.filter(z => z.freshness === 3).length}
                </span>
              </div>
              <div>
                <span className="font-medium text-yellow-700">Tested Zones:</span>
                <span className="ml-2 text-yellow-600">
                  {zones.filter(z => z.freshness === 1.5).length}
                </span>
              </div>
              <div>
                <span className="font-medium text-red-700">Breached Zones:</span>
                <span className="ml-2 text-red-600">
                  {zones.filter(z => z.freshness === 0).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm rounded-lg border border-red-200">
            <p className="text-red-700 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Chart */}
      <StockChart 
        ticker={ticker} 
        interval={interval} 
        zones={zones}
      />

      {/* Zone Details Table */}
      {zones.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Zone Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proximal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freshness</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                {zones.map((zone, index) => (
                  <tr key={`${zone.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        zone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.pattern}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {zone.proximal_line.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {zone.distal_line.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        zone.trade_score >= 5 ? 'text-green-600' : 
                        zone.trade_score >= 3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {zone.trade_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        zone.freshness === 3 ? 'text-green-600' : 
                        zone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {zone.freshness}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(zone.end_timestamp || zone.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoneCharts