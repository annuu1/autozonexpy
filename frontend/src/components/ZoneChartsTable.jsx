import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { ChevronDown, ChevronUp, Maximize2, Minimize2, RefreshCw } from 'lucide-react'

// Import modular components
import Button from './ui/Button'
import Card from './ui/Card'
import Modal from './ui/Modal'
import CollapsibleSection from './ui/CollapsibleSection'
import ZoneFilters from './filters/ZoneFilters'
import ZoneTable from './tables/ZoneTable'
import DualTimeframeChart from './charts/DualTimeframeChart'

const ZoneChartsTable = ({ initialZones = [], initialSettings = null, onZonesUpdate }) => {
  const [zones, setZones] = useState(initialZones)
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [showCharts, setShowCharts] = useState(false)
  
  // UI state
  const [isTableCollapsed, setIsTableCollapsed] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    freshnessFilter: "all",
    sortBy: "timestamp",
    sortOrder: "desc",
    tickerFilter: "all",
    patternFilter: "all"
  })

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
      
      const allZones = Object.entries(rawZonesByTicker).flatMap(([ticker, zones]) =>
        zones.map((zone) => ({ ...zone, ticker }))
      )
      
      setZones(allZones)
      setSettings(payload)
      
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

  // Filter and sort zones
  const filteredZones = zones.filter(zone => {
    const freshnessMatch = filters.freshnessFilter === "all" || zone.freshness === parseFloat(filters.freshnessFilter)
    const tickerMatch = filters.tickerFilter === "all" || zone.ticker === filters.tickerFilter
    const patternMatch = filters.patternFilter === "all" || zone.pattern === filters.patternFilter
    return freshnessMatch && tickerMatch && patternMatch
  })

  const sortedZones = [...filteredZones].sort((a, b) => {
    let aValue, bValue
    
    switch (filters.sortBy) {
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
    
    if (filters.sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleViewCharts = (zone) => {
    setSelectedZone(zone)
    setShowCharts(true)
    setIsFullScreen(true)
  }

  const downloadCSV = () => {
    const csvHeader = [
      "Zone ID", "Ticker", "Proximal", "Distal", "Trade Score", "Pattern",
      "Start Timestamp", "End Timestamp", "Base Candles", "Freshness", "Coinciding Zones Count"
    ]

    const csvRows = sortedZones.map(zone => [
      zone.zone_id, zone.ticker, zone.proximal_line.toFixed(2), zone.distal_line.toFixed(2),
      zone.trade_score.toFixed(2), zone.pattern,
      new Date(zone.start_timestamp || zone.timestamp).toLocaleString(),
      new Date(zone.end_timestamp || zone.timestamp).toLocaleString(),
      zone.base_candles, zone.freshness, zone.coinciding_lower_zones?.length || 0
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
    <div className="space-y-4 h-full">
      {/* Header */}
      <Card>
        <Card.Content className="!p-4">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                    icon={isTableCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  >
                    {isTableCollapsed ? 'Show' : 'Hide'} Table
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchMultiZones()}
                    disabled={isLoading}
                    icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                  >
                    Refresh
                  </Button>
                </>
              )}
              
              <Button
                variant="primary"
                size="sm"
                onClick={() => fetchMultiZones()}
                disabled={isLoading}
                loading={isLoading}
              >
                {zones.length > 0 ? 'Load New' : 'Load Zones'}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50/80">
          <Card.Content className="!p-4">
            <p className="text-red-700 font-medium">Error:</p>
            <p className="text-red-600 text-sm">{error}</p>
          </Card.Content>
        </Card>
      )}

      {/* Filters */}
      {zones.length > 0 && (
        <ZoneFilters
          filters={filters}
          onFilterChange={setFilters}
          uniqueTickers={uniqueTickers}
          uniquePatterns={uniquePatterns}
          totalZones={zones.length}
          filteredCount={sortedZones.length}
          onDownloadCSV={downloadCSV}
          defaultCollapsed={true}
        />
      )}

      {/* Table */}
      {zones.length > 0 && (
        <ZoneTable
          zones={sortedZones}
          onViewCharts={handleViewCharts}
          isCollapsed={isTableCollapsed}
        />
      )}

      {/* Empty State */}
      {zones.length === 0 && !isLoading && (
        <Card>
          <Card.Content className="text-center p-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Zones Loaded</h3>
            <p className="text-gray-500 mb-6">
              Load demand zones to view interactive charts with marked levels.
            </p>
            <Button
              variant="primary"
              onClick={() => fetchMultiZones()}
            >
              Load Default Zones
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Full-Screen Charts Modal */}
      <Modal
        isOpen={showCharts && selectedZone}
        onClose={() => setShowCharts(false)}
        fullScreen={isFullScreen}
        className="!p-0"
      >
        {selectedZone && (
          <div className="h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedZone.ticker} - Demand Zone Charts
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedZone.pattern} • Score: {selectedZone.trade_score} • Freshness: {selectedZone.freshness}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  icon={isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                >
                  {isFullScreen ? 'Windowed' : 'Full Screen'}
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCharts(false)}
                className="!p-2"
              >
                ✕
              </Button>
            </div>

            {/* Chart Content - Full Height */}
            <div className="flex-1 overflow-auto p-4">
              <DualTimeframeChart 
                ticker={selectedZone.ticker}
                higherTimeframeZone={selectedZone}
                lowerTimeframeZones={selectedZone.coinciding_lower_zones || []}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ZoneChartsTable