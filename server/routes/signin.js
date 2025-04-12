const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Newsletter = require('../models/Newsletter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Category = require('../models/Category'); // Importa el modelo
const Tag = require('../models/Tags'); // Importa el modelo
const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;


// ✅ GET /register - Renderiza el formulario de registro
router.get('/signin', (req, res) => {

  const locals = {
    title: "SignIn",
  };

  res.render('signin', {
    locals,
    pageTitle: 'Iniciar sesion',  // Puedes enviar datos a la vista si quieres
    description: 'Iniciar sesion'
  });
});

router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Buscar el usuario por username
    const user = await User.findOne({ username });

    // ✅ Validar si el usuario existe
    if (!user) {
      return res.status(401).render('signin', {
        pageTitle: 'Iniciar sesión',
        description: 'Iniciar sesión',
        error: 'Usuario no encontrado'
      });
    }

    // ✅ Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(403).render('signin', {
        pageTitle: 'Iniciar sesión',
        description: 'Iniciar sesión',
        error: 'Debes activar tu cuenta desde el enlace de activación enviado a tu correo.'
      });
    }

    // ✅ Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).render('signin', {
        pageTitle: 'Iniciar sesión',
        description: 'Iniciar sesión',
        error: 'Contraseña incorrecta'
      });
    }

    // ✅ Generar el token si todo está correcto
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    console.log(`✅ Usuario ${user.username} inició sesión`);

    res.redirect('/profile/user'); // Cambia esta ruta según tu necesidad

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).render('signin', {
      pageTitle: 'Iniciar sesión',
      description: 'Iniciar sesión',
      error: 'Error en el servidor'
    });
  }
});

  
module.exports = router;
