import React from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'

const ZoneTable = ({ zones, onViewCharts, isCollapsed = false }) => {
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

  if (isCollapsed) {
    return (
      <Card>
        <Card.Content className="!p-4">
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
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card>
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
            {zones.map((zone, index) => (
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
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onViewCharts(zone)}
                    className="!text-xs !px-3 !py-1"
                  >
                    📈 Charts
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default ZoneTable