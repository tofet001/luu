const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yourjwtsecret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';
const JWT_COOKIE_EXPIRE = process.env.JWT_COOKIE_EXPIRE || 30;

module.exports = {
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_COOKIE_EXPIRE
};