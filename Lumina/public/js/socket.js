// public/js/socket.js
const socket = io('http://localhost:5000', {
    auth: {
      token: localStorage.getItem('token')
    }
  });
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });
  
  socket.on('newNotification', (data) => {
    showNotification(data.message);
  });