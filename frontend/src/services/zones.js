import axios from "axios";

const BASE_URL = "http://localhost:8000"

export const getAllZones = async (currentPage = 1, itemsPerPage = 10, sortBy = 'timestamp', sortOrder = 'desc', ticker = '', pattern = '') => {
    try {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
            sort_by: sortBy,
            sort_order: sortOrder === 'asc' ? 1 : -1
        };

        // Add filters if provided
        if (ticker) params.ticker = ticker;
        if (pattern) params.pattern = pattern;

        console.log('Fetching zones with params:', params);
        const response = await axios.get(`${BASE_URL}/zones/all-zones`, { params });
        
        console.log('Zones API response:', {
            data: response.data.data.length,
            total: response.data.total,
            page: response.data.page,
            totalPages: response.data.total_pages
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching zones:', error);
        throw error;
    }
};

export const deleteZone = async (zoneId) => {
    try {
        console.log('Deleting zone with ID:', zoneId);
        const response = await axios.delete(`${BASE_URL}/zones/${zoneId}`);
        console.log('Delete zone response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting zone:', error);
        throw error;
    }
};