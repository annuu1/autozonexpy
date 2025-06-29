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