import React from 'react'
import { Filter, Download } from 'lucide-react'
import Button from '../ui/Button'
import CollapsibleSection from '../ui/CollapsibleSection'

const ZoneFilters = ({
  filters,
  onFilterChange,
  uniqueTickers = [],
  uniquePatterns = [],
  totalZones = 0,
  filteredCount = 0,
  onDownloadCSV,
  defaultCollapsed = true
}) => {
  const {
    tickerFilter,
    freshnessFilter,
    patternFilter,
    sortBy,
    sortOrder
  } = filters

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <CollapsibleSection
      title="Filters & Controls"
      icon={<Filter size={16} />}
      defaultCollapsed={defaultCollapsed}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ticker:</label>
          <select
            value={tickerFilter}
            onChange={(e) => handleFilterChange('tickerFilter', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All ({uniqueTickers.length})</option>
            {uniqueTickers.map(ticker => (
              <option key={ticker} value={ticker}>{ticker}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Freshness:</label>
          <select
            value={freshnessFilter}
            onChange={(e) => handleFilterChange('freshnessFilter', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="3">Fresh (3.0)</option>
            <option value="1.5">Tested (1.5)</option>
            <option value="0">Breached (0.0)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pattern:</label>
          <select
            value={patternFilter}
            onChange={(e) => handleFilterChange('patternFilter', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All</option>
            {uniquePatterns.map(pattern => (
              <option key={pattern} value={pattern}>{pattern}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="timestamp">Date</option>
            <option value="score">Score</option>
            <option value="freshness">Freshness</option>
            <option value="ticker">Ticker</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order:</label>
          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={onDownloadCSV}
              icon={<Download size={14} />}
              className="!px-3"
            >
              CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Showing {filteredCount} of {totalZones} zones
      </div>
    </CollapsibleSection>
  )
}

export default ZoneFilters