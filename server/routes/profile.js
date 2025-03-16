const express = require('express');
const User = require('../models/User'); 
const Post = require('../models/Post'); 
const Comment = require('../models/Comment'); 

const router = express.Router();

const { authenticateToken } = require('../middlewares/authMiddleware');

/**
 * ✅ GET /user
 * Muestra el perfil del usuario autenticado (Solo autenticados pueden acceder)
 */
/**
 * ✅ GET /user
 * Muestra el perfil del usuario autenticado (Solo autenticados pueden acceder)
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log(`📌 Perfil solicitado por el usuario autenticado: ${req.user.username}`);

    const userId = req.user._id;

    // 🔹 Posts que el usuario ha dado like Y que están en estado 'published'
    const likedPosts = await Post.find({ 
        likes: userId, 
        published: true // Asegura que el post esté publicado 
      })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // 🔹 Posts que el usuario ha marcado como favoritos Y que están en estado 'published'
    const favoritedPosts = await Post.find({ 
        favoritedBy: userId, 
        published: true // Asegura que el post esté publicado 
      })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    // 🔹 Comentarios que el usuario ha dejado (solo los comentarios raíz) y publicados
    const userComments = await Comment.find({ 
      author: req.user.username, 
      parentId: null, 
      published: true
    })
      .populate('postId', 'title published')
      .sort({ createdAt: -1 });

    // 🔹 Respuestas que el usuario ha dejado (hijos de otros comentarios) y publicados
    const userReplies = await Comment.find({ 
      author: req.user.username, 
      parentId: { $ne: null },
      published: true
    })
      .populate('postId', 'title published')
      .populate('parentId', 'body')
      .sort({ createdAt: -1 });

    res.render('profile', {
      pageTitle: 'Perfil de Usuario',
      description: 'Aquí puedes ver la información de tu cuenta',
      user: req.user,
      likedPosts,
      favoritedPosts,
      userComments,
      userReplies
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
