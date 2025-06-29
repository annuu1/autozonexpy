import React from 'react'
import Card from '../ui/Card'

const ZoneLegend = ({ zones = [] }) => {
  if (zones.length === 0) return null

  return (
    <Card className="mb-4">
      <Card.Content className="!p-3">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Zone Legend:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-teal-600"></div>
            <span className="text-gray-700">Higher Timeframe Proximal (Solid)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-teal-800 border-dashed border-t"></div>
            <span className="text-gray-700">Higher Timeframe Distal (Dashed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 opacity-70"></div>
            <span className="text-gray-700">Lower Timeframe Proximal (Dotted)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-700 opacity-70"></div>
            <span className="text-gray-700">Lower Timeframe Distal (Sparse Dotted)</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

export default ZoneLegend