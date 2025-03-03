const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User'); // Asegúrate de tener este modelo

const router = express.Router();

/**
 * GET /users
 * Lista todos los usuarios con paginación
 */
router.get('/', async (req, res) => {
  try {
    const perPage = req.app.locals.perPage || 10; // Usuarios por página
    let page = parseInt(req.query.page) || 1;

    // Obtener usuarios con paginación
    const users = await User.find()
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    // Contar total de usuarios
    const count = await User.countDocuments();

    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const locals = {
      title: "Lista de Usuarios",
      description: "Lista de todos los usuarios registrados en el sistema."
    };

    res.render('users', {
      locals,
      users,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentRoute: '/users'
    });

  } catch (error) {
    console.error("❌ Error al obtener la lista de usuarios:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});

/**
 * GET /users/:username
 * Obtiene los detalles de un usuario por su username
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar usuario por username (insensible a mayúsculas y minúsculas)
    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });

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

module.exports = router;
