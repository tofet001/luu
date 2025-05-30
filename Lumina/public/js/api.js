// public/js/api.js
const API_BASE_URL = 'http://localhost:5000/api/v1'; // Change in production

export async function fetchPosts() {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return await response.json();
}

export async function createPost(postData) {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(postData)
  });
  return await response.json();
}
const API_BASE = 'http://localhost:5000/api'; // Development URL

export const fetchPosts = async () => {
  const response = await fetch(`${API_BASE}/posts`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return await response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await response.json();
};