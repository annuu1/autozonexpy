import React, { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import { getOhlcData } from '../../services/api'

const ZoneChart = ({ 
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Clean up chart on unmount
  useEffect(() => {
    return () => {
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
          secondsVisible: false,
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
  }, [height])

  // Load chart data and zones
  useEffect(() => {
    const loadChartData = async () => {
      if (!ticker || !chartRef.current || !candlestickSeriesRef.current) return

      setIsLoading(true)
      setError(null)

      try {
        const endDate = new Date()
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        const endDateStr = endDate.toISOString().split('T')[0]
        const startDateStr = startDate.toISOString().split('T')[0]

        const normalizedTicker = ticker.toUpperCase().endsWith('.NS') 
          ? ticker.toUpperCase() 
          : `${ticker.toUpperCase()}.NS`

        const candles = await getOhlcData(normalizedTicker, interval, startDateStr, endDateStr)

        const processedCandles = (candles || []).map(item => ({
          time: new Date(item.Date).toISOString().split('T')[0],
          open: parseFloat(item.Open),
          high: parseFloat(item.High),
          low: parseFloat(item.Low),
          close: parseFloat(item.Close),
        })).filter(item => !isNaN(item.open))

        if (processedCandles.length === 0) {
          setError('No chart data available for the selected period')
          return
        }

        candlestickSeriesRef.current.setData(processedCandles)

        // Add zone lines
        if (zones && zones.length > 0) {
          zones.forEach((zone, index) => {
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
                candlestickSeriesRef.current.createPriceLine({
                  price: zone.proximal_line,
                  color: colorSet.proximal,
                  lineWidth: 2,
                  lineStyle: 0,
                  axisLabelVisible: true,
                  title: `${zone.pattern || 'Zone'} P (${zone.proximal_line.toFixed(2)})`,
                })
              }

              if (zone.distal_line && typeof zone.distal_line === 'number') {
                candlestickSeriesRef.current.createPriceLine({
                  price: zone.distal_line,
                  color: colorSet.distal,
                  lineWidth: 2,
                  lineStyle: 1,
                  axisLabelVisible: true,
                  title: `${zone.pattern || 'Zone'} D (${zone.distal_line.toFixed(2)})`,
                })
              }

              // Add lower timeframe zones if present
              if (zone.coinciding_lower_zones && Array.isArray(zone.coinciding_lower_zones)) {
                zone.coinciding_lower_zones.forEach((lowerZone, lowerIndex) => {
                  try {
                    const lowerColorSet = {
                      proximal: `rgba(${76 + lowerIndex * 30}, ${175 + lowerIndex * 20}, ${80 + lowerIndex * 25}, 0.7)`,
                      distal: `rgba(${56 + lowerIndex * 25}, ${142 + lowerIndex * 15}, ${60 + lowerIndex * 20}, 0.7)`
                    }

                    if (lowerZone.proximal_line && typeof lowerZone.proximal_line === 'number') {
                      candlestickSeriesRef.current.createPriceLine({
                        price: lowerZone.proximal_line,
                        color: lowerColorSet.proximal,
                        lineWidth: 1,
                        lineStyle: 2,
                        axisLabelVisible: false,
                        title: `LTF ${lowerZone.pattern || 'Zone'} P (${lowerZone.proximal_line.toFixed(2)})`,
                      })
                    }

                    if (lowerZone.distal_line && typeof lowerZone.distal_line === 'number') {
                      candlestickSeriesRef.current.createPriceLine({
                        price: lowerZone.distal_line,
                        color: lowerColorSet.distal,
                        lineWidth: 1,
                        lineStyle: 3,
                        axisLabelVisible: false,
                        title: `LTF ${lowerZone.pattern || 'Zone'} D (${lowerZone.distal_line.toFixed(2)})`,
                      })
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
        }

        chartRef.current.timeScale().fitContent()
      } catch (error) {
        console.error('Failed to load chart data:', error)
        setError(error.message || 'Failed to load chart data')
      } finally {
        setIsLoading(false)
      }
    }

    loadChartData()
  }, [ticker, interval, zones])

  return (
    <div className="relative w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-gray-800">
          {title || `${ticker} Chart`}
        </h3>
        {zones.length > 0 && (
          <p className="text-sm text-gray-600">
            {zones.length} zone{zones.length !== 1 ? 's' : ''} displayed
          </p>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
            </svg>
            <span className="text-gray-700 font-medium">Loading chart data...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 bg-red-50/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="text-center p-6">
            <p className="text-red-700 font-medium mb-2">Error loading chart:</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  )
}

export default ZoneChart