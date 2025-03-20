const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

const Post = require('../models/Post');
const Newsletter = require('../models/Newsletter');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const Tag = require('../models/Tags');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { createLog } = require('../middlewares/logger');

// ✅ Filtros comunes para posts publicados y visibles
const publishedPostFilter = { isVisible: true, status: 'published' };

// ✅ Helper: obtener publicaciones recientes
const getRecentPosts = async (limit = 5) => {
  return await Post.find(publishedPostFilter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'username')
    .populate('category', 'name');
};

// ✅ Helper: obtener post por ID considerando el rol del usuario
const getPostByRole = async (postId, user) => {
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('editor');
  const filter = isAdmin
    ? { _id: postId }
    : { _id: postId, ...publishedPostFilter };

  return await Post.findOne(filter)
    .populate('author', 'username')
    .populate('likes', 'username')
    .populate('favoritedBy', 'username');
};

// ✅ Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

/**
 * POST /contact
 */
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).render('contact', {
      currentRoute: '/contact',
      error: 'Todos los campos son obligatorios.',
      name,
      email,
      message
    });
  }

  try {
    await transporter.sendMail({
      from: `"Blog Contact" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `De: ${name} <${email}>\n\nMensaje:\n${message}`,
      html: `<p><strong>De:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p><p><strong>Mensaje:</strong></p><p>${message}</p>`
    });

    res.render('contact', {
      currentRoute: '/contact',
      success: 'Tu mensaje ha sido enviado con éxito.'
    });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).render('contact', {
      currentRoute: '/contact',
      error: 'Hubo un error al enviar tu mensaje. Intenta de nuevo más tarde.'
    });
  }
});

/**
 * POST /post/:id/favorite
 */
router.post('/post/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).render('404', { title: "ID de post inválido" });
    }

    const post = await Post.findById(postId);
    if (!post || (!post.isVisible || post.status !== 'published')) {
      return res.status(404).render('404', { title: "Post no encontrado" });
    }

    const alreadyFavorited = post.favoritedBy.includes(userId);

    if (alreadyFavorited) {
      post.favoritedBy.pull(userId);
    } else {
      post.favoritedBy.push(userId);
    }

    await post.save();

    res.redirect(`/post/${postId}`); // Aquí redirige al detalle del post

  } catch (error) {
    console.error("❌ Error al añadir a favoritos:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});

/**
 * POST /post/:id/like
 */
router.post('/post/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).render('404', { title: "ID de post inválido" });
    }

    const post = await Post.findById(postId);
    if (!post || (!post.isVisible || post.status !== 'published')) {
      return res.status(404).render('404', { title: "Post no encontrado" });
    }

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.redirect(`/post/${postId}`); // Redirige al detalle del post

  } catch (error) {
    console.error("❌ Error al dar like:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});


// ✅ HOME - Lista de posts
router.get('/', async (req, res) => {
  try {
    const locals = {
      title: "Juan Francisco Fernandez Herreros | Senior Software Engineer",
      learning: "Aprende con @kiferhe"
    };

    const perPage = req.app.locals.perPage || 10;
    const page = parseInt(req.query.page) || 1;

    const data = await Post.aggregate([
      { $match: publishedPostFilter },
      { $sort: { createdAt: -1 } },
      { 
        $lookup: { 
          from: "categories", 
          localField: "category", 
          foreignField: "_id", 
          as: "category" 
        } 
      },
      { 
        $unwind: { 
          path: "$category", 
          preserveNullAndEmptyArrays: true 
        } 
      },
      { 
        $lookup: { 
          from: "users", 
          localField: "author", 
          foreignField: "_id", 
          as: "author" 
        } 
      },
      { 
        $unwind: { 
          path: "$author", 
          preserveNullAndEmptyArrays: true 
        } 
      },
      {
        $project: {
          title: 1,
          summary: 1, // ✅ Incluimos el resumen del post
          publishDate: 1,
          "category.name": 1,
          "author.username": 1,
          formattedPublishDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$publishDate" }
          }
        }
      },
      { $skip: perPage * (page - 1) },
      { $limit: perPage }
    ]).allowDiskUse(true);

    const count = await Post.countDocuments(publishedPostFilter);
    const totalPages = Math.ceil(count / perPage);

    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals,
      data,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: '/'
    });

  } catch (error) {
    console.error("❌ Error en la paginación:", error);
    res.status(500).send("Error interno del servidor");
  }
});


// ✅ ARTÍCULOS POR FECHA
router.get('/articles', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return res.status(400).json({ error: "❌ Debes proporcionar una fecha válida en formato DD/MM/YYYY" });
    }

    const [day, month, year] = date.split('/').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const perPage = req.app.locals.perPage;
    const page = parseInt(req.query.page) || 1;

    const query = {
      createdAt: { $gte: startDate, $lte: endDate },
      ...publishedPostFilter
    };

    const data = await Post.find(query)
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Artículos del ${date}`,
        description: "Lista de artículos publicados en la fecha seleccionada."
      },
      data,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/articles?date=${date}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos:", error);
    res.status(500).json({ error: "❌ Error del servidor" });
  }
});

