// public/js/config.js
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourdomain.com/api/v1' 
  : 'http://localhost:5000/api/v1';