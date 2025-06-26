"use client"
import { useState } from "react"

export default function CoincidingZoneTable({ zones }) {
  const [freshnessFilter, setFreshnessFilter] = useState("all")
  const [sortByTime, setSortByTime] = useState("desc")
  const [selectedLowerZones, setSelectedLowerZones] = useState(null)

  if (!zones || zones.length === 0) {
    return <p className="mt-6 text-center text-gray-500">No demand zones found.</p>
  }

  const filteredZones = zones.filter(zone =>
    freshnessFilter === "all" || zone.freshness === parseFloat(freshnessFilter)
  )

  const sortedZones = filteredZones.sort((a, b) =>
    sortByTime === "asc"
      ? new Date(a.end_timestamp) - new Date(b.end_timestamp)
      : new Date(b.end_timestamp) - new Date(a.end_timestamp)
  )

  const freshnessOptions = ["all", "0", "1.5", "3.0"]

  const downloadCSV = () => {
    const csvHeader = [
      "Id",
      "Ticker",
      "Proximal",
      "Distal",
      "Trade Score",
      "Pattern",
      "Timestamp",
      "time",
      "Base Candles",
      "Freshness",
      "No. of Coinciding Zones",
      "Coinciding Freshness"
    ]

    const csvRows = sortedZones.map(zone => {
      const numCoinciding = zone.coinciding_lower_zones?.length || 0
      const coincidingFreshness = zone.coinciding_lower_zones
        ? zone.coinciding_lower_zones.map(z => z.freshness).join(", ")
        : ""

      return [
        zone.zone_id,
        zone.ticker,
        zone.proximal_line.toFixed(2),
        zone.distal_line.toFixed(2),
        zone.trade_score.toFixed(2),
        zone.pattern,
        new Date(zone.end_timestamp).toLocaleString(),
        zone.base_candles,
        zone.freshness,
        numCoinciding,
        `"${coincidingFreshness}"`
      ].join(",")
    })

    const csvContent = [csvHeader.join(","), ...csvRows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "demand_zones.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="font-medium mr-2">Filter by Freshness:</label>
          <select
            value={freshnessFilter}
            onChange={(e) => setFreshnessFilter(e.target.value)}
            className="border p-2 rounded"
          >
            {freshnessOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-medium mr-2">Sort by Time:</label>
          <select
            value={sortByTime}
            onChange={(e) => setSortByTime(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        <button
          onClick={downloadCSV}
          className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proximal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Candles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freshness</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coinciding Zones</th>
            </tr>
          </thead>
          <tbody className="bg-white bg-opacity-60 divide-y divide-gray-200">
            {sortedZones.map((zone) => (
              <tr key={zone.timestamp + zone.proximal_line}>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.ticker}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.proximal_line.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.distal_line.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.trade_score.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.pattern}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{new Date(zone.end_timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.base_candles}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.freshness}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {zone.coinciding_lower_zones?.length > 0 ? (
                    <button
                      onClick={() => setSelectedLowerZones(zone.coinciding_lower_zones)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View ({zone.coinciding_lower_zones.length})
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

      {/* Modal */}
      {selectedLowerZones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-[2px]">
          <div className="bg-white bg-opacity-85 backdrop-blur-lg rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-gray-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Coinciding Lower Zones
              </h2>
              <button
                onClick={() => setSelectedLowerZones(null)}
                className="text-gray-600 hover:text-black text-xl"
              >
                ✕
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 bg-opacity-70">
                <tr>
                  <th className="px-4 py-2 text-left">Freshness</th>
                  <th className="px-4 py-2 text-left">Proximal</th>
                  <th className="px-4 py-2 text-left">Distal</th>
                  <th className="px-4 py-2 text-left">Trade Score</th>
                  <th className="px-4 py-2 text-left">Pattern</th>
                  <th className="px-4 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white bg-opacity-50 divide-y divide-gray-200">
                {selectedLowerZones.map(lower => (
                  <tr key={lower.zone_id}>
                    <td className="px-4 py-2">{lower.freshness}</td>
                    <td className="px-4 py-2">{lower.proximal_line.toFixed(2)}</td>
                    <td className="px-4 py-2">{lower.distal_line.toFixed(2)}</td>
                    <td className="px-4 py-2">{lower.trade_score.toFixed(2)}</td>
                    <td className="px-4 py-2">{lower.pattern}</td>
                    <td className="px-4 py-2">{new Date(lower.end_timestamp).toLocaleString()}</td>
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
