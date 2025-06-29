// Loading and error state components for charts
import React from 'react';

export const ChartInitializing = ({ chartId }) => (
  <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse rounded-full h-12 w-12 bg-indigo-200 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Initializing chart container...</p>
      <p className="text-sm text-gray-500 mt-1">Chart ID: {chartId}</p>
      <div className="mt-3 text-xs text-gray-400">
        <p>⏳ Waiting for container to mount...</p>
        <p>This should only take a moment</p>
      </div>
    </div>
  </div>
);

export const ChartLoading = ({ ticker, interval, chartId }) => (
  <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading chart data for {ticker}...</p>
      <p className="text-sm text-gray-500 mt-1">Interval: {interval}</p>
      <p className="text-xs text-gray-400 mt-1">Chart ID: {chartId}</p>
      <div className="mt-3 text-xs text-gray-400">
        <p>📊 Fetching OHLC data from API...</p>
        <p>🎯 Processing zones and indicators...</p>
      </div>
    </div>
  </div>
);

export const ChartError = ({ error, ticker, interval, chartId, onRetry }) => (
  <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
    <div className="text-center text-red-600">
      <div className="text-4xl mb-4">❌</div>
      <p className="text-lg font-semibold mb-2">Error loading chart</p>
      <p className="text-sm mb-4 max-w-md mx-auto">{error}</p>
      <div className="text-xs text-gray-500 space-y-1 mb-4">
        <p><strong>Ticker:</strong> {ticker}</p>
        <p><strong>Interval:</strong> {interval}</p>
        <p><strong>Chart ID:</strong> {chartId}</p>
      </div>
      <div className="space-x-2">
        <button 
          onClick={onRetry} 
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          🔄 Retry
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          🔄 Reload Page
        </button>
      </div>
    </div>
  </div>
);