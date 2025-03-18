// server/routes/comments_post.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/post/:postId', authenticateToken, async (req, res) => {
  try {
    const { body, parentId } = req.body;
    const { postId } = req.params;

    if (!body || !postId) {
      return res.status(400).send('Faltan datos');
    }

    const newComment = new Comment({
      author: req.user.username,
      body,
      postId,
      parentId: parentId || null
    });

    await newComment.save();

    res.redirect(`/post/${postId}`);
    // Esto te envía de vuelta a la página del artículo, anclado en la sección de comentarios (opcionalmente)
    
  } catch (error) {
    console.error('❌ Error al publicar comentario:', error);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
