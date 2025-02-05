const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const router = express.Router();
const Post = require('../models/Post');
const nodemailer = require('nodemailer');
const Newsletter = require('../models/Newsletter'); // Importamos el modelo
const User = require('../models/User'); // Importa el modelo
const Comment = require('../models/Comment'); // Importa el modelo
const Category = require('../models/Category'); // Importa el modelo
const Tag = require('../models/Tags'); // Importa el modelo
require('dotenv').config(); // Cargar variables de entorno

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Gmail requiere este host
  port: process.env.SMTP_PORT || 465, // Usa 465 (SSL) o 587 (STARTTLS)
  secure: process.env.SMTP_PORT == 465, // true si es 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Evita problemas con certificados en localhost
  },
});

/**
 * POST /contact
 * Envía un correo con los datos del formulario de contacto
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
      from: `"Blog Contact" <${process.env.SMTP_USER}>`, // Usa tu correo Gmail
      to: process.env.SMTP_USER, // Recibirás el mensaje en este mismo correo
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `De: ${name} <${email}>\n\nMensaje:\n${message}`,
      html: `<p><strong>De:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
             <p><strong>Mensaje:</strong></p>
             <p>${message}</p>`
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
 * GET /
 * HOME
 */
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "Juan Francisco Fernandez Herreros | Senior Software Engineer",
      learning: "Aprende con @kiferhe"
    };

    let perPage = 10; // Cantidad de posts por página
    let page = parseInt(req.query.page) || 1;

    // 🔹 Obtener solo los posts que tienen isVisible en true
    const data = await Post.find({ isVisible: true }) // Filtra los posts visibles
      .populate('author', 'username') // Solo traer el nombre del usuario
      .populate('category', 'name') // Solo traer el nombre de la categoría
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    // Obtener el total de posts visibles
    const count = await Post.countDocuments({ isVisible: true });
    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.render('index', { 
      locals,
      data,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentRoute: '/'
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error interno del servidor");
  }
});


router.get('/articles', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "❌ Debes proporcionar una fecha en formato DD/MM/YYYY" });
    }

    // 🔹 Validar el formato de la fecha
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      return res.status(400).json({ error: "❌ Formato de fecha inválido. Usa DD/MM/YYYY" });
    }

    const [day, month, year] = dateParts.map(Number);
    if (!day || !month || !year || day > 31 || month > 12) {
      return res.status(400).json({ error: "❌ Fecha no válida. Asegúrate de que sea numérica y en formato DD/MM/YYYY" });
    }

    // 🔹 Convertir la fecha a formato UTC
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: "❌ Fecha inválida. Verifica el formato." });
    }

    let perPage = 10;
    let page = parseInt(req.query.page) || 1;

    // 🔹 Buscar los artículos creados en la fecha especificada
    const data = await Post.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    // 🔹 Contar los artículos que cumplen la condición
    const count = await Post.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // 🔹 Definir variables para la vista
    const locals = {
      title: `Artículos del ${date}`,
      description: "Lista de artículos publicados en la fecha seleccionada."
    };

    res.render('index', { 
      locals,
      data, // 🔹 Aquí cambiamos `articles` por `data`
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentRoute: `/articles?date=${date}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos:", error);
    res.status(500).json({ error: "❌ Error del servidor" });
  }
});


router.get('/articles/tags/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ error: "❌ Tag ID inválido." });
    }

    let perPage = 10; 
    let page = parseInt(req.query.page) || 1;

    // 🔹 Buscar los artículos que contienen el tag
    const articles = await Post.find({ tags: tagId })
      .populate('category', 'name')
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    // 🔹 Contar los artículos que tienen el tag
    const count = await Post.countDocuments({ tags: tagId });
    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Obtener el nombre del tag para mostrar en la vista
    const tag = await Tag.findById(tagId);
    if (!tag) {
      return res.status(404).render('404', { title: "Tag no encontrado" });
    }

    const locals = {
      title: `Artículos con el tag: ${tag.name}`,
      description: `Lista de artículos etiquetados con ${tag.name}.`
    };

    // 🔹 Aquí cambiamos 'articles' por 'data' para que coincida con la vista
    res.render('index', { 
      locals,
      data: articles,  // 🔹 Cambié "articles" por "data" para que coincida con EJS
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentRoute: `/articles/tags/${tagId}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por tag:", error);
    res.status(500).json({ error: "❌ Error del servidor" });
  }
});




