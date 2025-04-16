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

// ✅ Filtros comunes para posts publicados y visibles
const today = new Date();
today.setUTCHours(23, 59, 59, 999);

const publishedPostFilter = {
  isVisible: true,
  status: 'published',
  publishDate: { $lte: today }
};

// ✅ Helper: obtener publicaciones recientes
const getRecentPosts = async (limit = 5) => {
  return await Post.find(publishedPostFilter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'username')
    .populate('category', 'name');
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
/**
 * POST /post/:slug/favorite
 */
router.post('/post/:slug/favorite', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ slug });

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

    // Redirigir usando el slug
    res.redirect(`/post/${post.slug}`);
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

    res.redirect(`/post/${post.slug}`);

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

    const perPage = req.app.locals.perPage || 4;
    const page = parseInt(req.query.page) || 1;

    const data = await Post.aggregate([
      { $match: publishedPostFilter },
      { $sort: { createdAt: -1 } },
    
      // 👉 Traer la categoría
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
    
      // 👉 Traer el autor
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
    
      // ✅ 👉 Traer los tags si son referencias (solo si usas ObjectId)
      {
        $lookup: {
          from: "tags",
          localField: "tags",
          foreignField: "_id",
          as: "tags"
        }
      },
    
      // 👉 Qué campos queremos mostrar
      {
        $project: {
          title: 1,
          slug: 1,
          summary: 1,
          images: 1,
          tags: 1, // ✅ los tags ya vienen del lookup
          publishDate: 1,
          "category.name": 1,
          "category.slug": 1,
          "author.username": 1,
          formattedPublishDate: {
            $dateToString: { format: "%d-%m-%Y", date: "$publishDate" }
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

// ✅ ARTÍCULOS POR FECHA DE PUBLICACIÓN

// 🧨 FILTRAR ARTÍCULOS POR FECHA EXACTA
router.get('/articles', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return res.status(400).json({ error: "❌ Formato de fecha inválido. Usa DD-MM-YYYY" });
    }

    const [day, month, year] = date.split('-').map(Number);
    const filterDate = new Date(Date.UTC(year, month - 1, day));

    // Día siguiente para filtrar entre 00:00 y 23:59 UTC
    const nextDay = new Date(filterDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const perPage = req.app.locals.perPage || 10;
    const page = parseInt(req.query.page) || 1;

    const data = await Post.aggregate([
      {
        $match: {
          publishDate: { $gte: filterDate, $lt: nextDay },
          status: 'published',
          isVisible: true
        }
      },
      { $sort: { createdAt: -1 } },

      // Traer categoría
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

      // Traer autor
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

      // Traer tags
      {
        $lookup: {
          from: "tags",
          localField: "tags",
          foreignField: "_id",
          as: "tags"
        }
      },

      // Proyección final
      {
        $project: {
          title: 1,
          slug: 1,
          summary: 1,
          images: 1,
          tags: 1,
          publishDate: 1,
          "category.name": 1,
          "category.slug": 1,
          "author.username": 1,
          formattedPublishDate: {
            $dateToString: { format: "%d-%m-%Y", date: "$publishDate" }
          }
        }
      },

      { $skip: perPage * (page - 1) },
      { $limit: perPage }
    ]).allowDiskUse(true);

    const count = await Post.countDocuments({
      publishDate: { $gte: filterDate, $lt: nextDay },
      status: 'published',
      isVisible: true
    });

    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    if (data.length === 0) {
      return res.render('index', {
        locals: {
          title: `Sin artículos el ${date}`,
          description: `No hay artículos publicados exactamente el ${date}.`
        },
        data: [],
        recentPosts,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        currentRoute: `/articles?date=${date}`
      });
    }

    res.render('index', {
      locals: {
        title: `Artículos del ${date}`,
        description: `Lista de artículos publicados el ${date}.`
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
    console.error("❌ Error en /articles:", error);
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

/**
 * GET /articles/users/:username
 * Lista los artículos publicados por un autor (usuario) específico
 */
router.get('/articles/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const perPage = req.app.locals.perPage || 10;
    const page = parseInt(req.query.page) || 1;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).render('404', { title: "Usuario no encontrado" });
    }

    const query = { author: user._id, ...publishedPostFilter };

    const posts = await Post.find(query)
      .populate('category', 'name slug')
      .populate('author', 'username')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    // ✅ Formatear fecha publishDate en dd-MM-yyyy
    posts.forEach(post => {
      if (post.publishDate instanceof Date) {
        const date = new Date(post.publishDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        post.formattedPublishDate = `${day}-${month}-${year}`;
      }
    });

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Artículos de ${user.username}`,
        description: `Lista de artículos escritos por ${user.username}.`
      },
      data: posts,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/articles/users/${username}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por usuario:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});


/**
 * GET /articles/categories/:slug
 * Lista los artículos publicados que pertenecen a una categoría específica
 */
router.get('/articles/categories/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const perPage = req.app.locals.perPage || 10;
    const page = parseInt(req.query.page) || 1;

    const category = await Category.findOne({ slug });
    if (!category) {
      return res.status(404).render('404', { title: "Categoría no encontrada" });
    }

    const query = { category: category._id, ...publishedPostFilter };

    const posts = await Post.find(query)
      .populate('category', 'name slug')
      .populate('author', 'username')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    // Añadir fecha formateada a cada post (si no lo haces en el schema o con agregación)
    posts.forEach(post => {
      if (post.publishDate instanceof Date) {
        const date = new Date(post.publishDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        post.formattedPublishDate = `${day}-${month}-${year}`;
      }
    });
    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Artículos en la categoría: ${category.name}`,
        description: `Lista de artículos clasificados bajo la categoría "${category.name}".`
      },
      data: posts,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/articles/categories/${slug}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por categoría (slug):", error);
    res.status(500).json({ error: "❌ Error del servidor" });
  }
});


// ✅ ARTÍCULOS POR TAG (usando slug)
router.get('/articles/tags/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const perPage = req.app.locals.perPage;
    const page = parseInt(req.query.page) || 1;

    const tag = await Tag.findOne({ slug });
    if (!tag) {
      return res.status(404).render('404', { title: "Tag no encontrado" });
    }

    const query = { tags: tag._id, ...publishedPostFilter };

    const posts = await Post.find(query)
      .populate('category', 'name slug')
      .populate('author', 'username')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    // ✅ Formatear fecha publishDate en dd-MM-yyyy
    posts.forEach(post => {
      if (post.publishDate instanceof Date) {
        const date = new Date(post.publishDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        post.formattedPublishDate = `${day}-${month}-${year}`;
      }
    });

    const count = await Post.countDocuments(query);
    const totalPages = Math.ceil(count / perPage);
    const recentPosts = await getRecentPosts();

    res.render('index', {
      locals: {
        title: `Artículos con el tag: ${tag.name}`,
        description: `Lista de artículos etiquetados con ${tag.name}.`
      },
      data: posts,
      recentPosts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentRoute: `/articles/tags/${slug}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por tag (slug):", error);
    res.status(500).json({ error: "❌ Error del servidor" });
  }
});



router.get('/post/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug })
      .populate('author', 'username')
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('likes', '_id')
      .populate('favoritedBy', '_id');

    if (!post) {
      return res.status(404).render('404', { title: "Artículo no encontrado" });
    }

    const postId = post._id.toString();
    const user = req.user;
    const userId = user?._id?.toString();

    const isLiked = userId ? post.likes.some(u => u._id.toString() === userId) : false;
    const isFavorited = userId ? post.favoritedBy.some(u => u._id.toString() === userId) : false;

    const comments = await getNestedComments(postId);
    const recentPosts = await getRecentPosts();

    res.render('post', {
      title: post.title,
      data: post,
      comments,
      recentPosts,
      currentRoute: `/post/${slug}`,
      isLiked,
      isFavorited,
      likesCount: post.likes.length,
      favoritesCount: post.favoritedBy.length,
      user // <-- ¡ESTO ES CLAVE!
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
  
  const locals = {
    title: "Formulario de Contacto",
  };

  res.render('contact', {
    locals,
    currentRoute: '/contact'
  });
});

/**
 * GET /
 * contact
 */
router.get('/newsletter', (req, res) => {
  
  const locals = {
    title: "Newsletter",
  };

  res.render('newsletter', {
    locals,
    currentRoute: '/newsletter'
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