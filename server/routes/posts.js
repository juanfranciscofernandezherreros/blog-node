const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Category = require('../models/Category');
const Tags = require('../models/Tags');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard - Mostrar todas los artículos
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try { 
    const data = await Post.find();
    res.render('admin/dashboard', { title: 'Dashboard - Articles', data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * GET /
 * Admin Dashboard
 */
// GET form add-post con info del usuario (username)
router.get('/add-post',
  authenticateToken,
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const locals = {
        title: 'Add Post',
        description: 'Simple Blog created with NodeJs, Express & MongoDb.'
      };

      const categories = await Category.find();
      const tags = await Tags.find();

      res.render('admin/add-post', {
        locals,
        layout: adminLayout,
        categories,
        tags,
        user: req.userInfo // 👉 Aquí accedes al usuario con el username
      });
    } catch (error) {
      console.log('Error loading add-post page:', error);
      res.status(500).send('Error retrieving data');
    }
});

/**
 * POST /add-post
 * Admin - Crear Nuevo Post
 */
router.post('/add-post', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { title, summary, body, category, publishDate, tags } = req.body;

    // Validación básica de campos
    if (!title || !summary || !body || !category || !publishDate) {
      return res.status(400).send('Todos los campos son obligatorios');
    }

    // Manejo de tags como array
    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }

    const newPost = new Post({
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
      category,
      tags: tagsArray,
      author: req.user.userId, // Esto debe venir del token verificado en authenticateToken
      publishDate: new Date(publishDate),
    });

    await newPost.save();

    // Redirect al dashboard eliminado, puedes dejarlo vacío o ir a "/"
    res.redirect('/');
  } catch (error) {
    console.error('Error creando post:', error);
    res.status(500).send('Error al crear el post');
  }
});

/**
 * GET /edit-post/:id
 * Admin - Editar un post existente
 */
router.get('/edit-post/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const locals = {
      title: 'Edit Post',
      description: 'Edit an existing blog post'
    };

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post no encontrado');

    const categories = await Category.find();
    const tags = await Tags.find();

    res.render('admin/edit-post', {
      locals,
      data: post,
      layout: adminLayout,
      categories,
      tags,
      selectedTags: post.tags
    });
  } catch (error) {
    console.error('Error cargando el post:', error);
    res.status(500).send('Error retrieving post');
  }
});

/**
 * POST /edit-post/:id
 * Admin - Actualizar un post existente
 */
router.post('/edit-post/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { title, summary, body, category, tags } = req.body;

    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }

    const postToUpdate = await Post.findById(req.params.id);
    if (!postToUpdate) return res.status(404).send('Post no encontrado');

    postToUpdate.title = title;
    postToUpdate.summary = summary;
    postToUpdate.body = body;
    postToUpdate.category = category;
    postToUpdate.tags = tagsArray;
    postToUpdate.updatedAt = Date.now();

    await postToUpdate.save();

    res.redirect('/');
  } catch (error) {
    console.error('Error actualizando post:', error);
    res.status(500).send('Error updating post');
  }
});

/**
 * POST /delete-post/:id
 * Admin - Eliminar un post
 */
router.post('/delete-post/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post no encontrado');

    await Post.deleteOne({ _id: req.params.id });

    res.redirect('/');
  } catch (error) {
    console.error('Error eliminando post:', error);
    res.status(500).send('Error deleting post');
  }
});

module.exports = router;
