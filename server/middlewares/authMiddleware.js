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
    // Renderiza la vista 401.ejs
    return res.status(401).render('401', {
      pageTitle: 'No autorizado',
      description: 'Debes iniciar sesión para acceder a esta página'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).populate('roles');

    if (!user) {
      return res.status(401).render('401', {
        pageTitle: 'No autorizado',
        description: 'Usuario no encontrado. Debes iniciar sesión nuevamente.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Error en la autenticación:", error);
    res.status(401).render('401', {
      pageTitle: 'No autorizado',
      description: 'El token es inválido o ha expirado. Inicia sesión nuevamente.'
    });
  }
};

/**
 * Middleware para verificar si el usuario tiene al menos uno de los roles requeridos.
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).render('401', {
        pageTitle: 'No autorizado',
        description: 'Debes iniciar sesión para acceder a esta página'
      });
    }

    const userRoles = req.user.roles.map(role => role.name);

    if (!roles.some(role => userRoles.includes(role))) {
      return res.status(403).render('403', {
        pageTitle: 'Acceso denegado',
        description: 'No tienes permiso para acceder a esta página',
        user: req.user
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
