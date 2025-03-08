const express = require('express');
const User = require('../models/User'); 
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

/**
 * ✅ GET /users
 * Lista todos los usuarios con paginación (Accesible por todos)
 */
router.get('/users', async (req, res) => {
  try {
    console.log("📌 Se ha solicitado la lista de usuarios.");

    const perPage = req.app.locals.perPage || 10;
    let page = parseInt(req.query.page) || 1;

    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    const count = await User.countDocuments();
    const totalPages = Math.ceil(count / perPage);
    
    console.log(`✅ Usuarios obtenidos: ${users.length} (Página ${page}/${totalPages})`);
    
    res.json({
      message: "Lista de usuarios obtenida correctamente",
      users,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });

  } catch (error) {
    console.error("❌ Error al obtener la lista de usuarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * ✅ GET /users/:username
 * Obtiene los detalles de un usuario por su username (Accesible por todos)
 */
router.get('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📌 Se ha solicitado el perfil del usuario: ${username}`);

    const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') }).select('-password');

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${username}`);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log(`✅ Usuario encontrado: ${user.username}`);
    res.json({
      message: `Perfil del usuario ${user.username}`,
      user,
    });

  } catch (error) {
    console.error("❌ Error al obtener los detalles del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * ✅ GET /profile
 * Muestra el perfil del usuario autenticado (Solo autenticados pueden acceder)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log(`📌 Perfil solicitado por el usuario autenticado: ${req.user.username}`);
    
    res.json({
      message: "Perfil del usuario autenticado",
      user: req.user
    });

  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/**
 * ✅ GET /administrator
 * Solo los administradores pueden acceder.
 */
router.get('/administrator', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    console.log("📌 Acceso al panel de administrador:", req.user);
    res.json({ message: "Bienvenido al panel de administrador", user: req.user });
  } catch (error) {
    console.error("❌ Error en el acceso de administrador:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * ✅ GET /editor
 * Solo los editores pueden acceder.
 */
router.get('/editor', authenticateToken, authorizeRoles(['editor','admin']), async (req, res) => {
  try {
    console.log("📌 Acceso al panel de editores:", req.user);
    res.json({ message: "Bienvenido al panel de editores", user: req.user });
  } catch (error) {
    console.error("❌ Error en el acceso de editor:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * ✅ GET /instructor
 * Solo los instructores pueden acceder.
 */
router.get('/instructor', authenticateToken, authorizeRoles(['instructor','admin']), async (req, res) => {
  try {
    console.log("📌 Acceso al panel de instructores:", req.user);
    res.json({ message: "Bienvenido al panel de instructores", user: req.user });
  } catch (error) {
    console.error("❌ Error en el acceso de instructor:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * ✅ GET /student
 * Solo los estudiantes pueden acceder.
 */
router.get('/student', authenticateToken, authorizeRoles(['student','admin']), async (req, res) => {
  try {
    console.log("📌 Acceso al panel de estudiantes:", req.user);
    res.json({ message: "Bienvenido al panel de estudiantes", user: req.user });
  } catch (error) {
    console.error("❌ Error en el acceso de estudiante:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * ✅ GET /classroom
 * Tanto estudiantes como instructores pueden acceder.
 */
router.get('/classroom', authenticateToken, authorizeRoles(['student', 'instructor','admin']), async (req, res) => {
  try {
    console.log("📌 Acceso al aula virtual (solo estudiantes e instructores):", req.user);
    res.json({ message: "Bienvenido al aula virtual", user: req.user });
  } catch (error) {
    console.error("❌ Error en el acceso al aula virtual:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
