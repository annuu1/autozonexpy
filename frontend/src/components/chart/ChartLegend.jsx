// Chart legend component
import React from 'react';

const ChartLegend = ({ zones, chartData }) => {
  if (!zones || zones.length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Zone Legend:</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span>RBR Zones</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-0.5 bg-red-500"></div>
          <span>DBR Zones</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-0.5 border-t-2 border-gray-600"></div>
          <span>Proximal (Solid)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-0.5 border-t border-dashed border-gray-600"></div>
          <span>Distal (Dashed)</span>
        </div>
      </div>
      
      {/* Zone Details */}
      <div className="mt-3 space-y-1">
        {zones.map((zone, index) => (
          <div key={index} className="flex items-center justify-between text-xs bg-white/60 rounded px-2 py-1">
            <span className={`font-medium ${zone.pattern === 'RBR' ? 'text-green-700' : 'text-red-700'}`}>
              {zone.pattern} Zone {index + 1}
            </span>
            <span className="text-gray-600">
              P: {zone.proximal_line.toFixed(2)} | D: {zone.distal_line.toFixed(2)}
            </span>
            <span className={`font-medium ${
              zone.freshness === 3 ? 'text-green-600' : 
              zone.freshness === 1.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              F: {zone.freshness}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartLegend;