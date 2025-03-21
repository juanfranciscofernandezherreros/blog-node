const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/User');
const Role = require('../models/Role');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

// ✅ Listar todos los usuarios
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const users = await User.find().populate('roles');
    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      layout: adminLayout,
      successMessage: null
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ✅ Formulario para añadir usuario
router.get('/add-user', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const roles = await Role.find();
    res.render('admin/add-user', {
      title: 'Añadir Usuario',
      layout: adminLayout,
      availableRoles: roles,
      errors: [],
      successMessage: null,
      oldData: {}
    });
  } catch (error) {
    console.error('Error cargando formulario add-user:', error);
    res.render('admin/add-user', {
      title: 'Añadir Usuario',
      layout: adminLayout,
      availableRoles: [],
      errors: [{ msg: 'Error al cargar roles' }],
      successMessage: null,
      oldData: {}
    });
  }
});

// ✅ Procesar creación de usuario
router.post('/add-user', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const roles = await Role.find();
    const { username, email, password, roles: selectedRoles } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('admin/add-user', {
        title: 'Añadir Usuario',
        layout: adminLayout,
        availableRoles: roles,
        errors: [{ msg: 'El correo ya está registrado' }],
        oldData: req.body
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      roles: Array.isArray(selectedRoles) ? selectedRoles : [selectedRoles],
      isActive: true
    });

    await user.save();

    const users = await User.find().populate('roles');
    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      layout: adminLayout,
      successMessage: 'Usuario creado correctamente'
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ✅ Formulario editar usuario
router.get('/edit-user/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('roles');
    const roles = await Role.find();

    if (!user) {
      return res.redirect('/dashboard/users');
    }

    res.render('admin/edit-user', {
      title: 'Editar Usuario',
      layout: adminLayout,
      user,
      availableRoles: roles,
      errors: []
    });
  } catch (error) {
    console.error('Error cargando formulario editar usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ✅ Procesar actualización usuario
router.post('/update-user/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { username, email, password, roles: selectedRoles } = req.body;

    const updateData = {
      username,
      email,
      roles: Array.isArray(selectedRoles) ? selectedRoles : [selectedRoles]
    };

    if (password && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await User.findByIdAndUpdate(req.params.id, updateData);

    const users = await User.find().populate('roles');
    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      layout: adminLayout,
      successMessage: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ✅ Eliminar usuario
router.post('/delete-user/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    const users = await User.find().populate('roles');
    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      layout: adminLayout,
      successMessage: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).send('Error interno del servidor');
  }
});

module.exports = router;
