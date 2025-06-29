// Loading and error state components for charts
import React from 'react';

export const ChartInitializing = ({ chartId }) => (
  <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse rounded-full h-12 w-12 bg-indigo-200 mx-auto mb-4"></div>
      <p className="text-gray-600">Initializing chart container...</p>
      <p className="text-sm text-gray-500 mt-1">Chart ID: {chartId}</p>
    </div>
  </div>
);

export const ChartLoading = ({ ticker, interval, chartId }) => (
  <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading chart data for {ticker}...</p>
      <p className="text-sm text-gray-500 mt-1">Interval: {interval}</p>
      <p className="text-xs text-gray-400 mt-1">Chart ID: {chartId}</p>
    </div>
  </div>
);

export const ChartError = ({ error, ticker, interval, chartId, onRetry }) => (
  <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
    <div className="text-center text-red-600">
      <p className="text-lg font-semibold mb-2">Error loading chart</p>
      <p className="text-sm mb-2">{error}</p>
      <div className="text-xs text-gray-500 space-y-1">
        <p>Ticker: {ticker}</p>
        <p>Interval: {interval}</p>
        <p>Chart ID: {chartId}</p>
      </div>
      <button 
        onClick={onRetry} 
        className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);