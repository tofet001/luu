const axios = require('axios');

// Fetch Bible verse from API
const getBibleVerse = async (reference, translation = 'NIV') => {
  try {
    const response = await axios.get(
      `https://bible-api.com/${reference}?translation=${translation}`
    );

    return {
      text: response.data.text,
      reference: response.data.reference,
      translation: response.data.translation_name
    };
  } catch (err) {
    console.error('Error fetching Bible verse:', err);
    return null;
  }
};

// Get daily verse
const getDailyVerse = async () => {
  try {
    const response = await axios.get(
      'https://beta.ourmanna.com/api/v1/get?format=json&order=daily'
    );

    return {
      text: response.data.verse.details.text,
      reference: response.data.verse.details.reference,
      translation: 'NIV' // Default to NIV
    };
  } catch (err) {
    console.error('Error fetching daily verse:', err);
    return null;
  }
};

module.exports = {
  getBibleVerse,
  getDailyVerse
};