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
  res.render('signin', {
    pageTitle: 'Iniciar sesion',  // Puedes enviar datos a la vista si quieres
    description: 'Iniciar sesion'
  });
});

router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    console.log(user);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.redirect('/profile/user');
  } catch (error) {
    console.log('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});
  
module.exports = router;
