function CoincidingZoneTable({ zones }) {
  if (!zones || zones.length === 0) {
    return <p className="mt-6 text-gray-500 text-center">No demand zones found.</p>
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proximal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coinciding Zones</th>
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
              <td className="px-6 py-4 text-sm text-gray-900">
                {new Date(zone.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {zone.coinciding_lower_zones?.length > 0 ? (
                  <>
                    <span className="font-semibold">{zone.coinciding_lower_zones.length}</span> zone(s)
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      {zone.coinciding_lower_zones.map((lower) => (
                        <li key={lower.zone_id}>
                          <strong>{lower.zone_id}</strong> <br />
                          Proximal: {lower.proximal_line.toFixed(2)}, Distal: {lower.distal_line.toFixed(2)} <br />
                          {new Date(lower.timestamp).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CoincidingZoneTable;