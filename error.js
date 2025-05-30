// public/js/error.js
function handleApiErrors(error) {
    if (error.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    } else {
      showError(error.message);
    }
  }
  
  // Usage in API calls
  fetchPosts().catch(handleApiErrors);