const express = require('express');
const expressLayout = require('express-ejs-layouts');
const connectDB = require('./server/config/db');
const mainRouter = require('./server/routes/main'); // Asegúrate de que esta ruta sea correcta
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a la base de datos
connectDB();

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    }),
    //cookie: { maxAge: new Date ( Date.now() + (3600000) ) } 
  }));
  

// Configuración del motor de plantillas
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Archivos estáticos
app.use(express.static('public'));

// Rutas
app.use('/', require('./server/routes/main'));
app.use('/', require('./server/routes/admin'));
// Arranque del servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
