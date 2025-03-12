const express = require('express');
const User = require('../models/User'); 
const Post = require('../models/Post'); 

const router = express.Router();

const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * ✅ GET /user
 * Muestra el perfil del usuario autenticado (Solo autenticados pueden acceder)
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log(`📌 Perfil solicitado por el usuario autenticado: ${req.user.username}`);

    const userId = req.user._id;

    // 🔹 Obtener los posts que el usuario ha dado like
    const likedPosts = await Post.find({ likes: userId })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // 🔹 Obtener los posts que el usuario ha marcado como favoritos
    const favoritedPosts = await Post.find({ favoritedBy: userId })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.render('profile', {
      pageTitle: 'Perfil de Usuario',
      description: 'Aquí puedes ver la información de tu cuenta',
      user: req.user,
      likedPosts,
      favoritedPosts
    });

  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).render('500', {
      pageTitle: 'Error interno',
      description: 'Ocurrió un error al obtener el perfil'
    });
  }
});

/**
 * GET /logout
 * Cierra la sesión del usuario
 */
router.get('/logout', (req, res) => {
  res.clearCookie('token'); // Elimina la cookie del token
  res.redirect('/'); // Redirige al login
});

module.exports = router;
