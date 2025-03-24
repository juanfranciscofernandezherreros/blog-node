const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

/// GET /dashboard/comments
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('postId', 'title')
      .populate('parentId', 'body author')
      .sort({ createdAt: -1 });

    res.render('admin/dashboard-comments', {
      title: 'Comentarios',
      layout: '../views/layouts/admin',
      data: comments,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (error) {
    console.error('Error cargando comentarios:', error);
    res.redirect('/dashboard/comments?error=No se pudieron cargar los comentarios');
  }
});



/**
 * DELETE /dashboard/comments/delete/:id
 */
router.post('/delete/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/comments?success=Comentario eliminado correctamente');
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    res.redirect('/dashboard/comments?error=Error al eliminar el comentario');
  }
});

module.exports = router; // ✅ EXPORTA BIEN el router
