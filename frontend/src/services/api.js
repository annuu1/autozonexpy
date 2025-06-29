import axios from "axios";

const BASE_URL = "http://localhost:8000"

export const getOhlcData = async (ticker, interval, startDate, endDate) => {
    const response = await axios.get(`${BASE_URL}/ohlc-data?ticker=${ticker}&start_date=${startDate}&end_date=${endDate}&interval=${interval}`);
    const data = response.data;
    return data;
}