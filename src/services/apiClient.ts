import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.126:1811/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // console.log(`[API Request]: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[API Error]:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
