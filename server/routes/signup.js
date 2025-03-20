const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const transporter = require('../utils/email');

const User = require('../models/User');
const Role = require('../models/Role');
const { createLog } = require('../middlewares/logger.js');

// GET /register
router.get('/register', (req, res) => {
  res.render('signup', {
    pageTitle: 'Registro de Usuario',
    description: 'Crea una cuenta nueva'
  });
});

// POST /register
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

    // ✅ Crear el usuario desactivado
    const user = new User({
      username,
      email,
      password,
      roles: [defaultRole._id],
      isActive: false // Desactivado al registrarse
    });

    // ✅ Generar token de activación
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

    user.activationToken = activationToken;
    user.activationTokenExpires = activationTokenExpires;

    await user.save();

    // ✅ Guardar el log
    await createLog({
      entity: 'User',
      action: 'CREATE',
      entityId: user._id,
      performedBy: user._id,
      after: {
        username: user.username,
        email: user.email,
        roles: user.roles,
        isActive: user.isActive
      }
    });

    console.log('✅ Usuario registrado y log guardado');

    // ✅ Enviar email de activación
    const activationLink = `http://localhost:3001/auth/activate/${activationToken}`;

    await transporter.sendMail({
      from: `"Blog App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Activa tu cuenta en el Blog',
      html: `
        <h1>Hola, ${username}</h1>
        <p>Gracias por registrarte. Por favor, activa tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${activationLink}">Activar cuenta</a>
        <p>Este enlace expirará en 24 horas.</p>
      `
    });

    console.log(`📧 Email de activación enviado a: ${user.email}`);

    res.render('signup', {
      pageTitle: 'Registro de Usuario',
      description: 'Crea una cuenta nueva',
      success: 'Registro exitoso. Revisa tu correo para activar tu cuenta.'
    });

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
