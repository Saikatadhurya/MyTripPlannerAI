import axios from 'axios';

const API_URL = '/api/history';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export { api };
