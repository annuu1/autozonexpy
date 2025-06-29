// Chart configuration constants
import { ColorType } from 'lightweight-charts';

export const DEFAULT_CHART_CONFIG = {
  layout: {
    background: { type: ColorType.Solid, color: 'rgba(255, 255, 255, 0.9)' },
    textColor: '#333',
  },
  width: 800,
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
};

export const CANDLESTICK_SERIES_CONFIG = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
};