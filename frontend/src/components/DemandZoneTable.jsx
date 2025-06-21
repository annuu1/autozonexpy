function DemandZoneTable({ zones }) {
  if (!zones || zones.length === 0) {
    return <p className="mt-6 text-gray-500 text-center">No demand zones found.</p>
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proximal Line</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distal Line</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Candles</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freshness</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coinciding Lower Zones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {zones.map((zone) => (
            <tr key={zone.zone_id}>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.zone_id}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.proximal_line.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.distal_line.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.trade_score.toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.pattern}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{new Date(zone.timestamp).toLocaleString()}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.base_candles}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{zone.freshness}</td>

              {/* New Column for Lower Zones */}
              <td className="px-6 py-4 text-sm text-gray-900">
                {zone.coinciding_lower_zones && zone.coinciding_lower_zones.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {zone.coinciding_lower_zones.map((lowerZone) => (
                      <li key={lowerZone.zone_id}>
                        <strong>{lowerZone.zone_id}</strong> <br />
                        Proximal: {lowerZone.proximal_line.toFixed(2)}, Distal: {lowerZone.distal_line.toFixed(2)} <br />
                        Time: {new Date(lowerZone.timestamp).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DemandZoneTable
