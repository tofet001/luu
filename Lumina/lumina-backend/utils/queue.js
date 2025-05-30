// utils/queue.js
const Queue = require('bull');
const emailQueue = new Queue('email', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

emailQueue.process(async (job) => {
  const { email, subject, message } = job.data;
  await sendEmail({ email, subject, message });
});