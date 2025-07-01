import axios from "axios";

const BASE_URL = "http://localhost:8000"

export const getOhlcData = async (ticker, interval, startDate, endDate) => {
    try {
        console.log(`Fetching OHLC data: ${ticker}, ${interval}, ${startDate} to ${endDate}`);
        
        const response = await axios.get(`${BASE_URL}/ohlc-data`, {
            params: {
                ticker: ticker,
                start_date: startDate,
                end_date: endDate,
                interval: interval
            }
        });
        
        console.log('API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching OHLC data:', error);
        throw new Error(error.response?.data?.detail || 'Failed to fetch OHLC data');
    }
}

// Add trade will be having these detaisl
//{
//   "symbol": "string",
//   "entry_price": 1,
//   "stop_loss": 0,
//   "target_price": 0,
//   "trade_type": "BUY",
//   "status": "OPEN",
//   "created_at": "2025-06-30T19:31:16.775Z",
//   "alert_sent": false,
//   "entry_alert_sent": false,
//   "note": "string"
// }
export const addTrade = async (symbol, entry_price, sl, target, trade_type, note) => {
    try {
        console.log(`Adding trade: ${symbol}, ${entry_price}, ${sl}, ${target}, ${trade_type}, ${note}`);
        
        const response = await axios.post(`${BASE_URL}/trades`, {
            symbol: symbol,
            entry_price: entry_price,
            stop_loss: sl,
            target_price: target,
            trade_type: trade_type,
            status: "OPEN",
            alert_sent: false,
            entry_alert_sent: false,
            note: note
        });
        
        console.log('API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding trade:', error);
        throw new Error(error.response?.data?.detail || 'Failed to add trade');
    }
}

//get all trades
export const getTrades = async (page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc') => {
    try {
      console.log(`Fetching trades for page ${page}, limit ${limit}, sortBy ${sortBy}, sortOrder ${sortOrder}`);
      const response = await axios.get(`${BASE_URL}/trades`, {
        params: { page, limit, sort_by: sortBy, sort_order: sortOrder },
      });
      return {
        trades: response.data.trades || [],
        total_pages: response.data.total_pages || 1,
        total_count: response.data.total_count || 0,
      };
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch trades');
    }
  };