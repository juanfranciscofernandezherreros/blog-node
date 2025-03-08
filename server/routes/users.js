const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User'); 
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * ✅ GET /users
 * Lista todos los usuarios con paginación (Accesible por todos)
 */
router.get('/users', async (req, res) => {
  try {
    const perPage = req.app.locals.perPage || 10;
    let page = parseInt(req.query.page) || 1;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    const count = await User.countDocuments();
    const totalPages = Math.ceil(count / perPage);
    
    res.render('users', {
      title: "Lista de Usuarios",
      users,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: '/users'
    });

  } catch (error) {
    console.error("❌ Error al obtener la lista de usuarios:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});

/**
 * ✅ GET /users/:username
 * Obtiene los detalles de un usuario por su username (Accesible por todos)
 */
router.get('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') }).select('-password');

    if (!user) {
      return res.status(404).render('404', { title: "Usuario no encontrado" });
    }

    res.render('user_detail', {
      title: `Perfil de ${user.username}`,
      user,
      currentRoute: `/users/${user.username}`
    });

  } catch (error) {
    console.error("❌ Error al obtener los detalles del usuario:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});

/**
 * ✅ GET /profile
 * Muestra el perfil del usuario autenticado (Solo autenticados pueden acceder)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user; // El usuario ya está en req.user gracias a authenticateToken
    res.render('profile', { title: 'Mi Perfil', user });
  } catch (error) {
    console.log('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
