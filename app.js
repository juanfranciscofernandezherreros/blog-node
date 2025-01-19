const express = require('express');
const app = express();
const mainRouter = require('./server/routes/main'); // Asegúrate de que la ruta sea correcta

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views'); // La carpeta 'views' está en la raíz del proyecto

// Middleware para usar el enrutador
app.use('/', mainRouter);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
