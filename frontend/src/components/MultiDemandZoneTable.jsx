"use client"
import { useState } from "react"

export default function MultiDemandZoneTable({ zones }) {
  const [freshnessFilter, setFreshnessFilter] = useState("all")

  if (!zones || Object.keys(zones).length === 0) {
    return <p className="mt-6 text-center text-gray-500">No demand zones found.</p>
  }

  const filteredZones = Object.entries(zones).reduce((acc, [ticker, zoneList]) => {
    acc[ticker] = zoneList.filter(zone => 
      freshnessFilter === "all" || zone.freshness === freshnessFilter
    )
    return acc
  }, {})

  const freshnessOptions = ["all", "Fresh", "Stale", "Tested"]

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-4">
        <label className="font-medium">Filter by Freshness:</label>
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

      {Object.entries(filteredZones).map(([ticker, zoneList]) => (
        <div key={ticker}>
          <h3 className="text-lg font-semibold mb-3">{ticker}</h3>
          {zoneList.length === 0 ? (
            <p className="text-gray-400">No zones with selected freshness.</p>
          ) : (
            <table className="min-w-full border divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Zone ID</th>
                  <th className="px-4 py-2">Proximal</th>
                  <th className="px-4 py-2">Distal</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Pattern</th>
                  <th className="px-4 py-2">Freshness</th>
                  <th className="px-4 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {zoneList.map(zone => (
                  <tr key={zone.zone_id} className="text-sm text-gray-800">
                    <td className="px-4 py-2">{zone.zone_id}</td>
                    <td className="px-4 py-2">{zone.proximal_line.toFixed(2)}</td>
                    <td className="px-4 py-2">{zone.distal_line.toFixed(2)}</td>
                    <td className="px-4 py-2">{zone.trade_score.toFixed(2)}</td>
                    <td className="px-4 py-2">{zone.pattern}</td>
                    <td className="px-4 py-2">{zone.freshness}</td>
                    <td className="px-4 py-2">{new Date(zone.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}
