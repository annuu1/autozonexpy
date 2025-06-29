import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { getOhlcData } from '../services/api';

const StockChart = ({ ticker = "ABB", interval = '1d', selectedZone = null, zones = [], chartId = "default" }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Check if component is mounted and container is ready
  useEffect(() => {
    const checkContainer = () => {
      if (chartContainerRef.current && chartContainerRef.current.offsetWidth > 0) {
        console.log('Chart container is ready:', chartContainerRef.current.offsetWidth, 'x', chartContainerRef.current.offsetHeight);
        setIsMounted(true);
      } else {
        console.log('Chart container not ready, retrying...');
        setTimeout(checkContainer, 100);
      }
    };

    checkContainer();
  }, []);

  useEffect(() => {
    console.log('StockChart useEffect triggered:', { ticker, interval, chartId, zones: zones?.length, isMounted });

    if (!isMounted || !chartContainerRef.current) {
      console.log('Chart container not ready yet, isMounted:', isMounted);
      return;
    }

    if (!ticker) {
      console.log('No ticker provided');
      setError('No ticker provided');
      setIsLoading(false);
      return;
    }

    // Clean up any existing chart
    if (chartRef.current) {
      console.log('Cleaning up existing chart');
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    }

    // Normalize ticker - remove .NS suffix for API call since backend adds it
    let normalizedTicker = ticker.toUpperCase();
    if (normalizedTicker.endsWith('.NS')) {
      normalizedTicker = normalizedTicker.replace('.NS', '');
    }

    console.log('Creating chart for ticker:', normalizedTicker, 'interval:', interval);

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'rgba(255, 255, 255, 0.9)' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#D1D4DC',
      },
      rightPriceScale: {
        borderColor: '#D1D4DC',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 2,
        },
      },
    });
    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeriesRef.current = candlestickSeries;

    console.log('Chart and candlestick series created successfully');

    // Fetch and set candlestick data
    const fetchAndSetData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Set date range - 2 years of data
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log(`Making API call for ${normalizedTicker} with interval ${interval} from ${startDate} to ${endDate}`);
        console.log(`Expected URL: http://localhost:8000/ohlc-data?ticker=${normalizedTicker.toLowerCase()}&start_date=${startDate}&end_date=${endDate}&interval=${interval}`);
        
        const ohlcData = await getOhlcData(normalizedTicker.toLowerCase(), interval, startDate, endDate);
        console.log('Raw OHLC data received:', ohlcData?.length, 'records');
        
        if (ohlcData && ohlcData.length > 0) {
          console.log('First few records:', ohlcData.slice(0, 3));
        }
        
        if (!Array.isArray(ohlcData) || ohlcData.length === 0) {
          throw new Error(`No OHLC data returned for ${normalizedTicker}`);
        }

        // Process the data to match lightweight-charts format
        const processedData = ohlcData.map((data, index) => {
          try {
            // Handle different date formats
            let time;
            if (typeof data.Date === 'string') {
              // Parse the ISO date string and convert to YYYY-MM-DD format
              const date = new Date(data.Date);
              if (isNaN(date.getTime())) {
                console.warn(`Invalid date at index ${index}:`, data.Date);
                return null;
              }
              time = date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
            } else {
              console.warn(`Invalid date format at index ${index}:`, data.Date);
              return null;
            }

            // Ensure all price values are valid numbers
            const open = parseFloat(data.Open);
            const high = parseFloat(data.High);
            const low = parseFloat(data.Low);
            const close = parseFloat(data.Close);

            if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
              console.warn(`Invalid price data at index ${index}:`, data);
              return null;
            }

            return {
              time,
              open,
              high,
              low,
              close,
            };
          } catch (error) {
            console.warn(`Error processing data at index ${index}:`, error, data);
            return null;
          }
        }).filter(d => d !== null);

        if (processedData.length === 0) {
          throw new Error('No valid chart data after processing');
        }

        // Sort data by time to ensure proper order
        processedData.sort((a, b) => new Date(a.time) - new Date(b.time));

        console.log(`Processed ${processedData.length} valid data points for ${chartId}`);
        console.log('Sample processed data:', processedData.slice(0, 3));
        
        // Set the candlestick data
        candlestickSeries.setData(processedData);
        setChartData(processedData);

        // Add zone lines if zones are provided
        if (zones && zones.length > 0) {
          console.log(`Adding ${zones.length} zone lines for ${chartId}`);
          zones.forEach((zone, index) => {
            try {
              const baseColor = zone.pattern === 'RBR' ? '#26a69a' : '#ef5350';
              
              // Add proximal line (solid)
              const proximalLine = candlestickSeries.createPriceLine({
                price: parseFloat(zone.proximal_line),
                color: baseColor,
                lineWidth: 2,
                lineStyle: 0, // solid
                axisLabelVisible: true,
                title: `${zone.pattern} Proximal (F:${zone.freshness})`,
              });

              // Add distal line (dashed)
              const distalLine = candlestickSeries.createPriceLine({
                price: parseFloat(zone.distal_line),
                color: baseColor,
                lineWidth: 1,
                lineStyle: 1, // dashed
                axisLabelVisible: true,
                title: `${zone.pattern} Distal`,
              });

              console.log(`Added zone ${index + 1}: ${zone.pattern} P:${zone.proximal_line} D:${zone.distal_line}`);
            } catch (error) {
              console.error(`Error adding zone ${index}:`, error, zone);
            }
          });
        }

        // Fit content to show all data
        chart.timeScale().fitContent();
        
        console.log(`Chart ${chartId} setup complete with ${processedData.length} data points and ${zones?.length || 0} zones`);
        
      } catch (error) {
        console.error(`Error in fetchAndSetData for ${chartId}:`, error);
        setError(error.message || 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    // Start fetching data
    fetchAndSetData();

    // Resize handler
    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      console.log(`Cleaning up chart ${chartId}`);
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [ticker, interval, zones, chartId, isMounted]);

  if (!isMounted) {
    return (
      <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-indigo-200 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing chart container...</p>
          <p className="text-sm text-gray-500 mt-1">Chart ID: {chartId}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart data for {ticker}...</p>
          <p className="text-sm text-gray-500 mt-1">Interval: {interval}</p>
          <p className="text-xs text-gray-400 mt-1">Chart ID: {chartId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {ticker} - {interval.toUpperCase()} Chart
        </h3>
        <p className="text-sm text-gray-600">
          {chartData.length} data points loaded
          {zones && zones.length > 0 && ` • ${zones.length} zones displayed`}
        </p>
        {chartData.length > 0 && (
          <p className="text-xs text-gray-500">
            Data range: {chartData[0]?.time} to {chartData[chartData.length - 1]?.time}
          </p>
        )}
      </div>
      <div ref={chartContainerRef} className="w-full h-[500px] rounded-lg overflow-hidden" />
      
      {/* Zone Legend */}
      {zones && zones.length > 0 && (
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
      )}
    </div>
  );
};

export default StockChart;