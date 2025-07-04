import React, { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import { getOhlcData } from '../../services/api'
import Card from '../ui/Card'
import Button from '../ui/Button'

const ChartContainer = ({ 
  ticker, 
  interval = '1d', 
  zones = [], 
  title = '', 
  height = 500,
  onIntervalChange = null 
}) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const priceLineRefs = useRef([]) // Track price lines for cleanup
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [currentInterval, setCurrentInterval] = useState(interval)
  const [chartData, setChartData] = useState([])
  const [currentStartDate, setCurrentStartDate] = useState(null)
  const [currentEndDate, setCurrentEndDate] = useState(null)

  const intervals = [
    { value: '3mo', label: 'Quarterly' },
    { value: '1mo', label: 'Monthly' },
    { value: '1wk', label: 'Weekly' },
    { value: '1d', label: 'Daily' },
    { value: '1h', label: 'Hourly' },
    { value: '30m', label: '30 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '5m', label: '5 Minutes' },
  ]

  // Get initial time range based on interval
  const getInitialTimeRange = (intervalValue) => {
    const endDate = new Date()
    let startDate = new Date()
    
    switch (intervalValue) {
      case '3mo':
        startDate.setFullYear(endDate.getFullYear() - 10) // 10 years for monthly
        break
      case '1mo':
        startDate.setFullYear(endDate.getFullYear() - 10) // 10 years for monthly
        break
      case '1wk':
        startDate.setFullYear(endDate.getFullYear() - 5) // 5 years for weekly
        break
      case '1d':
        startDate.setFullYear(endDate.getFullYear() - 1) // 1 year for daily
        break
      case '1h':
        startDate.setDate(endDate.getDate() - 30) // 30 days for hourly
        break
      case '30m':
        startDate.setDate(endDate.getDate() - 20) // 20 days for 30min
        break
      case '15m':
        startDate.setDate(endDate.getDate() - 15) // 15 days for 15min
        break
      case '5m':
        startDate.setDate(endDate.getDate() - 10) // 10 days for 5min
        break
      default:
        startDate.setFullYear(endDate.getFullYear() - 1) // Default 1 year
    }
    
    return { startDate, endDate }
  }

  // Get load more time range based on interval
  const getLoadMoreTimeRange = (intervalValue) => {
    switch (intervalValue) {
      case '3mo':
        return { years: 10, months: 0, days: 0 } // 10 more years
      case '1mo':
        return { years: 5, months: 0, days: 0 } // 5 more years
      case '1wk':
        return { years: 2, months: 0, days: 0 } // 2 more years
      case '1d':
        return { years: 1, months: 0, days: 0 } // 1 more year
      case '1h':
        return { years: 0, months: 1, days: 0 } // 1 more month
      case '30m':
        return { years: 0, months: 0, days: 20 } // 20 more days
      case '15m':
        return { years: 0, months: 0, days: 15 } // 15 more days
      case '5m':
        return { years: 0, months: 0, days: 10 } // 10 more days
      default:
        return { years: 1, months: 0, days: 0 }
    }
  }

  // Enhanced date parsing function to handle all possible formats
  const parseDate = (dateInput) => {
    if (!dateInput) {
      console.warn('Empty date input:', dateInput)
      return null
    }

    try {
      let date

      // Handle different input types
      if (typeof dateInput === 'number') {
        // Handle timestamp (both milliseconds and seconds)
        if (dateInput > 1e12) {
          // Milliseconds timestamp
          date = new Date(dateInput)
        } else {
          // Seconds timestamp
          date = new Date(dateInput * 1000)
        }
      } else if (typeof dateInput === 'string') {
        // Handle string dates
        const trimmedInput = dateInput.trim()
        
        // Try direct parsing first (handles ISO strings like '2025-06-25T04:45:00.000Z')
        date = new Date(trimmedInput)
        
        // If that fails, try parsing as timestamp
        if (isNaN(date.getTime())) {
          const timestamp = parseFloat(trimmedInput)
          if (!isNaN(timestamp)) {
            if (timestamp > 1e12) {
              date = new Date(timestamp)
            } else {
              date = new Date(timestamp * 1000)
            }
          }
        }
        
        // If still invalid, try other common formats
        if (isNaN(date.getTime())) {
          // Try YYYY-MM-DD format
          const dateMatch = trimmedInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
          if (dateMatch) {
            date = new Date(dateMatch[0])
          }
        }
      } else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        // Try to convert to string and parse
        date = new Date(String(dateInput))
      }

      // Final validation
      if (!date || isNaN(date.getTime())) {
        console.warn('Could not parse date:', dateInput, 'Type:', typeof dateInput)
        return null
      }

      return date
    } catch (error) {
      console.warn('Error parsing date:', dateInput, error)
      return null
    }
  }

  // Format date for chart (lightweight-charts expects YYYY-MM-DD or timestamp)
  const formatDateForChart = (dateInput, intervalValue) => {
    const date = parseDate(dateInput)
    if (!date) return null
    
    try {
      // For intraday intervals, use timestamp
      if (['1h', '30m', '15m', '5m'].includes(intervalValue)) {
        return Math.floor(date.getTime() / 1000) // Unix timestamp in seconds
      } else {
        // For daily and above, use YYYY-MM-DD format
        return date.toISOString().split('T')[0]
      }
    } catch (error) {
      console.warn('Error formatting date for chart:', dateInput, error)
      return null
    }
  }

  // Clear all existing price lines
  const clearPriceLines = () => {
    if (candlestickSeriesRef.current && priceLineRefs.current.length > 0) {
      priceLineRefs.current.forEach(priceLine => {
        try {
          candlestickSeriesRef.current.removePriceLine(priceLine)
        } catch (error) {
          console.warn('Error removing price line:', error)
        }
      })
      priceLineRefs.current = []
    }
  }

  // Clean up chart on unmount
  useEffect(() => {
    return () => {
      clearPriceLines()
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Remove existing chart
    if (chartRef.current) {
      clearPriceLines()
      chartRef.current.remove()
    }

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        width: chartContainerRef.current.clientWidth,
        height: height,
        grid: {
          vertLines: { color: '#e0e0e0' },
          horzLines: { color: '#e0e0e0' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: ['1h', '30m', '15m', '5m'].includes(currentInterval),
        },
        rightPriceScale: {
          borderColor: '#cccccc',
        },
        crosshair: {
          mode: 1,
        },
      })

      chartRef.current = chart

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      })

      candlestickSeriesRef.current = candlestickSeries

      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    } catch (error) {
      console.error('Error initializing chart:', error)
      setError('Failed to initialize chart')
    }
  }, [height, currentInterval])

  // Load chart data
  const loadChartData = async (startDate, endDate, isLoadMore = false) => {
    if (!ticker || !chartRef.current || !candlestickSeriesRef.current) return

    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setChartData([])
      clearPriceLines() // Clear existing price lines when loading new data
    }
    
    setError(null)

    try {
      const normalizedTicker = ticker.toUpperCase().endsWith('.NS') 
        ? ticker.toUpperCase() 
        : `${ticker.toUpperCase()}.NS`

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      console.log(`Loading ${isLoadMore ? 'more ' : ''}data for ${normalizedTicker}: ${startDateStr} to ${endDateStr}`)

      const candles = await getOhlcData(normalizedTicker, currentInterval, startDateStr, endDateStr)

      if (!candles || candles.length === 0) {
        if (!isLoadMore) {
          setError('No chart data available for the selected period')
        }
        return
      }

      console.log('Raw candles data sample:', candles.slice(0, 3)) // Log first 3 items for debugging

      const processedCandles = []
      let validCount = 0
      let invalidCount = 0

      candles.forEach((item, index) => {
        try {
          // Handle different possible date field names
          const dateField = item.Date || item.Datetime || item.date || item.datetime || item.timestamp
          
          if (!dateField) {
            console.warn(`No date field found in candle at index ${index}:`, Object.keys(item))
            invalidCount++
            return
          }

          const time = formatDateForChart(dateField, currentInterval)
          const open = parseFloat(item.Open || item.open || 0)
          const high = parseFloat(item.High || item.high || 0)
          const low = parseFloat(item.Low || item.low || 0)
          const close = parseFloat(item.Close || item.close || 0)

          // Validate all values
          if (time === null || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
            console.warn(`Invalid candle data at index ${index}:`, {
              dateField,
              time,
              open,
              high,
              low,
              close,
              originalItem: item
            })
            invalidCount++
            return
          }

          // Additional validation: ensure high >= low and high >= open, close
          if (high < low || high < Math.max(open, close) || low > Math.min(open, close)) {
            console.warn(`Invalid OHLC values at index ${index}:`, { open, high, low, close })
            invalidCount++
            return
          }

          processedCandles.push({
            time,
            open,
            high,
            low,
            close,
          })
          validCount++
        } catch (error) {
          console.warn(`Error processing candle at index ${index}:`, item, error)
          invalidCount++
        }
      })

      console.log(`Processed ${validCount} valid candles, ${invalidCount} invalid candles`)

      if (processedCandles.length === 0) {
        if (!isLoadMore) {
          setError('No valid chart data could be processed')
        }
        return
      }

      console.log('Sample processed candles:', processedCandles.slice(0, 3))

      let newChartData
      if (isLoadMore && chartData.length > 0) {
        // Merge with existing data, avoiding duplicates
        const existingTimes = new Set(chartData.map(item => item.time))
        const newCandles = processedCandles.filter(item => !existingTimes.has(item.time))
        newChartData = [...newCandles, ...chartData].sort((a, b) => {
          // Handle both timestamp and date string sorting
          const aTime = typeof a.time === 'number' ? a.time : new Date(a.time).getTime()
          const bTime = typeof b.time === 'number' ? b.time : new Date(b.time).getTime()
          return aTime - bTime
        })
      } else {
        newChartData = processedCandles.sort((a, b) => {
          const aTime = typeof a.time === 'number' ? a.time : new Date(a.time).getTime()
          const bTime = typeof b.time === 'number' ? b.time : new Date(b.time).getTime()
          return aTime - bTime
        })
      }

      setChartData(newChartData)
      candlestickSeriesRef.current.setData(newChartData)

      // Update current date range
      if (!isLoadMore) {
        setCurrentStartDate(startDate)
        setCurrentEndDate(endDate)
      } else {
        setCurrentStartDate(startDate)
      }

      // Add zones after data is loaded
      if (zones && zones.length > 0) {
        addZoneLines(zones)
      }

      if (!isLoadMore) {
        chartRef.current.timeScale().fitContent()
      }
    } catch (error) {
      console.error('Failed to load chart data:', error)
      setError(error.message || 'Failed to load chart data')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Initial load when ticker or interval changes
  useEffect(() => {
    if (ticker && currentInterval) {
      const { startDate, endDate } = getInitialTimeRange(currentInterval)
      loadChartData(startDate, endDate, false)
    }
  }, [ticker, currentInterval])

  // Update zones when zones prop changes (but only if we have chart data)
  useEffect(() => {
    if (zones && zones.length > 0 && candlestickSeriesRef.current && chartData.length > 0) {
      // Clear existing lines first
      clearPriceLines()
      // Add new zone lines
      addZoneLines(zones)
    }
  }, [zones])

  const addZoneLines = (zonesToAdd) => {
    if (!candlestickSeriesRef.current || !zonesToAdd || zonesToAdd.length === 0) return

    // Clear existing price lines before adding new ones
    clearPriceLines()

    zonesToAdd.forEach((zone, index) => {
      try {
        const colors = [
          { proximal: '#00796B', distal: '#004D40' },
          { proximal: '#1976D2', distal: '#0D47A1' },
          { proximal: '#7B1FA2', distal: '#4A148C' },
          { proximal: '#F57C00', distal: '#E65100' },
          { proximal: '#C62828', distal: '#B71C1C' },
        ]
        
        const colorSet = colors[index % colors.length]
        
        if (zone.proximal_line && typeof zone.proximal_line === 'number') {
          const proximalLine = candlestickSeriesRef.current.createPriceLine({
            price: zone.proximal_line,
            color: colorSet.proximal,
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `${zone.pattern || 'Zone'} Proximal (${zone.proximal_line.toFixed(2)})`,
          })
          priceLineRefs.current.push(proximalLine)
        }

        if (zone.distal_line && typeof zone.distal_line === 'number') {
          const distalLine = candlestickSeriesRef.current.createPriceLine({
            price: zone.distal_line,
            color: colorSet.distal,
            lineWidth: 2,
            lineStyle: 1,
            axisLabelVisible: true,
            title: `${zone.pattern || 'Zone'} Distal (${zone.distal_line.toFixed(2)})`,
          })
          priceLineRefs.current.push(distalLine)
        }

        if (zone.coinciding_lower_zones && Array.isArray(zone.coinciding_lower_zones) && zone.coinciding_lower_zones.length > 0) {
          zone.coinciding_lower_zones.forEach((lowerZone, lowerIndex) => {
            try {
              const lowerColorSet = {
                proximal: `rgba(${76 + lowerIndex * 30}, ${175 + lowerIndex * 20}, ${80 + lowerIndex * 25}, 0.7)`,
                distal: `rgba(${56 + lowerIndex * 25}, ${142 + lowerIndex * 15}, ${60 + lowerIndex * 20}, 0.7)`
              }

              if (lowerZone.proximal_line && typeof lowerZone.proximal_line === 'number') {
                const ltfProximalLine = candlestickSeriesRef.current.createPriceLine({
                  price: lowerZone.proximal_line,
                  color: lowerColorSet.proximal,
                  lineWidth: 1,
                  lineStyle: 2,
                  axisLabelVisible: false,
                  title: `LTF ${lowerZone.pattern || 'Zone'} P (${lowerZone.proximal_line.toFixed(2)})`,
                })
                priceLineRefs.current.push(ltfProximalLine)
              }

              if (lowerZone.distal_line && typeof lowerZone.distal_line === 'number') {
                const ltfDistalLine = candlestickSeriesRef.current.createPriceLine({
                  price: lowerZone.distal_line,
                  color: lowerColorSet.distal,
                  lineWidth: 1,
                  lineStyle: 3,
                  axisLabelVisible: false,
                  title: `LTF ${lowerZone.pattern || 'Zone'} D (${lowerZone.distal_line.toFixed(2)})`,
                })
                priceLineRefs.current.push(ltfDistalLine)
              }
            } catch (lowerZoneError) {
              console.warn('Error adding lower zone line:', lowerZoneError)
            }
          })
        }
      } catch (zoneError) {
        console.warn('Error adding zone lines for zone:', zone, zoneError)
      }
    })

    console.log(`Added ${priceLineRefs.current.length} price lines to chart`)
  }

  const handleIntervalChange = (newInterval) => {
    setCurrentInterval(newInterval)
    if (onIntervalChange) {
      onIntervalChange(newInterval)
    }
  }

  const handleLoadMore = () => {
    if (!currentStartDate || isLoadingMore) return

    const loadMoreRange = getLoadMoreTimeRange(currentInterval)
    const newStartDate = new Date(currentStartDate)
    
    newStartDate.setFullYear(newStartDate.getFullYear() - loadMoreRange.years)
    newStartDate.setMonth(newStartDate.getMonth() - loadMoreRange.months)
    newStartDate.setDate(newStartDate.getDate() - loadMoreRange.days)

    loadChartData(newStartDate, currentStartDate, true)
  }

  const getDataInfo = () => {
    if (!currentStartDate || !currentEndDate) return ''
    
    const start = currentStartDate.toLocaleDateString()
    const end = currentEndDate.toLocaleDateString()
    const candleCount = chartData.length
    
    return `${candleCount} candles (${start} - ${end})`
  }

  return (
    <Card className="h-full">
      <Card.Header className="!p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {title || `${ticker} Chart`}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
              {zones.length > 0 && (
                <span>
                  {zones.length} zone{zones.length !== 1 ? 's' : ''} • 
                  {zones.reduce((total, zone) => total + (zone.coinciding_lower_zones?.length || 0), 0)} LTF zones
                </span>
              )}
              {chartData.length > 0 && (
                <span className="text-blue-600">
                  {getDataInfo()}
                </span>
              )}
              {priceLineRefs.current.length > 0 && (
                <span className="text-green-600">
                  {priceLineRefs.current.length} lines
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Interval:</label>
            <select
              value={currentInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            >
              {intervals.map(int => (
                <option key={int.value} value={int.value}>
                  {int.label}
                </option>
              ))}
            </select>
            
            {chartData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                loading={isLoadingMore}
                className="!px-3"
              >
                Load More
              </Button>
            )}
          </div>
        </div>
      </Card.Header>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              <span className="text-gray-700 font-medium">Loading chart data...</span>
            </div>
          </div>
        )}

        {isLoadingMore && (
          <div className="absolute top-4 left-4 bg-blue-100/90 backdrop-blur-sm text-blue-700 px-3 py-2 rounded-lg shadow-md z-10">
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
              <span className="text-sm font-medium">Loading more data...</span>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 bg-red-50/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center p-6">
              <p className="text-red-700 font-medium mb-2">Error loading chart:</p>
              <p className="text-red-600 text-sm">{error}</p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (ticker && currentInterval) {
                    const { startDate, endDate } = getInitialTimeRange(currentInterval)
                    loadChartData(startDate, endDate, false)
                  }
                }}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
      </div>
    </Card>
  )
}

export default ChartContainer