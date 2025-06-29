// Utility functions for processing chart data
export const processOhlcData = (rawData) => {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('Invalid or empty OHLC data');
  }

  const processedData = rawData.map((data, index) => {
    try {
      // Handle different date formats
      let time;
      if (typeof data.Date === 'string') {
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

  return processedData;
};

export const normalizeTicker = (ticker) => {
  if (!ticker) return '';
  
  let normalized = ticker.toUpperCase();
  if (normalized.endsWith('.NS')) {
    normalized = normalized.replace('.NS', '');
  }
  
  return normalized;
};

export const getDateRange = (yearsBack = 2) => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - yearsBack * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return { startDate, endDate };
};