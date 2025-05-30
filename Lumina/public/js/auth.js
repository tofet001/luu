// public/js/auth.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
  
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        window.location.href = '/feed.html'; // Redirect after login
      } else {
        showError(data.message || 'Login failed');
      }
    } catch (error) {
      showError('Network error - please try again');
    }
  });
  import { loginUser } from './api.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { token, user } = await loginUser(email, password);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    window.location.href = '/feed.html';
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
});