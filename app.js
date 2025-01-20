const express = require('express');
const app = express();
const mainRouter = require('./server/routes/main'); // Asegúrate de que esta ruta sea correcta
const expressLayout = require('express-ejs-layouts');
//Configuracion de DB
const connectDB = require('./server/config/db');
// Configuración de EJS
app.use(express.static('public'));

// Templating Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Usa el enrutador
app.use('/', mainRouter);

// Inicia el servidor
const PORT = process.env.PORT || 3000;

// Connect to DB
connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