router.get('/users/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const locals = {
      title: `Artículos por ${username}`
    };


    let perPage = 10; // Cantidad de posts por página
    let page = parseInt(req.query.page) || 1;

    // 🔹 Buscar el usuario por username
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).render('404', { title: "Usuario no encontrado" });
    }

    // 🔹 Obtener los posts del usuario con categoría y paginación
    const data = await Post.find({ author: user._id })
      .populate('author', 'username') // Traer el nombre del usuario
      .populate('category', 'name') // Traer el nombre de la categoría
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    // 🔹 Contar los posts del usuario
    const count = await Post.countDocuments({ author: user._id });
    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.render('index', { 
      locals,
      user,
      data,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentRoute: `/users/${req.params.username}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos del usuario:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});




/**
 * GET /category/:slug
 * Filtrar artículos por categoría y paginarlos
 */
router.get('/category/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const locals = {
      title: `Artículos por ${name}`,
      description: "Encuentra artículos relacionados en nuestro blog."
    };

    let perPage = 10; // 🔹 Cantidad de posts por página
    let page = parseInt(req.query.page) || 1;

    // 🔹 Buscar la categoría por slug (NO por name)
    const category = await Category.findOne({ name: req.params.name });

    if (!category) {
      return res.status(404).render('404', { title: "Categoría no encontrada" });
    }

    // 🔹 Obtener los posts de la categoría con autor y paginación
    const data = await Post.find({ category: category._id })
      .populate('author', 'username') // Traer el nombre del usuario
      .populate('category', 'name') // Traer el nombre y slug de la categoría
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    // 🔹 Contar los posts de la categoría
    const count = await Post.countDocuments({ category: category._id });
    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.render('index', { 
      locals,
      category,
      data,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      currentRoute: `/category/${req.params.slug}`
    });

  } catch (error) {
    console.error("❌ Error al obtener artículos por categoría:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});


/**
 * GET /post/:id
 * Muestra un artículo con comentarios anidados
 */
router.get('/post/:id', async (req, res) => {
  try {
    let postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).render('404', { title: "ID inválido" });
    }

    // 🔹 Asegúrate de hacer populate en `author` para obtener el username
    const data = await Post.findById(postId)
      .populate('author', 'username') // 🔹 Traer solo el `username` del autor

    if (!data) {
      return res.status(404).render('404', { title: "Artículo no encontrado" });
    }

    // 🔹 Obtener los comentarios relacionados con el post
    const comments = await Comment.find({ postId }).sort({ createdAt: 1 });

    res.render('post', {
      title: data.title,
      data,
      comments,
      currentRoute: `/post/${postId}`
    });

  } catch (error) {
    console.error("❌ Error al obtener el post:", error);
    res.status(500).render('500', { title: "Error del servidor" });
  }
});


/**
 * POST /post/:id/comment
 * Agregar un comentario o responder a uno
 */
router.post('/post/:id/comment', async (req, res) => {
  try {
    let postId = req.params.id;
    let { author, body, parentId } = req.body;

    if (!author.trim() || !body.trim()) {
      return res.redirect(`/post/${postId}?error=Campos obligatorios`);
    }

    const newComment = new Comment({
      postId,
      parentId: parentId || null,
      author,
      body
    });

    await newComment.save();
    res.redirect(`/post/${postId}`);

  } catch (error) {
    console.error("Error al agregar comentario:", error);
    res.redirect(`/post/${postId}?error=Error al guardar el comentario`);
  }
});

/**
 * Función para construir una estructura de comentarios anidados
 */
function buildNestedComments(comments, parentId = null) {
  return comments
    .filter(comment => String(comment.parentId) === String(parentId))
    .map(comment => ({
      ...comment.toObject(),
      replies: buildNestedComments(comments, comment._id) // 🔹 Llamada recursiva correcta
    }));
}



/**
 * POST /
 * Post - searchTerm
 */
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Validar datos si es necesario
  if (!name || !email || !message) {
    return res.status(400).render('contact', {
      currentRoute: '/contact',
      error: 'Todos los campos son obligatorios.',
    });
  }

  // Aquí puedes procesar los datos, como enviarlos a una base de datos o por correo
  console.log(`Contacto recibido: Nombre: ${name}, Email: ${email}, Mensaje: ${message}`);

  // Renderizar la página de contacto con un mensaje de éxito
  res.render('contact', {
    currentRoute: '/contact',
    success: 'Tu mensaje ha sido enviado con éxito.',
  });
});


/**
 * POST /
 * Post - searchTerm
 */
router.post('/search', async (req, res) => {
  try {
    const locals = {
      title: "Search",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    };

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    res.render("search", {
      data,
      locals,
      currentRoute: '/'
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * About
 */
router.get('/about', (req, res) => {
  res.render('about', {
    currentRoute: '/about'
  });
});


/**
 * GET /
 * Signup
 */
router.get('/signup', (req, res) => {
  res.render('signup', {
    currentRoute: '/signup'
  });
});



router.post('/newsletter', async (req, res) => {
  const { email } = req.body;

  console.log("Datos recibidos del formulario:", { email });

  // Validación básica
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'El campo de email es obligatorio.' });
  }

  try {
    // Intentamos guardar el correo en la base de datos
    const newSubscription = new Newsletter({ email });
    await newSubscription.save();

    res.json({ success: 'Te has suscrito con éxito al boletín.' });
  } catch (error) {
    if (error.code === 11000) { // Código de error para duplicados en MongoDB
      return res.status(400).json({ error: 'Este email ya está suscrito.' });
    }
    console.error('Error al suscribirse:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar tu solicitud.' });
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

/**
 * Insert sample data into the database
 */
async function insertPostData() {
  try {
    await Post.insertMany([
      {
        title: "Building APIs with Node.js",
        body: "Learn how to use Node.js to build RESTful APIs using frameworks like Express.js."
      },
      {
        title: "Deployment of Node.js applications",
        body: "Understand the different ways to deploy your Node.js applications, including on-premises, cloud, and container environments."
      },
      {
        title: "Authentication and Authorization in Node.js",
        body: "Learn how to add authentication and authorization to your Node.js web applications using Passport.js or other authentication libraries."
      },
      {
        title: "Understand how to work with MongoDB and Mongoose",
        body: "Understand how to work with MongoDB and Mongoose, an Object Data Modeling (ODM) library, in Node.js applications."
      },
      {
        title: "Build real-time, event-driven applications in Node.js",
        body: "Learn how to use Socket.io to build real-time, event-driven applications in Node.js."
      },
      {
        title: "Discover how to use Express.js",
        body: "Discover how to use Express.js, a popular Node.js web framework, to build web applications."
      },
      {
        title: "Asynchronous Programming with Node.js",
        body: "Explore the asynchronous nature of Node.js and how it allows for non-blocking I/O operations."
      },
      {
        title: "Learn the basics of Node.js and its architecture",
        body: "Learn the basics of Node.js and its architecture, how it works, and why it is popular among developers."
      },
      {
        title: "NodeJs Limiting Network Traffic",
        body: "Learn how to limit network traffic."
      },
      {
        title: "Learn Morgan - HTTP Request logger for NodeJs",
        body: "Learn Morgan."
      },
    ]);
    console.log("Sample data inserted successfully!");
  } catch (error) {
    console.log("Error inserting sample data:", error);
  }
}

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  console.log("Datos recibidos del formulario:", { username, password });

  // Validación básica
  if (!username.trim() || !password.trim()) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar en la base de datos
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ success: 'Usuario registrado con éxito.' });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: 'Ocurrió un error al procesar tu registro.' });
  }
});

router.post('/keyword/search', async (req, res) => {
  try {
    const { keyword } = req.body;
    let perPage = 10; // 🔹 Cantidad de resultados por página
    let page = parseInt(req.query.page) || 1; // 🔹 Página actual (por defecto es 1)

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ error: 'Debes ingresar una palabra clave válida.' });
    }

    // 🔹 Limpiar la palabra clave de caracteres especiales
    const sanitizedKeyword = keyword.trim().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "");

    // 🔹 Contar el total de documentos que coinciden con la búsqueda (solo visibles)
    const count = await Post.countDocuments({
      isVisible: true, // 🔹 Filtrar solo artículos visibles
      $or: [
        { title: { $regex: sanitizedKeyword, $options: 'i' } },
        { body: { $regex: sanitizedKeyword, $options: 'i' } }
      ]
    });

    // 🔹 Calcular total de páginas
    const totalPages = Math.ceil(count / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // 🔹 Obtener los resultados con paginación (solo artículos visibles)
    const data = await Post.find({
      isVisible: true, // 🔹 Filtrar solo artículos visibles
      $or: [
        { title: { $regex: sanitizedKeyword, $options: 'i' } },
        { body: { $regex: sanitizedKeyword, $options: 'i' } }
      ]
    })
    .populate('author', 'username')
    .populate('category', 'name')
    .sort({ createdAt: -1 }) // 🔹 Ordenar por fecha más reciente
    .skip(perPage * (page - 1)) // 🔹 Saltar los elementos de páginas anteriores
    .limit(perPage); // 🔹 Limitar a `perPage` resultados

    if (!data.length) {
      return res.render('index', {
        title: `Resultados para: "${keyword}"`,
        message: 'No se encontraron resultados para la palabra clave proporcionada.',
        data: [],
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        keyword, // 🔹 Para mantener la palabra clave en la URL de paginación
        currentRoute: 'index'
      });
    }

    res.render('search_results', {
      title: `Resultados para: "${keyword}"`,
      data,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      keyword, // 🔹 Se pasa la palabra clave a la vista para mantener la búsqueda en paginación
      currentRoute: 'index'
    });

  } catch (error) {
    console.error("❌ Error en la búsqueda por palabra clave:", error);
    res.status(500).json({ error: "Error del servidor. Intenta nuevamente más tarde." });
  }
});

// Uncomment the following line to insert sample data (run only once)
//insertPostData();


module.exports = router;