const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const auth = require('./routes/authRoutes');
const posts = require('./routes/postRoutes');
const prayers = require('./routes/prayerRoutes');
const communities = require('./routes/communityRoutes');
const events = require('./routes/eventRoutes');
const users = require('./routes/userRoutes');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File uploading
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/posts', posts);
app.use('/api/v1/prayers', prayers);
app.use('/api/v1/communities', communities);
app.use('/api/v1/events', events);
app.use('/api/v1/users', users);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
 
const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
const http = require('http');
const socketio = require('socket.io');

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = socketio(server);

// Socket.io logic
io.on('connection', socket => {
  console.log('New WebSocket connection');

  // Join user to their own room
  socket.on('join', ({ userId }) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle voice call
  socket.on('callUser', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('callUser', { signal: signalData, from, name });
  });

  // Handle call answer
  socket.on('answerCall', ({ signal, to }) => {
    io.to(to).emit('callAccepted', signal);
  });

  // Handle call end
  socket.on('endCall', ({ to }) => {
    io.to(to).emit('callEnded');
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make sure to use the HTTP server, not Express app
server.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);