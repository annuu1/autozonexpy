import { useState } from "react"

function DemandZoneTable({ zones }) {
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState("desc")
  const [freshnessFilter, setFreshnessFilter] = useState("all")
  const [selectedZone, setSelectedZone] = useState(null)

  if (!zones || zones.length === 0) {
    return (
      <div className="mt-8 text-center bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg">
        <p className="text-gray-500 text-lg">No demand zones found.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search parameters.</p>
      </div>
    )
  }

  // Filter zones by freshness
  const filteredZones = zones.filter(zone => 
    freshnessFilter === "all" || zone.freshness === parseFloat(freshnessFilter)
  )

  // Sort zones
  const sortedZones = [...filteredZones].sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case "timestamp":
        aValue = new Date(a.timestamp)
        bValue = new Date(b.timestamp)
        break
      case "score":
        aValue = a.trade_score
        bValue = b.trade_score
        break
      case "freshness":
        aValue = a.freshness
        bValue = b.freshness
        break
      case "proximal":
        aValue = a.proximal_line
        bValue = b.proximal_line
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

  const downloadCSV = () => {
    const csvHeader = [
      "Zone ID",
      "Proximal Line",
      "Distal Line",
      "Trade Score",
      "Pattern",
      "Start Timestamp",
      "End Timestamp",
      "Base Candles",
      "Freshness",
      "Coinciding Lower Zones Count"
    ]

    const csvRows = sortedZones.map(zone => [
      zone.zone_id,
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
    link.setAttribute("download", `single_demand_zones_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Enhanced Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters & Sorting</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Freshness:</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="timestamp">Timestamp</option>
              <option value="score">Trade Score</option>
              <option value="freshness">Freshness</option>
              <option value="proximal">Proximal Line</option>
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

      {/* Enhanced Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Zone ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Zone Range</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pattern</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Base</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Freshness</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lower Zones</th>
              </tr>
            </thead>
            <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
              {sortedZones.map((zone, index) => (
                <tr key={`${zone.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono text-xs">
                    {zone.zone_id}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(zone.timestamp).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(zone.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.base_candles}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getFreshnessColor(zone.freshness)}`}>
                      {zone.freshness}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {zone.coinciding_lower_zones && zone.coinciding_lower_zones.length > 0 ? (
                      <button
                        onClick={() => setSelectedZone(zone)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-150 font-medium"
                      >
                        📊 View ({zone.coinciding_lower_zones.length})
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Modal for Lower Zones */}
      {selectedZone && selectedZone.coinciding_lower_zones && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-5xl mx-4 border border-white/30 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Coinciding Lower Zones
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Zone ID: {selectedZone.zone_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-150"
              >
                ✕
              </button>
            </div>

            <div className="overflow-auto max-h-[60vh]">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/80 backdrop-blur-sm sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zone ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Range</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pattern</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Freshness</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                  {selectedZone.coinciding_lower_zones.map((lower, index) => (
                    <tr key={`${lower.zone_id}-${index}`} className="hover:bg-white/80 transition-colors duration-150">
                      <td className="px-4 py-3 text-xs text-gray-900 font-mono">{lower.zone_id}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <div>P: {lower.proximal_line.toFixed(2)}</div>
                          <div>D: {lower.distal_line.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${getScoreColor(lower.trade_score)}`}>
                          {lower.trade_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lower.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {lower.pattern}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${getFreshnessColor(lower.freshness)}`}>
                          {lower.freshness}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">
                        {new Date(lower.timestamp).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(lower.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DemandZoneTable