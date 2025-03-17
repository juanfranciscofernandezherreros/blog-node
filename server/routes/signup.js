const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Role = require('../models/Role');

const { createLog } = require('../middlewares/logger.js');

// ✅ GET /register - Renderiza el formulario de registro
router.get('/register', (req, res) => {
  res.render('signup', {
    pageTitle: 'Registro de Usuario',  // Puedes enviar datos a la vista si quieres
    description: 'Crea una cuenta nueva'
  });
});


// ✅ POST /register - Registro de Usuario con Rol por Defecto
// ✅ POST /register - Registro de Usuario con Rol por Defecto
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.render('signup', { 
        pageTitle: 'Registro de Usuario',
        description: 'Crea una cuenta nueva',
        error: 'Todos los campos son obligatorios'
      });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', {
        pageTitle: 'Registro de Usuario',
        description: 'Crea una cuenta nueva',
        error: 'El usuario o email ya están en uso'
      });
    }

    const defaultRole = await Role.findOne({ name: 'user' });
    if (!defaultRole) {
      return res.render('signup', {
        pageTitle: 'Registro de Usuario',
        description: 'Crea una cuenta nueva',
        error: 'Rol por defecto no encontrado. Contacta al administrador'
      });
    }

    const user = new User({
      username,
      email,
      password, // Lo hashea el pre('save')
      roles: [defaultRole._id]
    });

    await user.save();

    // ✅ Creamos el log/registro de la notificación
    await createLog({
      entity: 'User',
      action: 'CREATE',
      entityId: user._id,
      performedBy: user._id, // O null si es anónimo
      after: {
        username: user.username,
        email: user.email,
        roles: user.roles
      }
    });

    console.log('✅ Usuario registrado y log guardado');

    // ✅ Redirige al main o al perfil
    res.redirect('/');

  } catch (error) {
    console.error('❌ Error en el registro:', error);
    res.status(500).render('signup', {
      pageTitle: 'Registro de Usuario',
      description: 'Crea una cuenta nueva',
      error: 'Error interno del servidor'
    });
  }
});


module.exports = router;
