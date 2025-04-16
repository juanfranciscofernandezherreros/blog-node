// server/routes/comments_post.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// ⚠️ Ya no usamos authenticateToken aquí (para que sea libre)
router.post('/post/:slug', async (req, res) => {
  try {
    const { author, email, body, parentId } = req.body;
    const { slug } = req.params;

    if (!body || !slug) {
      return res.status(400).send('Faltan datos');
    }

    // 🔎 Buscar el post por slug para obtener su _id
    const post = await Post.findOne({ slug });

    if (!post) {
      return res.status(404).send('Post no encontrado');
    }

    let commentAuthor = '';
    let commentEmail = '';

    if (req.user && req.user.username) {
      commentAuthor = req.user.username;
      commentEmail = req.user.email;
    } else {
      if (!author || !email) {
        return res.status(400).send('El nombre y el correo electrónico son requeridos');
      }

      commentAuthor = author.trim();
      commentEmail = email.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(commentEmail)) {
        return res.status(400).send('Correo electrónico inválido');
      }
    }

    const newComment = new Comment({
      author: commentAuthor,
      email: commentEmail,
      body,
      postId: post._id,
      parentId: parentId || null
    });

    await newComment.save();

    res.redirect(`/post/${slug}#comments`);
  } catch (error) {
    console.error('❌ Error al publicar comentario:', error);
    res.status(500).send('Error en el servidor');
  }
});


module.exports = router;
