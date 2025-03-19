// server/routes/comments_post.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// ⚠️ Ya no usamos authenticateToken aquí (para que sea libre)
router.post('/post/:postId', async (req, res) => {
  try {
    const { author, email, body, parentId } = req.body;
    const { postId } = req.params;

    if (!body || !postId) {
      return res.status(400).send('Faltan datos');
    }

    let commentAuthor = '';
    let commentEmail = '';

    if (req.user && req.user.username) {
      commentAuthor = req.user.username;
      commentEmail = req.user.email; // si tienes el email del usuario autenticado
    } else {
      if (!author || !email) {
        return res.status(400).send('El nombre y el correo electrónico son requeridos');
      }

      commentAuthor = author.trim();
      commentEmail = email.trim();

      // Opcional: validación básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(commentEmail)) {
        return res.status(400).send('Correo electrónico inválido');
      }
    }

    const newComment = new Comment({
      author: commentAuthor,
      email: commentEmail,
      body,
      postId,
      parentId: parentId || null
    });

    await newComment.save();

    // 🔔 Aquí puedes meter lógica para enviar email cuando le respondan
    res.redirect(`/post/${postId}#comments`);
    
  } catch (error) {
    console.error('❌ Error al publicar comentario:', error);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
