import React from 'react'
import Card from '../ui/Card'

const ZoneDetails = ({ zones = [] }) => {
  if (zones.length === 0) return null

  return (
    <Card>
      <Card.Header className="!p-4">
        <h4 className="text-sm font-semibold text-gray-800">Zone Details:</h4>
      </Card.Header>
      <Card.Content className="!p-4 !pt-0">
        <div className="space-y-2">
          {zones.map((zone, index) => (
            <div key={index} className="text-xs bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  zone.pattern === 'RBR' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {zone.pattern}
                </span>
                <span className="text-gray-700">
                  P: <span className="font-medium">{zone.proximal_line?.toFixed(2)}</span>
                </span>
                <span className="text-gray-700">
                  D: <span className="font-medium">{zone.distal_line?.toFixed(2)}</span>
                </span>
                <span className="text-gray-700">
                  Score: <span className="font-medium">{zone.trade_score?.toFixed(1)}</span>
                </span>
                <span className={`font-medium ${
                  zone.freshness === 3 ? 'text-green-600' : 
                  zone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  F: {zone.freshness}
                </span>
                {zone.coinciding_lower_zones?.length > 0 && (
                  <span className="text-blue-600 font-medium">
                    +{zone.coinciding_lower_zones.length} LTF zones
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  )
}

export default ZoneDetails