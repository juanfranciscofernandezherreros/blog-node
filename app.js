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

// 📌 Configurar el motor de plantillas
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.locals.isActiveRoute = isActiveRoute;

// 📌 Rutas
app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

// 🚀 Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
