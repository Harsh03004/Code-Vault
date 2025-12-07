// API Configuration
export const BASE_URL = 'http://localhost:4000/api';

// Check authentication
export function checkAuth() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Get auth headers
export function getAuthHeaders() {
  const accessToken = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };
}
