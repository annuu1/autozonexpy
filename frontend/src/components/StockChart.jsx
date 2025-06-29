'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { getOhlcData } from '../services/api';

const StockChart = ({ ticker="abb", interval = '1d', selectedZone = null }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);

  useEffect(() => {
    console.log('Chart component mounted with ticker:', ticker);

    if (!chartContainerRef.current) return;

    // Create chart instance
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

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add horizontal price line at 6069
candlestickSeries.createPriceLine({
  price: 6069,
  color: '#FF9800',
  lineWidth: 1,
  lineStyle: 0, // 0 = Solid, 1 = Dotted, 2 = Dashed, 3 = LargeDashed, 4 = SparseDotted
  axisLabelVisible: true,
  title: '6069 ₹ Level',
});



    // Fetch and set candlestick data
    const fetchAndSetData = async () => {
      try {
        const ohlcData = await getOhlcData(ticker, interval, "2025-01-01", "2025-06-29");
        console.log('Raw backend OHLC data:', ohlcData);
        if (!Array.isArray(ohlcData) || ohlcData.length === 0) {
          console.error('No OHLC data returned from backend:', ohlcData);
          return;
        }
        const chartData = ohlcData.map((data) => {
          // Convert ISO string (e.g. '2024-12-31T18:30:00.000Z') to 'YYYY-MM-DD'
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
        }).filter(d => d.time && typeof d.open === 'number' && typeof d.high === 'number' && typeof d.low === 'number' && typeof d.close === 'number');
        if (chartData.length === 0) {
          console.error('No valid chart data after mapping:', chartData);
          return;
        }
        candlestickSeries.setData(chartData);
        console.log('Mapped chart data:', chartData);
      } catch (error) {
        console.error('Error fetching OHLC data:', error);
      }
    };
    fetchAndSetData();

    // Fit content
    chart.timeScale().fitContent();

    // Resize handler
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up chart');
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [ticker, interval, selectedZone]);

  return (
    <div className="relative w-full">
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default StockChart;
