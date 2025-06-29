import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { getOhlcData } from '../../services/api';

const ZoneChart = ({ 
  ticker,
  interval,
  zones = [],
  title = "Chart",
  height = 400
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const initChart = async () => {
      if (!ticker || !chartContainerRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`📊 Loading chart for ${ticker} (${interval})`);

        // Clean up existing chart
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }

        // Fetch data
        const normalizedTicker = ticker.replace('.NS', '');
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const rawData = await getOhlcData(normalizedTicker, interval, startDate, endDate);
        
        if (!isMounted) return;

        if (!rawData || rawData.length === 0) {
          throw new Error('No data available');
        }

        // Process data
        const processedData = rawData
          .map(item => {
            const date = new Date(item.Date);
            if (isNaN(date.getTime())) return null;
            
            return {
              time: date.toISOString().split('T')[0],
              open: parseFloat(item.Open),
              high: parseFloat(item.High),
              low: parseFloat(item.Low),
              close: parseFloat(item.Close),
            };
          })
          .filter(item => item && !isNaN(item.open))
          .sort((a, b) => new Date(a.time) - new Date(b.time));

        if (!isMounted) return;

        if (processedData.length === 0) {
          throw new Error('No valid data after processing');
        }

        setChartData(processedData);

        // Create chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#ffffff' },
            textColor: '#333333',
          },
          width: chartContainerRef.current.clientWidth,
          height: height,
          grid: {
            vertLines: { color: 'rgba(197, 203, 206, 0.3)' },
            horzLines: { color: 'rgba(197, 203, 206, 0.3)' },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: '#D1D4DC',
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

        candlestickSeries.setData(processedData);

        // Add zone lines
        zones.forEach((zone, index) => {
          const color = zone.pattern === 'RBR' ? '#26a69a' : '#ef5350';
          
          // Proximal line (solid)
          candlestickSeries.createPriceLine({
            price: parseFloat(zone.proximal_line),
            color: color,
            lineWidth: 2,
            lineStyle: 0, // solid
            axisLabelVisible: true,
            title: `${zone.pattern} Proximal`,
          });

          // Distal line (dashed)
          candlestickSeries.createPriceLine({
            price: parseFloat(zone.distal_line),
            color: color,
            lineWidth: 1,
            lineStyle: 1, // dashed
            axisLabelVisible: true,
            title: `${zone.pattern} Distal`,
          });
        });

        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
          if (chart && chartContainerRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        };

        window.addEventListener('resize', handleResize);
        chart._resizeHandler = handleResize;

        console.log(`✅ Chart created successfully for ${ticker}`);
        setIsLoading(false);

      } catch (error) {
        if (!isMounted) return;
        console.error('Chart error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initChart, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (chartRef.current) {
        if (chartRef.current._resizeHandler) {
          window.removeEventListener('resize', chartRef.current._resizeHandler);
        }
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [ticker, interval, zones, height]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div 
          className="flex items-center justify-center bg-gray-50 rounded-lg border"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading {ticker}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div 
          className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200"
          style={{ height: `${height}px` }}
        >
          <div className="text-center text-red-600">
            <p className="font-semibold mb-2">Error loading chart</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">
          {ticker} • {interval.toUpperCase()} • {chartData.length} candles
          {zones.length > 0 && ` • ${zones.length} zones`}
        </p>
      </div>
      
      <div 
        ref={chartContainerRef}
        className="w-full rounded-lg border bg-white"
        style={{ height: `${height}px` }}
      />
      
      {zones.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Zone Details:</h4>
          <div className="space-y-1">
            {zones.map((zone, index) => (
              <div key={index} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                <span className={`font-medium ${zone.pattern === 'RBR' ? 'text-green-700' : 'text-red-700'}`}>
                  {zone.pattern}
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
                <span className="text-gray-500">
                  Score: {zone.trade_score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneChart;