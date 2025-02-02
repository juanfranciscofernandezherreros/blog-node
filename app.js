require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB = require('./server/config/db');
const { isActiveRoute } = require('./server/helpers/routeHelpers');
const Tag = require('./server/models/Tags'); // 🔹 Importamos el modelo de Tag

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to DB
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
}));

app.use(express.static('public'));

// 🔹 Middleware para cargar los tags en todas las vistas
app.use(async (req, res, next) => {
  try {
    res.locals.tags = await Tag.find({}).sort({ name: 1 }); // Ordenar alfabéticamente
  } catch (error) {
    console.error("Error al cargar los tags:", error);
    res.locals.tags = []; // Si hay error, asigna un array vacío
  }
  next();
});

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.locals.isActiveRoute = isActiveRoute;

app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
