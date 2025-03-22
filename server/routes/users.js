const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require('../models/User');
const Role = require('../models/Role');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

/**
 * ✅ Listar todos los usuarios con paginación y filtro por nombre
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const usernameFilter = req.query.username || '';

    const query = {};
    if (usernameFilter) {
      query.username = { $regex: usernameFilter, $options: 'i' };
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalUsers
    };

    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      pagination,
      query: { username: usernameFilter },
      layout: adminLayout,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });

  } catch (error) {
    console.error('Error listando usuarios:', error);

    res.redirect('/dashboard/users?error=Ocurrió un error cargando los usuarios. Inténtalo de nuevo.');
  }
});

/**
 * ✅ Formulario para añadir usuario
 */
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

/**
 * ✅ Procesar creación de usuario
 */
router.post('/add-user', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { username, email, password, roles: selectedRoles } = req.body;
    const roles = await Role.find();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render('admin/add-user', {
        title: 'Añadir Usuario',
        layout: adminLayout,
        availableRoles: roles,
        errors: [{ msg: 'El correo ya está registrado' }],
        successMessage: null,
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

    // 🔧 Busca los usuarios actualizados y calcula paginación
    const query = {};
    const totalUsers = await User.countDocuments(query);
    const page = 1;
    const limit = 5;
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalUsers
    };

    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      pagination,        // ✅ importante
      query: {},         // ✅ importante
      layout: adminLayout,
      successMessage: 'Usuario creado correctamente',
      errorMessage: null
    });

  } catch (error) {
    console.error('Error creando usuario:', error);

    const query = {};
    const totalUsers = await User.countDocuments(query);
    const page = 1;
    const limit = 5;
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalUsers
    };

    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      pagination,        // ✅ importante
      query: {},         // ✅ importante
      layout: adminLayout,
      successMessage: null,
      errorMessage: 'Error creando el usuario. Inténtalo de nuevo.'
    });
  }
});


/**
 * ✅ Formulario para editar usuario
 */
router.get('/edit-user/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('roles');
    const roles = await Role.find();

    if (!user) {
      return res.redirect('/dashboard/users?error=Usuario no encontrado');
    }

    res.render('admin/edit-user', {
      title: 'Editar Usuario',
      layout: adminLayout,
      user,
      availableRoles: roles,
      errors: [],
      successMessage: null
    });

  } catch (error) {
    console.error('Error cargando formulario editar usuario:', error);

    res.redirect('/dashboard/users?error=Error cargando formulario de edición');
  }
});

/**
 * ✅ Procesar actualización usuario
 */
/**
 * ✅ Procesar actualización usuario
 */
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

    // 🔧 Buscamos usuarios actualizados con paginación (opcionalmente podrías usar query filters si deseas)
    const query = {};
    const page = 1;
    const limit = 5;
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalUsers
    };

    // ✅ Renderiza la vista con el mensaje de éxito
    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      pagination,        // ✅ requerido en el EJS
      query,             // ✅ requerido en el EJS
      layout: adminLayout,
      successMessage: 'Usuario actualizado correctamente',
      errorMessage: null
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);

    // Si hubo un error, volvemos a consultar para renderizar el dashboard
    const query = {};
    const page = 1;
    const limit = 5;
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('roles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalUsers
    };

    // ✅ Renderiza la vista con el mensaje de error
    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      pagination,
      query,
      layout: adminLayout,
      successMessage: null,
      errorMessage: 'Error actualizando el usuario. Inténtalo de nuevo.'
    });
  }
});


/**
 * ✅ Eliminar usuario
 */
router.post('/delete-user/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    const users = await User.find().populate('roles');

    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      layout: adminLayout,
      successMessage: 'Usuario eliminado correctamente',
      errorMessage: null
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);

    const users = await User.find().populate('roles');

    res.render('admin/dashboard-users', {
      title: 'Dashboard - Usuarios',
      data: users,
      layout: adminLayout,
      successMessage: null,
      errorMessage: 'Error eliminando el usuario. Inténtalo de nuevo.'
    });
  }
});

module.exports = router;
