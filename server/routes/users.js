const express = require('express');
const User = require('../models/User'); 
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const adminLayout = '../views/layouts/admin';

/**
 * ✅ GET /users
 * Lista todos los usuarios con paginación (Accesible por todos)
 */
/**
 * GET /dashboard - Mostrar todas los artículos
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try { 
    const data = await User.find();
    res.render('admin/dashboard-users', { title: 'Dashboard - Users', data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});
/**
 * GET /dashboard/users
 * Mostrar todos los suscriptores
 */
router.get('/users',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const data = await User.find();
    res.render('admin/dashboard-users', { title: 'Users', data, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post('/users/add',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verifica si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('El correo electrónico ya está registrado');
    }

    // Encripta la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({ username, email, password: hashedPassword });

    res.redirect('/dashboard/users');
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /add-tag
 * Admin - Formulario para añadir una nueva etiqueta
 */
router.get('/add-user',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    res.render('admin/add-user', { title: 'Añadir Usuario', layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});


router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password:hashedPassword });
      res.status(201).json({ message: 'User Created', user });
    } catch (error) {
      if(error.code === 11000) {
        res.status(409).json({ message: 'User already in use'});
      }
      res.status(500).json({ message: 'Internal server error'})
    }

  } catch (error) {
    console.log(error);
  }
});

router.delete('/users/delete/:id',  authenticateToken, authorizeRoles(['admin'])  , async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/users');
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});


router.get('/users/edit/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('Usuario no encontrado');

    res.render('admin/edit-users', { user, layout: adminLayout });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});


router.put('/users/update/:id', authenticateToken, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const updateData = { username, email };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await User.findByIdAndUpdate(req.params.id, updateData);

    res.redirect('/dashboard/users');
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).send('Error interno del servidor');
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
