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


router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.log('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * GET /logout
 * Cierra la sesión del usuario
 */
router.get('/dashboard/logout', (req, res) => {
  res.clearCookie('token'); // Elimina la cookie del token
  res.redirect('/admin'); // Redirige al login
});
/**
 * GET /logout
 * Cierra la sesión del usuario
 */
router.get('dashboard/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) }); // Expira la cookie del token
  res.redirect('/login');
});


module.exports = router;