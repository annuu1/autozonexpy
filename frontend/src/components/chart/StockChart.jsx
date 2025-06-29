import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { getOhlcData } from '../../services/api';
import { useChartContainer } from '../../hooks/useChartContainer';
import { processOhlcData, normalizeTicker, getDateRange } from '../../utils/chartDataProcessor';
import { addZoneLines } from './ChartZoneLines';
import { DEFAULT_CHART_CONFIG, CANDLESTICK_SERIES_CONFIG } from './ChartConfig';
import { ChartInitializing, ChartLoading, ChartError } from './ChartLoadingStates';
import ChartLegend from './ChartLegend';

const StockChart = ({ ticker = "ABB", interval = '1d', zones = [], chartId = "default" }) => {
  const { containerRef, isMounted, containerSize } = useChartContainer();
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!isMounted || !containerRef.current || !ticker) {
      return;
    }

    console.log('StockChart useEffect triggered:', { ticker, interval, chartId, zones: zones?.length, isMounted });

    // Clean up any existing chart
    if (chartRef.current) {
      console.log('Cleaning up existing chart');
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    }

    const normalizedTicker = normalizeTicker(ticker);
    console.log('Creating chart for ticker:', normalizedTicker, 'interval:', interval);

    // Create chart instance
    const chartConfig = {
      ...DEFAULT_CHART_CONFIG,
      width: containerSize.width || containerRef.current.clientWidth,
      height: containerSize.height || 500,
    };

    const chart = createChart(containerRef.current, chartConfig);
    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries(CANDLESTICK_SERIES_CONFIG);
    candlestickSeriesRef.current = candlestickSeries;

    console.log('Chart and candlestick series created successfully');

    // Fetch and set candlestick data
    const fetchAndSetData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { startDate, endDate } = getDateRange(2);
        
        console.log(`Making API call for ${normalizedTicker} with interval ${interval} from ${startDate} to ${endDate}`);
        console.log(`Expected URL: http://localhost:8000/ohlc-data?ticker=${normalizedTicker.toLowerCase()}&start_date=${startDate}&end_date=${endDate}&interval=${interval}`);
        
        const ohlcData = await getOhlcData(normalizedTicker.toLowerCase(), interval, startDate, endDate);
        console.log('Raw OHLC data received:', ohlcData?.length, 'records');
        
        if (ohlcData && ohlcData.length > 0) {
          console.log('First few records:', ohlcData.slice(0, 3));
        }
        
        const processedData = processOhlcData(ohlcData);
        console.log(`Processed ${processedData.length} valid data points for ${chartId}`);
        console.log('Sample processed data:', processedData.slice(0, 3));
        
        // Set the candlestick data
        candlestickSeries.setData(processedData);
        setChartData(processedData);

        // Add zone lines if zones are provided
        if (zones && zones.length > 0) {
          console.log(`Adding ${zones.length} zone lines for ${chartId}`);
          addZoneLines(candlestickSeries, zones);
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
      if (chart && containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
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
  }, [ticker, interval, zones, chartId, isMounted, containerSize]);

  // Loading states
  if (!isMounted) {
    return <ChartInitializing chartId={chartId} />;
  }

  if (isLoading) {
    return <ChartLoading ticker={ticker} interval={interval} chartId={chartId} />;
  }

  if (error) {
    return (
      <ChartError 
        error={error} 
        ticker={ticker} 
        interval={interval} 
        chartId={chartId} 
        onRetry={() => window.location.reload()} 
      />
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
      
      <div ref={containerRef} className="w-full h-[500px] rounded-lg overflow-hidden" />
      
      <ChartLegend zones={zones} chartData={chartData} />
    </div>
  );
};

export default StockChart;