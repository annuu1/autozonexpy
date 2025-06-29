import React, { useState, useEffect } from 'react'
import axios from 'axios'
import DualTimeframeChart from './DualTimeframeChart'

const ZoneChartsTable = ({ initialZones = [], initialSettings = null, onZonesUpdate }) => {
  const [zones, setZones] = useState(initialZones)
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [showCharts, setShowCharts] = useState(false)
  
  // Filter states
  const [freshnessFilter, setFreshnessFilter] = useState("all")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState("desc")
  const [tickerFilter, setTickerFilter] = useState("all")
  const [patternFilter, setPatternFilter] = useState("all")

  // Update zones when initialZones prop changes
  useEffect(() => {
    if (initialZones && initialZones.length > 0) {
      setZones(initialZones)
      setError(null)
    }
  }, [initialZones])

  // Update settings when initialSettings prop changes
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings)
    }
  }, [initialSettings])

  const fetchMultiZones = async (customSettings = null) => {
    setIsLoading(true)
    setError(null)

    try {
      // Use provided settings or default settings
      const payload = customSettings || settings || {
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        higher_interval: '1wk',
        lower_interval: '1d',
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

      const response = await axios.post('http://127.0.0.1:8000/multi-demand-zones', payload)
      const rawZonesByTicker = response.data
      
      // Transform the data structure to match the expected format
      const allZones = Object.entries(rawZonesByTicker).flatMap(([ticker, zones]) =>
        zones.map((zone) => ({ ...zone, ticker }))
      )
      
      setZones(allZones)
      setSettings(payload)
      
      // Update parent component if callback provided
      if (onZonesUpdate) {
        onZonesUpdate(allZones)
      }
      
      console.log('Fetched multi zones:', allZones)
    } catch (error) {
      console.error('Error fetching zones:', error)
      setError(error.response?.data?.detail || 'Failed to fetch demand zones')
      setZones([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get unique values for filters
  const uniqueTickers = [...new Set(zones.map(zone => zone.ticker))].sort()
  const uniquePatterns = [...new Set(zones.map(zone => zone.pattern))].sort()

  // Filter zones
  const filteredZones = zones.filter(zone => {
    const freshnessMatch = freshnessFilter === "all" || zone.freshness === parseFloat(freshnessFilter)
    const tickerMatch = tickerFilter === "all" || zone.ticker === tickerFilter
    const patternMatch = patternFilter === "all" || zone.pattern === patternFilter
    return freshnessMatch && tickerMatch && patternMatch
  })

  // Sort zones
  const sortedZones = [...filteredZones].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case "timestamp":
        aValue = new Date(a.end_timestamp || a.timestamp)
        bValue = new Date(b.end_timestamp || b.timestamp)
        break
      case "score":
        aValue = a.trade_score
        bValue = b.trade_score
        break
      case "freshness":
        aValue = a.freshness
        bValue = b.freshness
        break
      case "ticker":
        aValue = a.ticker
        bValue = b.ticker
        break
      default:
        return 0
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getScoreColor = (score) => {
    if (score >= 5) return "text-green-600 font-semibold"
    if (score >= 3) return "text-yellow-600 font-medium"
    return "text-red-600"
  }

  const getFreshnessColor = (freshness) => {
    if (freshness === 3) return "text-green-600 font-semibold"
    if (freshness === 1.5) return "text-yellow-600 font-medium"
    return "text-red-600"
  }

  const handleViewCharts = (zone) => {
    setSelectedZone(zone)
    setShowCharts(true)
  }

  const downloadCSV = () => {
    const csvHeader = [
      "Zone ID",
      "Ticker",
      "Proximal",
      "Distal",
      "Trade Score",
      "Pattern",
      "Start Timestamp",
      "End Timestamp",
      "Base Candles",
      "Freshness",
      "Coinciding Zones Count"
    ]

    const csvRows = sortedZones.map(zone => [
      zone.zone_id,
      zone.ticker,
      zone.proximal_line.toFixed(2),
      zone.distal_line.toFixed(2),
      zone.trade_score.toFixed(2),
      zone.pattern,
      new Date(zone.start_timestamp || zone.timestamp).toLocaleString(),
      new Date(zone.end_timestamp || zone.timestamp).toLocaleString(),
      zone.base_candles,
      zone.freshness,
      zone.coinciding_lower_zones?.length || 0
    ].join(","))

    const csvContent = [csvHeader.join(","), ...csvRows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `zone_charts_table_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header and Load Button */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Zone Charts Table</h2>
            <p className="text-sm text-gray-600 mt-1">
              {zones.length > 0 && settings ? (
                <>
                  Loaded {zones.length} zones using settings from Multi Ticker form
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {settings.higher_interval} → {settings.lower_interval}
                  </span>
                </>
              ) : (
                "Load demand zones from all tickers and view their charts with marked proximal/distal lines."
              )}
            </p>
          </div>
          <div className="flex gap-3">
            {zones.length > 0 && (
              <button
                onClick={() => fetchMultiZones()}
                disabled={isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
              >
                🔄 Refresh
              </button>
            )}
            <button
              onClick={() => fetchMultiZones()}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Loading Zones...
                </span>
              ) : zones.length > 0 ? (
                'Load New Zones'
              ) : (
                'Load All Demand Zones'
              )}
            </button>
          </div>
        </div>
        
        {/* Settings Display */}
        {settings && (
          <div className="mt-4 p-4 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Settings:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-700">
              <div>
                <span className="font-medium">Date Range:</span>
                <div>{settings.start_date} to {settings.end_date}</div>
              </div>
              <div>
                <span className="font-medium">Timeframes:</span>
                <div>{settings.higher_interval} → {settings.lower_interval}</div>
              </div>
              <div>
                <span className="font-medium">Body %:</span>
                <div>HTF: {settings.leginMinBodyPercent}% | LTF: {settings.ltf_leginMinBodyPercent}%</div>
              </div>
              <div>
                <span className="font-medium">Movement %:</span>
                <div>HTF: {settings.minLeginMovement}% | LTF: {settings.ltf_minLeginMovement}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-4 border border-red-200">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Data Source Info */}
      {zones.length > 0 && (
        <div className="bg-emerald-50/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 font-medium">
                📊 Data Source: {initialZones.length > 0 ? 'Multi Ticker Form' : 'Direct Load'}
              </p>
              <p className="text-emerald-600 text-sm">
                {initialZones.length > 0 
                  ? 'Zones automatically loaded from Multi Ticker form with your custom settings'
                  : 'Zones loaded directly with default settings'
                }
              </p>
            </div>
            {initialZones.length === 0 && (
              <div className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                💡 Tip: Use Multi Ticker form for custom settings
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      {zones.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters & Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ticker:</label>
              <select
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Tickers ({uniqueTickers.length})</option>
                {uniqueTickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Freshness:</label>
              <select
                value={freshnessFilter}
                onChange={(e) => setFreshnessFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Freshness</option>
                <option value="3">Fresh (3.0)</option>
                <option value="1.5">Tested (1.5)</option>
                <option value="0">Breached (0.0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pattern:</label>
              <select
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Patterns</option>
                {uniquePatterns.map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="timestamp">Timestamp</option>
                <option value="score">Trade Score</option>
                <option value="freshness">Freshness</option>
                <option value="ticker">Ticker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {sortedZones.length} of {zones.length} zones
            </div>
            <button
              onClick={downloadCSV}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              📊 Download CSV
            </button>
          </div>
        </div>
      )}

      {/* Zones Table */}
      {zones.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Zone Range</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pattern</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Freshness</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lower Zones</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                {sortedZones.map((zone, index) => (
                  <tr key={`${zone.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{zone.ticker}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">P: {zone.proximal_line.toFixed(2)}</div>
                        <div className="text-gray-600">D: {zone.distal_line.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getScoreColor(zone.trade_score)}`}>
                        {zone.trade_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        zone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.pattern}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getFreshnessColor(zone.freshness)}`}>
                        {zone.freshness}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(zone.end_timestamp || zone.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {zone.coinciding_lower_zones?.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {zone.coinciding_lower_zones.length} zones
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewCharts(zone)}
                        className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors duration-150 font-medium text-xs"
                      >
                        📈 View Charts
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {zones.length === 0 && !isLoading && (
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-lg">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Zones Loaded</h3>
          <p className="text-gray-500 mb-6">
            Load demand zones to view charts with marked proximal and distal lines.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Use the Multi Ticker form first to set custom parameters, 
              then navigate here to see the zones with charts.
            </p>
            <button
              onClick={() => fetchMultiZones()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
            >
              Load Default Zones
            </button>
          </div>
        </div>
      )}

      {/* Charts Modal */}
      {showCharts && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-7xl mx-4 border border-white/30 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedZone.ticker} - Demand Zone Charts
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Zone: {selectedZone.pattern} | Score: {selectedZone.trade_score} | Freshness: {selectedZone.freshness}
                </p>
              </div>
              <button
                onClick={() => setShowCharts(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-150"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[80vh]">
              <DualTimeframeChart 
                ticker={selectedZone.ticker}
                higherTimeframeZone={selectedZone}
                lowerTimeframeZones={selectedZone.coinciding_lower_zones || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoneChartsTable