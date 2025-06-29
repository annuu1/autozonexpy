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

  useEffect(() => {
    console.log('Chart component mounted with ticker:', ticker, 'chartId:', chartId);

    if (!chartContainerRef.current) return;

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

    // Fetch and set candlestick data
    const fetchAndSetData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const startDate = "2024-01-01";
        const endDate = new Date().toISOString().split('T')[0];
        
        const ohlcData = await getOhlcData(ticker, interval, startDate, endDate);
        console.log('Raw backend OHLC data for', chartId, ':', ohlcData);
        
        if (!Array.isArray(ohlcData) || ohlcData.length === 0) {
          throw new Error('No OHLC data returned from backend');
        }

        const processedData = ohlcData.map((data) => {
          let time;
          if (typeof data.Date === 'string') {
            time = data.Date.slice(0, 10); // 'YYYY-MM-DD'
          } else {
            time = undefined;
          }
          return {
            time,
            open: data.Open,
            high: data.High,
            low: data.Low,
            close: data.Close,
          };
        }).filter(d => 
          d.time && 
          typeof d.open === 'number' && 
          typeof d.high === 'number' && 
          typeof d.low === 'number' && 
          typeof d.close === 'number'
        );

        if (processedData.length === 0) {
          throw new Error('No valid chart data after processing');
        }

        candlestickSeries.setData(processedData);
        setChartData(processedData);
        console.log('Mapped chart data for', chartId, ':', processedData);

        // Add zone lines if zones are provided
        if (zones && zones.length > 0) {
          zones.forEach((zone, index) => {
            const baseColor = zone.pattern === 'RBR' ? '#26a69a' : '#ef5350';
            const freshnessAlpha = zone.freshness === 3 ? '1' : zone.freshness === 1.5 ? '0.7' : '0.4';
            
            // Add proximal line (solid)
            candlestickSeries.createPriceLine({
              price: zone.proximal_line,
              color: baseColor,
              lineWidth: 2,
              lineStyle: 0, // solid
              axisLabelVisible: true,
              title: `${zone.pattern} Proximal (F:${zone.freshness})`,
            });

            // Add distal line (dashed)
            candlestickSeries.createPriceLine({
              price: zone.distal_line,
              color: baseColor,
              lineWidth: 1,
              lineStyle: 1, // dashed
              axisLabelVisible: true,
              title: `${zone.pattern} Distal`,
            });
          });
        }

        // Fit content
        chart.timeScale().fitContent();
        
      } catch (error) {
        console.error('Error fetching OHLC data for', chartId, ':', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

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
      console.log('Cleaning up chart', chartId);
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [ticker, interval, zones, chartId]);

  if (isLoading) {
    return (
      <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chart data for {ticker}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-[500px] bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error loading chart</p>
          <p className="text-sm">{error}</p>
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
      </div>
      <div ref={chartContainerRef} className="w-full h-[500px] rounded-lg overflow-hidden" />
      
      {/* Zone Legend */}
      {zones && zones.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Zone Legend:</h4>
          <div className="flex flex-wrap gap-2 text-xs">
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
        </div>
      )}
    </div>
  );
};

export default StockChart;