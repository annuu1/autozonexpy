import { useState } from "react"

function CoincidingZoneTable({ zones }) {
  const [selectedZone, setSelectedZone] = useState(null)

  const openModal = (zone) => {
    setSelectedZone(zone)
  }

  const closeModal = () => {
    setSelectedZone(null)
  }

  if (!zones || zones.length === 0) {
    return <p className="mt-6 text-gray-500 text-center">No demand zones found.</p>
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Freshness</th>
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
                <td className="px-6 py-4 text-sm text-gray-900">{zone.freshness}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.proximal_line.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.distal_line.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.trade_score.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{zone.pattern}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(zone.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {zone.coinciding_lower_zones?.length > 0 ? (
                    <button
                      onClick={() => openModal(zone)}
                      className="text-blue-600 hover:underline"
                    >
                      View ({zone.coinciding_lower_zones.length})
                    </button>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Coinciding Zones for {selectedZone.zone_id}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-black text-xl"
              >
                &times;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Freshness</th>
                    <th className="px-4 py-2">Proximal</th>
                    <th className="px-4 py-2">Distal</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="px-4 py-2">Pattern</th>
                    <th className="px-4 py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedZone.coinciding_lower_zones.map((lower) => (
                    <tr key={lower.zone_id}>
                      <td className="px-4 py-2">{lower.freshness}</td>
                      <td className="px-4 py-2">{lower.proximal_line.toFixed(2)}</td>
                      <td className="px-4 py-2">{lower.distal_line.toFixed(2)}</td>
                      <td className="px-4 py-2">{lower.trade_score.toFixed(2)}</td>
                      <td className="px-4 py-2">{lower.pattern}</td>
                      <td className="px-4 py-2">
                        {new Date(lower.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CoincidingZoneTable
  