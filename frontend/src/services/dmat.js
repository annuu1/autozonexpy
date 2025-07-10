import axios from "axios";

const BASE_URL = "http://localhost:8000/kotak";
   
export const login  = async () => {
    try {
        console.log('Logging in with DMAT ID:');
        const response = await axios.post(`${BASE_URL}/login`);
        console.log('Login response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

//get holdings
export const getHoldings = async ()=> {
    try {
        const response = await axios.get(`${BASE_URL}/holdings`);
        console.log('Holdings response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching holdings:', error);
        throw error;
    }
}   