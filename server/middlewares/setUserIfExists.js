// middlewares/setUserIfExists.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecret = process.env.JWT_SECRET;

const setUserIfExists = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(); // no hay token, simplemente sigue sin req.user
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    console.warn("⚠️ Token inválido u expirado:", err.message);
    // No bloqueamos la ruta
  }

  next();
};

module.exports = setUserIfExists;
