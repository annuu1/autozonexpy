function DemandZoneTable({ zones }) {
  if (!zones || zones.length === 0) {
    return <p className="mt-6 text-gray-500 text-center">No demand zones found.</p>
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proximal Line</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distal Line</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Candles</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freshness</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {zones.map((zone) => (
            <tr key={zone.zone_id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.zone_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.proximal_line.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.distal_line.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.trade_score.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.pattern}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(zone.timestamp).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.base_candles}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{zone.freshness}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DemandZoneTable