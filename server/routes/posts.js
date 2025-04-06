const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const Post = require('../models/Post');
const Category = require('../models/Category');
const Tags = require('../models/Tags');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

/** -------------------------------------------------------------------
 *  CONFIGURACIÓN MULTER PARA SUBIR IMÁGENES DESTACADAS
 *  -------------------------------------------------------------------
 */

// Establecemos el almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Ruta relativa al root del proyecto
  },
  filename: function (req, file, cb) {
    // Ejemplo: post-1678428482487.jpg
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, 'post-' + uniqueSuffix);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Solo se permiten imágenes (jpeg, jpg, png, gif)');
  }
};

// Configuración completa de Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});


/** -------------------------------------------------------------------
 *  RUTAS
 *  -------------------------------------------------------------------
 */

/**
 * GET /dashboard
 * Mostrar todos los posts en el dashboard admin
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
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
      title: 'Dashboard - Posts',
      layout: adminLayout,
      data: posts,
      categories,
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
 * GET /dashboard/add-post
 * Mostrar formulario para crear un nuevo post
 */
router.get('/add-post', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const locals = {
      title: 'Añadir Post',
      description: 'Crear un nuevo post en el blog.'
    };

    const categories = await Category.find().lean();
    const tags = await Tags.find().lean();

    res.render('admin/add-post', {
      locals,
      layout: adminLayout,
      categories,
      tags,
      user: req.user
    });
  } catch (error) {
    console.error('Error cargando el formulario de nuevo post:', error);
    res.status(500).send('Error cargando la página');
  }
});


/**
 * POST /dashboard/add-post
 * Crear un nuevo post (con imagen destacada)
 */
router.post('/add-post',
  authenticateToken,
  authorizeRoles(['admin']),
  upload.single('featuredImage'), // ✅ Middleware de Multer
  async (req, res) => {
    try {
      const { title, summary, body, category, publishDate, tags, status } = req.body;

      // Validación básica
      if (!title || !summary || !body || !category || !publishDate || !status) {
        return res.status(400).send('Todos los campos son obligatorios');
      }

      // Manejo de tags múltiples
      let tagsArray = [];
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        tagsArray = tags.split(',').map(tag => tag.trim());
      }

      // Crear el nuevo post
      const newPost = new Post({
        title: title.trim(),
        summary: summary.trim(),
        body: body.trim(),
        category,
        tags: tagsArray,
        author: req.user._id,
        publishDate: new Date(publishDate),
        status,
        images: req.file ? req.file.filename : null
      });

      await newPost.save();

      console.log(`✅ Post creado: ${newPost.title}`);
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Error creando post:', error);
      res.status(500).send('Error al crear el post');
    }
  });


/**
 * GET /dashboard/edit-post/:id
 * Editar un post existente
 */
router.get('/edit-post/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const locals = {
      title: 'Editar Post',
      description: 'Editar el contenido de un post existente'
    };

    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).send('Post no encontrado');

    const categories = await Category.find().lean();
    const tags = await Tags.find().lean();

    res.render('admin/edit-post', {
      locals,
      layout: adminLayout,
      data: post,
      categories,
      tags,
      selectedTags: post.tags,
      user: req.user
    });
  } catch (error) {
    console.error('Error cargando el post:', error);
    res.status(500).send('Error cargando el post');
  }
});


/**
 * POST /dashboard/edit-post/:id
 * Actualizar un post existente
 */
router.post('/edit-post/:id',
  authenticateToken,
  authorizeRoles(['admin']),
  upload.single('featuredImage'), // ✅ Opcional: subir nueva imagen
  async (req, res) => {
    try {
      const { title, summary, body, category, tags, status, publishDate } = req.body;

      if (!title || !summary || !body || !category || !status || !publishDate) {
        return res.status(400).send('Todos los campos son obligatorios');
      }

      const validStatuses = ['draft', 'published', 'review'];
      if (!validStatuses.includes(status)) {
        return res.status(400).send('El estado no es válido');
      }

      let tagsArray = [];
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else if (typeof tags === 'string' && tags.trim() !== '') {
        tagsArray = tags.split(',').map(tag => tag.trim());
      }

      const postToUpdate = await Post.findById(req.params.id);
      if (!postToUpdate) return res.status(404).send('Post no encontrado');

      postToUpdate.title = title.trim();
      postToUpdate.summary = summary.trim();
      postToUpdate.body = body.trim();
      postToUpdate.category = category;
      postToUpdate.tags = tagsArray;
      postToUpdate.status = status;
      postToUpdate.publishDate = new Date(publishDate);
      postToUpdate.updatedAt = Date.now();

      // ✅ Si subieron una nueva imagen, actualizar
      if (req.file) {
        postToUpdate.images = req.file.filename;
      }

      await postToUpdate.save();

      console.log(`✅ Post actualizado: ${postToUpdate.title}`);
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Error actualizando post:', error);
      res.status(500).send('Error actualizando el post');
    }
  });


/**
 * POST /dashboard/delete-post/:id
 * Eliminar un post
 */
router.post('/delete-post/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const postId = req.params.id;

    if (!postId || postId.length !== 24) {
      return res.status(400).send('ID de post inválido');
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post no encontrado');
    }

    // ✅ Eliminar la imagen del servidor si existe
    if (post.images) {
      const fs = require('fs');
      const imagePath = path.join(__dirname, '../public/uploads/', post.images);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error eliminando imagen:', err);
        else console.log(`✅ Imagen eliminada: ${post.images}`);
      });
    }

    await Post.deleteOne({ _id: postId });

    console.log(`✅ Post eliminado: ${post.title}`);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error eliminando post:', error);
    res.status(500).send('Error eliminando el post');
  }
});

// LIKE - toggle
router.post('/post/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post no encontrado');

    await post.toggleLike(req.user._id);
    res.redirect(req.headers.referer || '/');
  } catch (error) {
    console.error('❌ Error al hacer like:', error);
    res.status(500).send('Error del servidor');
  }
});

// FAVORITE - toggle
router.post('/post/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post no encontrado');

    await post.toggleFavorite(req.user._id);
    res.redirect(req.headers.referer || '/');
  } catch (error) {
    console.error('❌ Error al hacer favorito:', error);
    res.status(500).send('Error del servidor');
  }
});

// LIKE - toggle
router.post('/:id/unlike', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post no encontrado');

    await post.toggleLike(req.user._id);
    res.redirect(req.headers.referer || '/');
  } catch (error) {
    console.error('❌ Error al hacer like:', error);
    res.status(500).send('Error del servidor');
  }
});

// FAVORITE - toggle
router.post('/:id/unfavorite', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post no encontrado');

    await post.toggleFavorite(req.user._id);
    res.redirect(req.headers.referer || '/');
  } catch (error) {
    console.error('❌ Error al hacer favorito:', error);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;
