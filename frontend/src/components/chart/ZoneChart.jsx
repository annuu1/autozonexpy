import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { getOhlcData } from '../../services/api';

const StockChart = ({ ticker, timeFrame='1d', selectedZone = null }) => {
  console.log('StockChart props:', { ticker, timeFrame, selectedZone });
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);

  useEffect(() => {
    const symbol = ticker.toUpperCase().endsWith('.NS') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.NS`;
    console.log('Chart component mounted with ticker:', ticker);
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'black',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeriesRef.current = candlestickSeries;

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    window.addEventListener('resize', handleResize);

    const loadChartData = async () => {
      try {
        // Calculate time range (1 year back)
        const endDate = new Date();
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const endDateStr = endDate.toISOString().split('T')[0];
        const startDateStr = startDate.toISOString().split('T')[0];

        // Fetch candles using correct API signature
        const candles = await getOhlcData(symbol, timeFrame, startDateStr, endDateStr);
        console.log('Fetched candles:', candles);

        // Convert API data to lightweight-charts format
        const processedCandles = (candles || []).map(item => ({
          time: new Date(item.Date).toISOString().split('T')[0],
          open: parseFloat(item.Open),
          high: parseFloat(item.High),
          low: parseFloat(item.Low),
          close: parseFloat(item.Close),
        })).filter(item => !isNaN(item.open));

        candlestickSeries.setData(processedCandles);

        // Draw selected zone if present
        if (selectedZone) {
          candlestickSeries.createPriceLine({
            price: selectedZone.proximalLine,
            color: 'rgba(0, 150, 136, 0.5)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `(${selectedZone.pattern})`,
          });
          candlestickSeries.createPriceLine({
            price: selectedZone.distalLine,
            color: 'rgba(150, 0, 105, 0.5)',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `(${selectedZone.pattern})`,
          });
        }
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Failed to load chart data:', error);
      }
    };

    loadChartData();

    return () => {
      console.log('Cleaning up chart');
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [ticker, timeFrame, selectedZone]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default StockChart;