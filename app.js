require('dotenv').config(); // ✅

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const jwt = require('jsonwebtoken'); // ⬅️ IMPORTANTE
const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

// Modelos
const Tag = require('./server/models/Tags');
const Category = require('./server/models/Category');
const Post = require('./server/models/Post');
const Comment = require('./server/models/Comment');
const User = require('./server/models/User');

const app = express();
const PORT = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET;

// ✅ Conexión a la base de datos
connectDB();


// 📌 Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// ✅ Configurar sesiones con MongoDB
app.use(session({
  secret: process.env.SECRET_SESSION || 'keyboard_cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
}));

// ✅ Servir archivos estáticos desde "public"
app.use(express.static('public'));

// ✅ Middleware global para que todas las búsquedas solo devuelvan artículos visibles
app.use((req, res, next) => {
  req.queryFilter = { isVisible: true }; // Filtro global para todas las búsquedas
  next();
});

// ✅ Cargar variables del `.env` en `res.locals` para usarlas en las vistas
app.use((req, res, next) => {
  res.locals.siteTitle = process.env.TITLE || 'Blog';
  res.locals.nameEngineer = process.env.NAME_ENGINEER || 'Admin';
  res.locals.description = process.env.DESCRIPTION || '';
  res.locals.searchByTitleOrContent = process.env.SEARCHBYTITLEORCONTENT || 'Search By Title Or Content';
  res.locals.popularposts = process.env.POPULARPOSTS || 'Popular Posts';
  res.locals.categoriesList = process.env.CATEGORIES || 'Categories';
  res.locals.tagslist = process.env.TAGSLIST || 'Tags';
  res.locals.random = process.env.RANDOM || 'Random';
  res.locals.about = process.env.ABOUT || 'About';
  res.locals.social = process.env.SOCIAL || 'Social Network';
  next();
});

// ✅ Middleware para cargar Tags y Categorías en todas las vistas
app.use(async (req, res, next) => {
  try {
    const [tags, categories] = await Promise.all([
      Tag.find({}).sort({ name: 1 }),
      Category.find({}).sort({ name: 1 })
    ]);

    res.locals.tags = tags || [];
    res.locals.categories = categories || [];

  } catch (error) {
    console.error("❌ Error al cargar Tags y Categorías:", error);
    res.locals.tags = [];
    res.locals.categories = [];
  }
  next();
});

// ✅ Middleware para obtener 3 artículos aleatorios (solo visibles)
// ✅ Middleware para obtener 3 artículos aleatorios (solo publicados y visibles)
app.use(async (req, res, next) => {
  try {
    const randomPosts = await Post.aggregate([
      {
        $match: {
          isVisible: true,      // 👈 Solo los que estén marcados como visibles
          status: 'published'   // 👈 Solo los publicados
        }
      },
      {
        $sample: { size: 3 }    // 👈 Elegir 3 al azar
      }
    ]);

    res.locals.randomPosts = randomPosts || [];
  } catch (error) {
    console.error("❌ Error al obtener artículos aleatorios:", error);
    res.locals.randomPosts = [];
  }

  next();
});


// Definir una variable global para perPage
app.locals.perPage = 6; // Puedes cambiar este valor según sea necesario

// ✅ Middleware para contar artículos visibles por categoría
// ✅ Middleware para contar artículos publicados y visibles por categoría
app.use(async (req, res, next) => {
  try {
    const categoryCounts = await Post.aggregate([
      {
        $match: {
          ...req.queryFilter,           // Esto trae { isVisible: true }
          status: 'published'            // Ahora filtramos solo los publicados
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const categories = await Category.find({}).sort({ name: 1 });

    const categoryCountMap = new Map(
      categoryCounts.map(cat => [cat._id.toString(), cat.count])
    );

    res.locals.categories = categories.map(category => ({
      _id: category._id,
      name: category.name,
      count: categoryCountMap.get(category._id.toString()) || 0
    }));

  } catch (error) {
    console.error("❌ Error al contar artículos publicados por categoría:", error);
    res.locals.categories = [];
  }
  next();
});


// Middleware global para recuperar el usuario autenticado desde el JWT
app.use(async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.locals.user = null; // Si no hay token, no hay user
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select('username email roles'); // puedes añadir más campos si quieres

    if (!user) {
      res.locals.user = null;
    } else {
      res.locals.user = user;
    }

    next();
  } catch (error) {
    console.error('❌ Error recuperando usuario autenticado:', error);
    res.locals.user = null; // Si el token es inválido o expiró
    next();
  }
});

// ✅ Middleware para cargar los posts más comentados (solo visibles)
app.use(async (req, res, next) => {
  try {

    const publishedPostFilter = { isVisible: true, status: 'published' };

    const popularPosts = await Post.aggregate([
      { $match: publishedPostFilter }, // ✅ Solo artículos publicados y visibles
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments"
        }
      },
      { $addFields: { commentCount: { $size: "$comments" } } }, // ✅ Cuenta los comentarios
      { $sort: { commentCount: -1 } }, // ✅ Ordena por más comentados
      { $limit: 5 } // ✅ Limita a los 5 más comentados
    ]);

    res.locals.popularPosts = popularPosts || [];

  } catch (error) {
    console.error("❌ Error al obtener los posts más comentados:", error);
    res.locals.popularPosts = [];
  }
  next();
});

// 📌 Configurar el motor de plantillas
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.locals.isActiveRoute = isActiveRoute;

// 📌 Rutas
app.use('/', require('./server/routes/main'));
app.use('/comments', require('./server/routes/comments_post'));
app.use('/', require('./server/routes/admin'));
app.use('/profile', require('./server/routes/profile'));
app.use('/dashboard/', require('./server/routes/posts'));
app.use('/dashboard/newsletter', require('./server/routes/newsletter'));
app.use('/dashboard/users', require('./server/routes/users'));
app.use('/auth', require('./server/routes/signup'));
app.use('/auth', require('./server/routes/signin'));
app.use('/dashboard/tags', require('./server/routes/tags'));
app.use('/dashboard/categories', require('./server/routes/categories'));
app.use('/dashboard/comments', require('./server/routes/comments'));
app.use('/auth', require('./server/routes/activate')); // ⬅️ Activa el usuario
app.use('/auth', require('./server/routes/forgot-password')); // ⬅️ Activa el usuario
app.use('/auth', require('./server/routes/resend-activation')); // ⬅️ Activa el usuario
app.use('/auth', require('./server/routes/auth'));

// Middleware para manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).render('404');
});

// 🚀 Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});