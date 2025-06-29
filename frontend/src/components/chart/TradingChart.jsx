import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { getOhlcData } from '../../services/api';

const TradingChart = ({ 
  ticker = "ABB", 
  interval = '1d', 
  zones = [], 
  chartId = "default",
  height = 500 
}) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Clean up chart on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Main chart creation effect
  useEffect(() => {
    const createTradingChart = async () => {
      // Validate inputs
      if (!ticker) {
        setError('No ticker provided');
        setIsLoading(false);
        return;
      }

      if (!chartContainerRef.current) {
        console.log('Chart container not ready, retrying...');
        setTimeout(createTradingChart, 100);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`🚀 Creating chart for ${ticker} (${interval})`);

        // Clean up existing chart
        if (chartInstanceRef.current) {
          chartInstanceRef.current.remove();
          chartInstanceRef.current = null;
        }

        // Prepare ticker for API call
        const normalizedTicker = ticker.toUpperCase().replace('.NS', '');
        
        // Fetch OHLC data
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        console.log(`📊 Fetching data for ${normalizedTicker}: ${startDate} to ${endDate}`);
        
        const rawData = await getOhlcData(normalizedTicker.toLowerCase(), interval, startDate, endDate);
        
        if (!rawData || rawData.length === 0) {
          throw new Error(`No data available for ${ticker}`);
        }

        console.log(`📈 Received ${rawData.length} data points`);

        // Process data for lightweight-charts
        const processedData = rawData
          .map((item, index) => {
            try {
              const date = new Date(item.Date);
              if (isNaN(date.getTime())) {
                console.warn(`Invalid date at index ${index}:`, item.Date);
                return null;
              }

              const open = parseFloat(item.Open);
              const high = parseFloat(item.High);
              const low = parseFloat(item.Low);
              const close = parseFloat(item.Close);

              if ([open, high, low, close].some(isNaN)) {
                console.warn(`Invalid price data at index ${index}:`, item);
                return null;
              }

              return {
                time: date.toISOString().split('T')[0],
                open,
                high,
                low,
                close,
              };
            } catch (error) {
              console.warn(`Error processing item ${index}:`, error);
              return null;
            }
          })
          .filter(Boolean)
          .sort((a, b) => new Date(a.time) - new Date(b.time));

        if (processedData.length === 0) {
          throw new Error('No valid data after processing');
        }

        console.log(`✨ Processed ${processedData.length} valid data points`);
        setChartData(processedData);

        // Get container dimensions
        const containerWidth = chartContainerRef.current.clientWidth || 800;
        const containerHeight = height;

        console.log(`📐 Container dimensions: ${containerWidth}x${containerHeight}`);

        // Create chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#ffffff' },
            textColor: '#333333',
          },
          width: containerWidth,
          height: containerHeight,
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
            vertLine: { color: '#758696', width: 1, style: 2 },
            horzLine: { color: '#758696', width: 1, style: 2 },
          },
        });

        chartInstanceRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        // Set data
        candlestickSeries.setData(processedData);

        // Add zone lines
        if (zones && zones.length > 0) {
          console.log(`🎯 Adding ${zones.length} zone lines`);
          
          zones.forEach((zone, index) => {
            try {
              const color = zone.pattern === 'RBR' ? '#26a69a' : '#ef5350';
              
              // Proximal line (solid)
              candlestickSeries.createPriceLine({
                price: parseFloat(zone.proximal_line),
                color: color,
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: true,
                title: `${zone.pattern} Proximal`,
              });

              // Distal line (dashed)
              candlestickSeries.createPriceLine({
                price: parseFloat(zone.distal_line),
                color: color,
                lineWidth: 1,
                lineStyle: 1,
                axisLabelVisible: true,
                title: `${zone.pattern} Distal`,
              });

              console.log(`✅ Added zone ${index + 1}: ${zone.pattern}`);
            } catch (error) {
              console.error(`❌ Error adding zone ${index}:`, error);
            }
          });
        }

        // Fit content
        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
          if (chart && chartContainerRef.current) {
            const newWidth = chartContainerRef.current.clientWidth;
            if (newWidth > 0) {
              chart.applyOptions({ width: newWidth });
            }
          }
        };

        window.addEventListener('resize', handleResize);

        // Store cleanup function
        chart._cleanup = () => {
          window.removeEventListener('resize', handleResize);
        };

        console.log(`🎉 Chart created successfully for ${ticker}`);
        setIsLoading(false);

      } catch (error) {
        console.error(`❌ Error creating chart:`, error);
        setError(error.message || 'Failed to create chart');
        setIsLoading(false);
      }
    };

    // Start chart creation
    createTradingChart();

  }, [ticker, interval, zones, height, chartId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {ticker} - {interval.toUpperCase()} Chart
          </h3>
          <p className="text-sm text-gray-600">Loading chart data...</p>
        </div>
        <div 
          className="w-full rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {ticker} data...</p>
            <p className="text-sm text-gray-500">{interval} interval</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {ticker} - {interval.toUpperCase()} Chart
          </h3>
          <p className="text-sm text-red-600">Error loading chart</p>
        </div>
        <div 
          className="w-full rounded-lg border border-red-200 flex items-center justify-center bg-red-50"
          style={{ height: `${height}px` }}
        >
          <div className="text-center text-red-600">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-lg font-semibold mb-2">Chart Error</p>
            <p className="text-sm mb-4 max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="relative w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {ticker} - {interval.toUpperCase()} Chart
        </h3>
        <p className="text-sm text-gray-600">
          {chartData.length} data points
          {zones && zones.length > 0 && ` • ${zones.length} zones`}
        </p>
        {chartData.length > 0 && (
          <p className="text-xs text-gray-500">
            {chartData[0]?.time} to {chartData[chartData.length - 1]?.time}
          </p>
        )}
      </div>
      
      {/* Chart container */}
      <div 
        ref={chartContainerRef}
        className="w-full rounded-lg border border-gray-200 bg-white"
        style={{ height: `${height}px`, minWidth: '300px' }}
      />
      
      {/* Zone legend */}
      {zones && zones.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Zones:</h4>
          <div className="space-y-1">
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

export default TradingChart;