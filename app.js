const express = require('express');
const app = express();
const mainRouter = require('./server/routes/main'); // Asegúrate de que esta ruta sea correcta
const expressLayout = require('express-ejs-layouts');

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
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
