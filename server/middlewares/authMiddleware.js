const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtSecret = process.env.JWT_SECRET;

/**
 * ✅ Middleware para verificar si el usuario está autenticado
 */
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token; // Obtener token desde cookies

  if (!token) {
    return res.status(401).json({ message: 'No autorizado. Inicia sesión.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.userId).select('-password'); // Obtener usuario sin la contraseña
    if (!req.user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

/**
 * ✅ Middleware para verificar roles específicos
 * @param {Array} allowedRoles - Ej: ['admin', 'editor']
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado. No tienes permisos.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
