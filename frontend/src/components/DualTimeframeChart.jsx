import React, { useState } from 'react'
import ZoneChart from './chart/ZoneChart'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'

const DualTimeframeChart = ({ ticker, higherTimeframeZone, lowerTimeframeZones = [] }) => {
  const [higherInterval, setHigherInterval] = useState('1wk')
  const [lowerInterval, setLowerInterval] = useState('1d')
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true)
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(true)

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

  if (!ticker || !higherTimeframeZone) {
    return (
      <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg">
        <p className="text-gray-500 text-lg">No zone data provided for chart display.</p>
        <p className="text-gray-400 text-sm mt-2">Please select a zone to view its charts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Compact Zone Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{normalizedTicker}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                higherTimeframeZone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {higherTimeframeZone.pattern}
              </span>
              <span>P: {higherTimeframeZone.proximal_line.toFixed(2)}</span>
              <span>D: {higherTimeframeZone.distal_line.toFixed(2)}</span>
              <span>Score: {higherTimeframeZone.trade_score.toFixed(1)}</span>
              <span className={`font-medium ${
                higherTimeframeZone.freshness === 3 ? 'text-green-600' : 
                higherTimeframeZone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                F: {higherTimeframeZone.freshness}
              </span>
              {lowerZones.length > 0 && (
                <span className="text-blue-600 font-medium">+{lowerZones.length} LTF zones</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              <Settings size={16} />
              Controls
              {isControlsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            
            <button
              onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Details
              {isDetailsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Collapsible Controls */}
        {!isControlsCollapsed && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Higher Timeframe:
                </label>
                <select
                  value={higherInterval}
                  onChange={(e) => setHigherInterval(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                  Lower Timeframe:
                </label>
                <select
                  value={lowerInterval}
                  onChange={(e) => setLowerInterval(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
        )}
      </div>

      {/* Dual Charts - Full Width */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Higher Timeframe Chart */}
        <ZoneChart 
          ticker={normalizedTicker}
          interval={higherInterval}
          zones={higherZones}
          title={`Higher Timeframe (${higherInterval.toUpperCase()})`}
          height={500}
          onIntervalChange={setHigherInterval}
        />

        {/* Lower Timeframe Chart */}
        <ZoneChart 
          ticker={normalizedTicker}
          interval={lowerInterval}
          zones={lowerZones}
          title={`Lower Timeframe (${lowerInterval.toUpperCase()})`}
          height={500}
          onIntervalChange={setLowerInterval}
        />
      </div>

      {/* Collapsible Zone Details */}
      {!isDetailsCollapsed && lowerZones.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800">Lower Timeframe Zone Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proximal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freshness</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                {lowerZones.map((zone, index) => (
                  <tr key={`${zone.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        zone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.pattern}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {zone.proximal_line.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {zone.distal_line.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        zone.trade_score >= 5 ? 'text-green-600' : 
                        zone.trade_score >= 3 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {zone.trade_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`font-medium ${
                        zone.freshness === 3 ? 'text-green-600' : 
                        zone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {zone.freshness}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {zone.base_candles}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
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