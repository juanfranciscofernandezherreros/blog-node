const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const jwtSecret = process.env.JWT_SECRET;

/**
 * Middleware para verificar si el usuario está autenticado.
 */
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).populate('roles');

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Error en la autenticación:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

/**
 * Middleware para verificar si el usuario tiene al menos uno de los roles requeridos.
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const userRoles = req.user.roles.map(role => role.name);
    if (!roles.some(role => userRoles.includes(role))) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
