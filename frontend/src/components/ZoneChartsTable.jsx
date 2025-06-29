import React, { useState, useEffect } from 'react'
import axios from 'axios'
import DualTimeframeChart from './DualTimeframeChart'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Filter, Download, RefreshCw } from 'lucide-react'

const ZoneChartsTable = ({ initialZones = [], initialSettings = null, onZonesUpdate }) => {
  const [zones, setZones] = useState(initialZones)
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [showCharts, setShowCharts] = useState(false)
  
  // Collapse states
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true)
  const [isTableCollapsed, setIsTableCollapsed] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  
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
    setIsFullScreen(true) // Auto-expand to full screen when viewing charts
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
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">Zone Charts Table</h2>
            <p className="text-sm text-gray-600 mt-1">
              {zones.length > 0 && settings ? (
                <>
                  {zones.length} zones loaded • {settings.higher_interval} → {settings.lower_interval}
                </>
              ) : (
                "Load demand zones and view interactive charts"
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {zones.length > 0 && (
              <>
                <button
                  onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <Filter size={16} />
                  Filters
                  {isFiltersCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
                
                <button
                  onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  {isTableCollapsed ? 'Show' : 'Hide'} Table
                  {isTableCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
                
                <button
                  onClick={() => fetchMultiZones()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors text-sm"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </>
            )}
            
            <button
              onClick={() => fetchMultiZones()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors font-medium text-sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Loading...
                </>
              ) : zones.length > 0 ? (
                'Load New'
              ) : (
                'Load Zones'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm rounded-xl p-4 border border-red-200">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Collapsible Filters */}
      {zones.length > 0 && !isFiltersCollapsed && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticker:</label>
              <select
                value={tickerFilter}
                onChange={(e) => setTickerFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All ({uniqueTickers.length})</option>
                {uniqueTickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Freshness:</label>
              <select
                value={freshnessFilter}
                onChange={(e) => setFreshnessFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="3">Fresh (3.0)</option>
                <option value="1.5">Tested (1.5)</option>
                <option value="0">Breached (0.0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pattern:</label>
              <select
                value={patternFilter}
                onChange={(e) => setPatternFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {uniquePatterns.map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="timestamp">Date</option>
                <option value="score">Score</option>
                <option value="freshness">Freshness</option>
                <option value="ticker">Ticker</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order:</label>
              <div className="flex gap-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="desc">↓</option>
                  <option value="asc">↑</option>
                </select>
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <Download size={14} />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing {sortedZones.length} of {zones.length} zones
          </div>
        </div>
      )}

      {/* Collapsible Table */}
      {zones.length > 0 && !isTableCollapsed && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Range</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pattern</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fresh</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">LTF</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                {sortedZones.map((zone, index) => (
                  <tr key={`${zone.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{zone.ticker}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <div>P: {zone.proximal_line.toFixed(2)}</div>
                        <div className="text-gray-600">D: {zone.distal_line.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm ${getScoreColor(zone.trade_score)}`}>
                        {zone.trade_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        zone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.pattern}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getFreshnessColor(zone.freshness)}`}>
                        {zone.freshness}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                      {new Date(zone.end_timestamp || zone.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {zone.coinciding_lower_zones?.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {zone.coinciding_lower_zones.length}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleViewCharts(zone)}
                        className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors duration-150 font-medium text-xs"
                      >
                        📈 Charts
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compact Zone Summary */}
      {zones.length > 0 && isTableCollapsed && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{zones.length}</div>
              <div className="text-sm text-blue-700">Total Zones</div>
            </div>
            <div className="bg-green-50/80 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {zones.filter(z => z.freshness === 3).length}
              </div>
              <div className="text-sm text-green-700">Fresh Zones</div>
            </div>
            <div className="bg-yellow-50/80 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {zones.filter(z => z.freshness === 1.5).length}
              </div>
              <div className="text-sm text-yellow-700">Tested Zones</div>
            </div>
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {zones.reduce((total, zone) => total + (zone.coinciding_lower_zones?.length || 0), 0)}
              </div>
              <div className="text-sm text-purple-700">LTF Zones</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {zones.length === 0 && !isLoading && (
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-12 shadow-lg">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Zones Loaded</h3>
          <p className="text-gray-500 mb-6">
            Load demand zones to view interactive charts with marked levels.
          </p>
          <button
            onClick={() => fetchMultiZones()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
          >
            Load Default Zones
          </button>
        </div>
      )}

      {/* Full-Screen Charts Modal */}
      {showCharts && selectedZone && (
        <div className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-sm ${isFullScreen ? 'p-2' : 'flex items-center justify-center p-4'}`}>
          <div className={`bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 overflow-hidden ${
            isFullScreen ? 'w-full h-full' : 'w-full max-w-7xl max-h-[90vh]'
          }`}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedZone.ticker} - Demand Zone Charts
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedZone.pattern} • Score: {selectedZone.trade_score} • Freshness: {selectedZone.freshness}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    {isFullScreen ? 'Windowed' : 'Full Screen'}
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShowCharts(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-150"
              >
                ✕
              </button>
            </div>

            {/* Chart Content */}
            <div className={`overflow-auto ${isFullScreen ? 'h-[calc(100vh-80px)]' : 'max-h-[80vh]'} p-4`}>
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