/**
 * POST /keyword/search
 * Busca artículos publicados por palabra clave
 */
router.post('/keyword/search', async (req, res) => {
  try {
    const keyword = req.body.keyword;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).render('index', {
        locals: {
          title: 'Búsqueda',
          description: 'Resultados de la búsqueda'
        },
        data: [],
        recentPosts: await getRecentPosts(),
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        error: '❌ Debes proporcionar una palabra clave.',
        currentRoute: '/keyword/search'
      });
    }

    const perPage = req.app.locals.perPage || 10;
    const page = 1; // Por POST no tiene sentido paginar directamente, si quieres lo adaptamos luego

    const searchRegex = new RegExp(keyword.trim(), 'i');

    const query = {
      ...publishedPostFilter,
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    };

    const data = await Post.find(query)
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(perPage);

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Resultados de búsqueda para: "${keyword}"`,
        description: `Artículos que contienen la palabra clave "${keyword}".`
      },
      data,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: '/keyword/search'
    });

  } catch (error) {
    console.error('❌ Error en la búsqueda por keyword:', error);
    res.status(500).render('500', { title: 'Error del servidor' });
  }
});


// ✅ ARTÍCULOS POR TAG
router.get('/articles/tags/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ error: "❌ Tag ID inválido." });
    }

    const perPage = req.app.locals.perPage;
    const page = parseInt(req.query.page) || 1;

    const query = { tags: tagId, ...publishedPostFilter };

    const data = await Post.find(query)
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const tag = await Tag.findById(tagId);
    const recentPosts = await getRecentPosts();

    if (!tag) return res.status(404).render('404', { title: "Tag no encontrado" });

    res.render('index', {
      locals: {
        title: `Artículos con el tag: ${tag.name}`,
        description: `Lista de artículos etiquetados con ${tag.name}.`
      },
      data,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/articles/tags/${tagId}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por tag:", error);
    res.status(500).json({ error: "❌ Error del servidor" });
  }
});

// ✅ ARTÍCULOS POR USUARIO
router.get('/users_articles/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).render('404', { title: "Usuario no encontrado" });

    const perPage = req.app.locals.perPage;
    const page = parseInt(req.query.page) || 1;

    const query = { author: user._id, ...publishedPostFilter };

    const data = await Post.find(query)
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Artículos por ${username}`
      },
      data,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/users/${username}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos del usuario:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});

// ✅ ARTÍCULOS POR CATEGORÍA
router.get('/category/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const category = await Category.findOne({ name });
    if (!category) return res.status(404).render('404', { title: "Categoría no encontrada" });

    const perPage = req.app.locals.perPage;
    const page = parseInt(req.query.page) || 1;

    const query = { category: category._id, ...publishedPostFilter };

    const data = await Post.find(query)
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Artículos por ${name}`,
        description: "Encuentra artículos relacionados en nuestro blog."
      },
      data,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/category/${name}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por categoría:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});

// ✅ POST DETALLE
router.get('/post/:id', async (req, res) => {
  try {
    const { id: postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).render('404', { title: "ID inválido" });
    }

    const post = await Post.findById(postId)
      .populate('author', 'username')
      .populate('category', 'name')
      .populate('tags', 'name');

    if (!post) return res.status(404).render('404', { title: "Artículo no encontrado" });

    const comments = await getNestedComments(postId);
    const recentPosts = await getRecentPosts();

    let user = req.user;
    const userId = user?._id?.toString();

    const isLiked = userId ? post.likes.some(u => u._id.toString() === userId) : false;
    const isFavorited = userId ? post.favoritedBy.some(u => u._id.toString() === userId) : false;

    res.render('post', {
      title: post.title,
      data: post,
      comments,
      recentPosts,
      currentRoute: `/post/${postId}`,
      isLiked,
      isFavorited,
      likesCount: post.likes.length,
      favoritesCount: post.favoritedBy.length,
      postStatus: post.status
    });

  } catch (error) {
    console.error("❌ Error al obtener el post:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});


/**
 * GET /
 * contact
 */
router.get('/contact', (req, res) => {
  res.render('contact', {
    currentRoute: '/contact'
  });
});

// ✅ FUNCIONES AUXILIARES
async function getNestedComments(postId) {
  const comments = await Comment.find({ postId }).sort({ createdAt: 1 }).lean();
  const map = {};
  comments.forEach(c => (map[c._id] = { ...c, replies: [] }));

  const nested = [];
  comments.forEach(c => {
    if (c.parentId) {
      map[c.parentId]?.replies.push(map[c._id]);
    } else {
      nested.push(map[c._id]);
    }
  });

  return nested;
}

module.exports = router;
