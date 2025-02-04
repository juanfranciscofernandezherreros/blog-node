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

// ✅ Cargar variables del `.env` en `res.locals` para usarlas en las vistas
app.use((req, res, next) => {
  res.locals.siteTitle = process.env.TITLE || 'Blog';
  res.locals.nameEngineer = process.env.NAME_ENGINEER || 'Admin';
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

// ✅ Middleware para obtener 3 artículos aleatorios
app.use(async (req, res, next) => {
  try {
    const randomPosts = await Post.aggregate([{ $sample: { size: 3 } }]);

    res.locals.randomPosts = randomPosts || []; // Asignamos los artículos a `res.locals`
  } catch (error) {
    console.error("❌ Error al obtener artículos aleatorios:", error);
    res.locals.randomPosts = [];
  }
  next();
});

// Middleware para contar artículos por categoría
app.use(async (req, res, next) => {
  try {
    // 🔹 Obtener el conteo de artículos por categoría
    const categoryCounts = await Post.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } } // Agrupar por categoría y contar
    ]);

    // 🔹 Obtener todas las categorías y asignarles su conteo
    const categories = await Category.find({}).sort({ name: 1 });

    // 🔹 Convertir los resultados en un objeto para acceder rápido
    const categoryCountMap = {};
    categoryCounts.forEach(cat => {
      categoryCountMap[cat._id] = cat.count;
    });

    // 🔹 Añadir el número de posts a cada categoría
    const categoriesWithCount = categories.map(category => ({
      _id: category._id,
      name: category.name,
      count: categoryCountMap[category._id] || 0 // Si no hay posts en la categoría, asignar 0
    }));

    res.locals.categories = categoriesWithCount;

  } catch (error) {
    console.error("❌ Error al contar artículos por categoría:", error);
    res.locals.categories = [];
  }
  next();
});


// ✅ Middleware para cargar los posts más comentados
app.use(async (req, res, next) => {
  try {
    const popularPosts = await Post.aggregate([
      {
        $lookup: {
          from: "comments", // Nombre de la colección de comentarios en MongoDB
          localField: "_id",
          foreignField: "postId",
          as: "comments"
        }
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" }
        }
      },
      {
        $sort: { commentCount: -1 } // 🔹 Ordenar por más comentarios primero
      },
      {
        $limit: 5 // 🔹 Solo los 5 más populares
      }
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


// Middleware para manejar rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).render('404');
});


// 🚀 Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
