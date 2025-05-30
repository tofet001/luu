// utils/dailyVerseJob.js
const cron = require('node-cron');
const { getDailyVerse } = require('./bibleAPI');
const Post = require('../models/Post');

// Run every day at 6 AM
cron.schedule('0 6 * * *', async () => {
  const verse = await getDailyVerse();
  if (verse) {
    await Post.create({
      user: process.env.SYSTEM_USER_ID, // Create a system user
      content: "Today's Bible Verse",
      verse: {
        text: verse.text,
        reference: verse.reference,
        translation: verse.translation
      },
      isPublic: true
    });
  }
});