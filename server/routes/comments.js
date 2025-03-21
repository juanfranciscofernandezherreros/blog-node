const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard/comments
 * Listar todos los comentarios
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    // Paginación y limit
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalComments = await Comment.countDocuments();
    const totalPages = Math.ceil(totalComments / limit);

    const comments = await Comment.find()
      .populate('postId', 'title')
      .populate('parentId', 'body author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('admin/dashboard-comments', {
      title: 'Comentarios',
      description: 'Gestión de comentarios',
      layout: adminLayout,
      data: comments,
      page,
      totalPages,
      limit,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });
  } catch (error) {
    console.error('Error al cargar los comentarios:', error);
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
    console.error('Error al eliminar comentario:', error);
    res.redirect('/dashboard/comments?error=Error al eliminar el comentario');
  }
});

module.exports = router; // ✅ EXPORTA BIEN el router
