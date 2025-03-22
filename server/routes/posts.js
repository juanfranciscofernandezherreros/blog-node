const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Category = require('../models/Category');
const Tags = require('../models/Tags');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';


/**
 * GET /dashboard - Mostrar todos los artículos
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3; // por defecto, 3 artículos
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Post.find()
        .populate('author', 'username')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments()
    ]);

    const categories = await Category.find().lean();

    res.render('admin/dashboard', {
      title: 'Dashboard - Articles',
      data,
      categories,
      layout: adminLayout,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit),
        limit,
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.redirect('/dashboard');
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
        user: req.user // ✅ Aquí sí tienes acceso al usuario
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
/**
 * POST /add-post
 * Admin - Crear Nuevo Post
 */
router.post('/add-post', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { title, summary, body, category, publishDate, tags, status } = req.body;

    // Validación básica de campos
    if (!title || !summary || !body || !category || !publishDate || !status) {
      return res.status(400).send('Todos los campos son obligatorios');
    }

    // Validar que el estado es uno de los valores aceptados
    const validStatuses = ['draft', 'published', 'review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).send('El estado del artículo no es válido');
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
      author: req.user._id, // ✅ Referencia al usuario autenticado
      publishDate: new Date(publishDate),
      status, // ✅ Aquí se añade el estado al nuevo post
    });

    await newPost.save();

    res.redirect('/dashboard'); // O la ruta que consideres adecuada
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
      title: 'Editar Post',
      description: 'Edita un artículo existente'
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
      selectedTags: post.tags,
      user: req.user
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
    const { title, summary, body, category, tags, status, publishDate } = req.body;

    // Validación básica
    if (!title || !summary || !body || !category || !status || !publishDate) {
      return res.status(400).send('Todos los campos son obligatorios');
    }

    // Validación del campo status
    const validStatuses = ['draft', 'published', 'review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).send('El estado del artículo no es válido');
    }

    // Manejo de tags como array
    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      tagsArray = tags.split(',').map(tag => tag.trim());
    }

    // Buscar el post por ID
    const postToUpdate = await Post.findById(req.params.id);
    if (!postToUpdate) return res.status(404).send('Post no encontrado');

    // Actualizar los campos
    postToUpdate.title = title.trim();
    postToUpdate.summary = summary.trim();
    postToUpdate.body = body.trim();
    postToUpdate.category = category;
    postToUpdate.tags = tagsArray;
    postToUpdate.status = status; // ✅ Actualiza el estado
    postToUpdate.publishDate = new Date(publishDate); // ✅ Actualiza la fecha de publicación
    postToUpdate.updatedAt = Date.now();

    await postToUpdate.save();

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error actualizando post:', error);
    res.status(500).send('Error actualizando el post');
  }
});

/**
 * POST /dashboard/delete-post/:id
 * Admin - Eliminar un post
 */
router.post('/delete-post/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const postId = req.params.id;

    // Verificación básica del ID
    if (!postId || postId.length !== 24) {
      return res.status(400).send('ID del artículo no es válido');
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post no encontrado');
    }

    await Post.deleteOne({ _id: postId });

    console.log(`✅ Post eliminado: ${post.title}`);

    // Redirecciona al dashboard después de borrar
    res.redirect('/dashboard');
    
    // Si quieres responder JSON porque usarías fetch/AJAX:
    // res.json({ success: true, message: 'Artículo eliminado' });

  } catch (error) {
    console.error('Error eliminando post:', error);
    res.status(500).send('Error eliminando el post');
  }
});


module.exports = router;
