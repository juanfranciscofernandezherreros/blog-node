const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const transporter = require('../utils/email');

const User = require('../models/User');
const Role = require('../models/Role');
const { createLog } = require('../middlewares/logger.js');
const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';

// ✅ GET /register - Renderizar el formulario
router.get('/register', (req, res) => {

  const locals = {
    title: "SignUp",
  };

  const message = req.query.message;

  res.render('signup', {
    locals,
    success: message || null,
    error: null
  });
});

// ✅ POST /register - Procesar el registro
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.render('signup', { 
        pageTitle: 'Registro de Usuario',
        description: 'Crea una cuenta nueva',
        error: 'Todos los campos son obligatorios',
        success: null
      });
    }

    // Comprobar si el usuario o email ya existen
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', {
        pageTitle: 'Registro de Usuario',
        description: 'Crea una cuenta nueva',
        error: 'El usuario o email ya están en uso',
        success: null
      });
    }

    // Obtener el rol por defecto
    const defaultRole = await Role.findOne({ name: 'user' });
    if (!defaultRole) {
      return res.render('signup', {
        pageTitle: 'Registro de Usuario',
        description: 'Crea una cuenta nueva',
        error: 'Rol por defecto no encontrado. Contacta al administrador',
        success: null
      });
    }

    // ✅ Crear el usuario desactivado
    const user = new User({
      username,
      email,
      password,
      roles: [defaultRole._id],
      isActive: false
    });

    // ✅ Generar token de activación
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

    user.activationToken = activationToken;
    user.activationTokenExpires = activationTokenExpires;

    await user.save();

    // ✅ Guardar log de creación
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
    const activationLink = `${baseUrl}/auth/activate/${activationToken}`;

    await transporter.sendMail({
      from: `"Blog App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Activa tu cuenta en el Blog',
      html: `
        <h1>Hola, ${username}</h1>
        <p>Gracias por registrarte. Por favor, activa tu cuenta haciendo clic en el siguiente enlace:</p>
        <p><a href="${activationLink}">Activar cuenta</a></p>
        <p>Este enlace expirará en 24 horas.</p>
      `
    });

    console.log(`📧 Email de activación enviado a: ${user.email}`);

    // ✅ Redireccionar al formulario con mensaje de éxito
    res.redirect('/auth/register?message=Registro exitoso. Revisa tu correo para activar tu cuenta.');

  } catch (error) {
    console.error('❌ Error en el registro:', error);

    res.status(500).render('signup', {
      pageTitle: 'Registro de Usuario',
      description: 'Crea una cuenta nueva',
      error: 'Error interno del servidor',
      success: null
    });
  }
});

module.exports = router;
