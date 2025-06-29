import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { getOhlcData } from '../../services/api';
import { processOhlcData, normalizeTicker, getDateRange } from '../../utils/chartDataProcessor';
import { addZoneLines } from './ChartZoneLines';
import { DEFAULT_CHART_CONFIG, CANDLESTICK_SERIES_CONFIG } from './ChartConfig';
import { ChartInitializing, ChartLoading, ChartError } from './ChartLoadingStates';
import ChartLegend from './ChartLegend';

const StockChart = ({ ticker = "ABB", interval = '1d', zones = [], chartId = "default" }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Debug logging
  console.log('StockChart render state:', {
    ticker,
    interval,
    chartId,
    isMounted,
    zonesCount: zones?.length || 0,
    hasContainer: !!containerRef.current,
    containerDimensions: containerRef.current ? {
      offsetWidth: containerRef.current.offsetWidth,
      offsetHeight: containerRef.current.offsetHeight,
      clientWidth: containerRef.current.clientWidth,
      clientHeight: containerRef.current.clientHeight
    } : null
  });

  // Check container mounting with a more reliable approach
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 30;
    let timeoutId;

    const checkContainer = () => {
      console.log(`🔍 Checking container (attempt ${retryCount + 1}/${maxRetries})`);
      
      if (!containerRef.current) {
        console.log('📦 Container ref not available yet');
        if (retryCount < maxRetries) {
          retryCount++;
          timeoutId = setTimeout(checkContainer, 100);
        } else {
          console.error('❌ Container ref never became available after', maxRetries, 'attempts');
          setError('Chart container failed to mount');
        }
        return;
      }

      // Check if container has dimensions
      const width = containerRef.current.offsetWidth || containerRef.current.clientWidth;
      const height = containerRef.current.offsetHeight || containerRef.current.clientHeight;
      
      console.log('📏 Container dimensions:', { width, height });

      if (width > 0) {
        console.log('✅ Container is ready with dimensions:', { width, height });
        setIsMounted(true);
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`⏳ Container has no width yet, retrying...`);
        timeoutId = setTimeout(checkContainer, 100);
      } else {
        console.log('🔧 Force mounting with default dimensions');
        setIsMounted(true); // Force mount even without proper dimensions
      }
    };

    // Start checking after a small delay to ensure DOM is ready
    timeoutId = setTimeout(checkContainer, 50);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    // Early return conditions
    if (!ticker) {
      console.log('❌ No ticker provided');
      setError('No ticker provided');
      setIsLoading(false);
      return;
    }

    if (!isMounted) {
      console.log('⏳ Container not mounted yet, waiting...');
      return;
    }

    if (!containerRef.current) {
      console.log('❌ Container ref not available');
      setError('Chart container not available');
      setIsLoading(false);
      return;
    }

    console.log('🚀 Starting chart creation for:', { ticker, interval, chartId });

    // Clean up any existing chart
    if (chartRef.current) {
      console.log('🧹 Cleaning up existing chart');
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    }

    const normalizedTicker = normalizeTicker(ticker);
    console.log('📊 Normalized ticker:', normalizedTicker);

    // Get container dimensions
    const containerWidth = containerRef.current.offsetWidth || containerRef.current.clientWidth || 800;
    const containerHeight = 500; // Fixed height

    // Create chart instance
    const chartConfig = {
      ...DEFAULT_CHART_CONFIG,
      width: containerWidth,
      height: containerHeight,
    };

    console.log('⚙️ Creating chart with config:', chartConfig);

    try {
      const chart = createChart(containerRef.current, chartConfig);
      chartRef.current = chart;

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries(CANDLESTICK_SERIES_CONFIG);
      candlestickSeriesRef.current = candlestickSeries;

      console.log('✅ Chart and candlestick series created successfully');

      // Fetch and set candlestick data
      const fetchAndSetData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const { startDate, endDate } = getDateRange(2);
          
          console.log(`🔄 Making API call for ${normalizedTicker}`);
          console.log(`📅 Date range: ${startDate} to ${endDate}`);
          console.log(`⏱️ Interval: ${interval}`);
          console.log(`🌐 Expected URL: http://localhost:8000/ohlc-data?ticker=${normalizedTicker.toLowerCase()}&start_date=${startDate}&end_date=${endDate}&interval=${interval}`);
          
          const ohlcData = await getOhlcData(normalizedTicker.toLowerCase(), interval, startDate, endDate);
          console.log('📈 Raw OHLC data received:', ohlcData?.length, 'records');
          
          if (ohlcData && ohlcData.length > 0) {
            console.log('📋 First few records:', ohlcData.slice(0, 3));
          }
          
          const processedData = processOhlcData(ohlcData);
          console.log(`✨ Processed ${processedData.length} valid data points for ${chartId}`);
          console.log('📊 Sample processed data:', processedData.slice(0, 3));
          
          // Set the candlestick data
          candlestickSeries.setData(processedData);
          setChartData(processedData);

          // Add zone lines if zones are provided
          if (zones && zones.length > 0) {
            console.log(`🎯 Adding ${zones.length} zone lines for ${chartId}`);
            addZoneLines(candlestickSeries, zones);
          }

          // Fit content to show all data
          chart.timeScale().fitContent();
          
          console.log(`🎉 Chart ${chartId} setup complete!`);
          console.log(`📊 Data points: ${processedData.length}`);
          console.log(`🎯 Zones: ${zones?.length || 0}`);
          
        } catch (error) {
          console.error(`❌ Error in fetchAndSetData for ${chartId}:`, error);
          setError(error.message || 'Failed to load chart data');
        } finally {
          setIsLoading(false);
        }
      };

      // Start fetching data
      fetchAndSetData();

      // Resize handler
      const handleResize = () => {
        if (chart && containerRef.current) {
          const newWidth = containerRef.current.clientWidth || containerRef.current.offsetWidth;
          if (newWidth > 0) {
            chart.applyOptions({ width: newWidth });
            console.log('📏 Chart resized to width:', newWidth);
          }
        }
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup on unmount
      return () => {
        console.log(`🧹 Cleaning up chart ${chartId}`);
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.remove();
        }
      };

    } catch (error) {
      console.error('❌ Error creating chart:', error);
      setError('Failed to create chart: ' + error.message);
      setIsLoading(false);
    }

  }, [ticker, interval, zones, chartId, isMounted]);

  // Loading states with better debugging
  if (!isMounted) {
    console.log('🔄 Rendering ChartInitializing component');
    return <ChartInitializing chartId={chartId} />;
  }

  if (isLoading) {
    console.log('⏳ Rendering ChartLoading component');
    return <ChartLoading ticker={ticker} interval={interval} chartId={chartId} />;
  }

  if (error) {
    console.log('❌ Rendering ChartError component:', error);
    return (
      <ChartError 
        error={error} 
        ticker={ticker} 
        interval={interval} 
        chartId={chartId} 
        onRetry={() => {
          console.log('🔄 Retrying chart load...');
          setError(null);
          setIsLoading(true);
          setIsMounted(false);
          // Trigger remount
          setTimeout(() => {
            if (containerRef.current) {
              setIsMounted(true);
            }
          }, 100);
        }} 
      />
    );
  }

  console.log('✅ Rendering chart component');
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
        <p className="text-xs text-gray-400">
          Chart ID: {chartId}
        </p>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-[500px] rounded-lg overflow-hidden bg-gray-50 border border-gray-200"
        style={{ 
          minHeight: '500px', 
          minWidth: '300px',
          position: 'relative'
        }}
      />
      
      <ChartLegend zones={zones} chartData={chartData} />
    </div>
  );
};

export default StockChart;