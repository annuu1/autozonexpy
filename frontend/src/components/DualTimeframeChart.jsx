import React, { useState } from 'react'
import StockChart from './StockChart'

const DualTimeframeChart = ({ ticker, higherTimeframeZone, lowerTimeframeZones = [] }) => {
  const [higherInterval, setHigherInterval] = useState('1wk')
  const [lowerInterval, setLowerInterval] = useState('1d')

  const higherIntervals = [
    { value: '1mo', label: 'Monthly' },
    { value: '1wk', label: 'Weekly' },
    { value: '1d', label: 'Daily' },
    { value: '1h', label: 'Hourly' },
  ]

  const lowerIntervals = [
    { value: '1d', label: 'Daily' },
    { value: '1h', label: 'Hourly' },
    { value: '30m', label: '30 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '5m', label: '5 Minutes' },
  ]

  // Ensure ticker is properly formatted
  const normalizedTicker = ticker?.toUpperCase().endsWith('.NS') 
    ? ticker.toUpperCase() 
    : `${ticker?.toUpperCase()}.NS`

  // Prepare zones for charts
  const higherZones = higherTimeframeZone ? [higherTimeframeZone] : []
  const lowerZones = lowerTimeframeZones || []

  console.log('DualTimeframeChart props:', {
    ticker,
    normalizedTicker,
    higherTimeframeZone,
    lowerTimeframeZones,
    higherZones,
    lowerZones
  })

  if (!ticker || !higherTimeframeZone) {
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg">
        <p className="text-gray-500 text-lg">No zone data provided for chart display.</p>
        <p className="text-gray-400 text-sm mt-2">Please select a zone to view its charts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Zone Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Zone Information for {normalizedTicker}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Higher Timeframe Zone */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Higher Timeframe Zone
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Zone ID:</span>
                <span className="font-mono text-xs">{higherTimeframeZone.zone_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pattern:</span>
                <span className={`font-medium ${
                  higherTimeframeZone.pattern === 'RBR' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {higherTimeframeZone.pattern}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Proximal:</span>
                <span className="font-medium">{higherTimeframeZone.proximal_line.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Distal:</span>
                <span className="font-medium">{higherTimeframeZone.distal_line.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium">{higherTimeframeZone.trade_score.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Freshness:</span>
                <span className={`font-medium ${
                  higherTimeframeZone.freshness === 3 ? 'text-green-600' : 
                  higherTimeframeZone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {higherTimeframeZone.freshness}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Candles:</span>
                <span className="font-medium">{higherTimeframeZone.base_candles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-xs">
                  {new Date(higherTimeframeZone.end_timestamp || higherTimeframeZone.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Lower Timeframe Zones Summary */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Lower Timeframe Zones ({lowerZones.length})
            </h4>
            {lowerZones.length > 0 ? (
              <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
                {lowerZones.map((zone, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      zone.pattern === 'RBR' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {zone.pattern}
                    </span>
                    <span className="text-xs text-gray-600">
                      {zone.proximal_line.toFixed(2)} - {zone.distal_line.toFixed(2)}
                    </span>
                    <span className={`text-xs font-medium ${
                      zone.freshness === 3 ? 'text-green-600' : 
                      zone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      F:{zone.freshness}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No coinciding lower timeframe zones</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chart Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Higher Timeframe Interval:
            </label>
            <select
              value={higherInterval}
              onChange={(e) => setHigherInterval(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {higherIntervals.map(interval => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lower Timeframe Interval:
            </label>
            <select
              value={lowerInterval}
              onChange={(e) => setLowerInterval(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {lowerIntervals.map(interval => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dual Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Higher Timeframe Chart */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Higher Timeframe ({higherInterval.toUpperCase()})
            </h3>
          </div>
          <StockChart 
            ticker={normalizedTicker}
            interval={higherInterval}
            zones={higherZones}
            chartId={`higher-tf-${normalizedTicker}-${higherInterval}`}
          />
        </div>

        {/* Lower Timeframe Chart */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Lower Timeframe ({lowerInterval.toUpperCase()})
            </h3>
          </div>
          <StockChart 
            ticker={normalizedTicker}
            interval={lowerInterval}
            zones={lowerZones}
            chartId={`lower-tf-${normalizedTicker}-${lowerInterval}`}
          />
        </div>
      </div>

      {/* Zone Details Table */}
      {lowerZones.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Lower Timeframe Zone Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proximal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freshness</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Candles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                {lowerZones.map((zone, index) => (
                  <tr key={`${zone.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                    <td className="px-6 py-4 text-xs text-gray-900 font-mono">
                      {zone.zone_id}
                    </td>
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
                      {zone.base_candles}
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

export default DualTimeframeChart