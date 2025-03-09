require('dotenv').config(); // ✅ Carga las variables de entorno al inicio

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');

// Modelos de Tags y Categorías
const Tag = require('./server/models/Tags'); 
const Category = require('./server/models/Category'); 
const Post = require('./server/models/Post'); // Importa el modelo de Post
const Comment = require('./server/models/Comment'); // Importa el modelo de Comentarios

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Conectar a la base de datos
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
app.use(async (req, res, next) => {
  try {
    const randomPosts = await Post.aggregate([
      { $match: req.queryFilter }, // Aplicar filtro de artículos visibles
      { $sample: { size: 3 } }
    ]);

    res.locals.randomPosts = randomPosts || []; // Asignamos los artículos a `res.locals`
  } catch (error) {
    console.error("❌ Error al obtener artículos aleatorios:", error);
    res.locals.randomPosts = [];
  }
  next();
});

// Definir una variable global para perPage
app.locals.perPage = 6; // Puedes cambiar este valor según sea necesario

// ✅ Middleware para contar artículos visibles por categoría
app.use(async (req, res, next) => {
  try {
    const categoryCounts = await Post.aggregate([
      { $match: req.queryFilter }, // Solo artículos visibles
      { $group: { _id: "$category", count: { $sum: 1 } } }
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
    console.error("❌ Error al contar artículos visibles por categoría:", error);
    res.locals.categories = [];
  }
  next();
});

// ✅ Middleware para cargar los posts más comentados (solo visibles)
app.use(async (req, res, next) => {
  try {
    const popularPosts = await Post.aggregate([
      { $match: req.queryFilter }, // Solo artículos visibles
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments"
        }
      },
      { $addFields: { commentCount: { $size: "$comments" } } },
      { $sort: { commentCount: -1 } },
      { $limit: 5 }
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
app.use('/', require('./server/routes/admin'));
app.use('/dashboard/', require('./server/routes/posts'));
app.use('/dashboard/newsletter', require('./server/routes/newsletter'));
app.use('/dashboard/users', require('./server/routes/users'));
app.use('/dashboard/tags', require('./server/routes/tags'));
app.use('/dashboard/categories', require('./server/routes/categories'));
app.use('/dashboard/comments', require('./server/routes/comments'));


// Middleware para manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).render('404');
});

// 🚀 Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});