const express = require('express');
const router = express.Router();

// Ruta principal
router.get('/', (req, res) => {
    const locals = {
        title: "NodeJs Blog",
        description: "Simple Blog created with NodeJs, Express & MongoDb."
    };
    res.render('index', { locals });
});

// Ruta 'about'
router.get('/about', (req, res) => {
    res.render('about'); // Renderiza la vista 'about.ejs'
});

module.exports = router; // Exporta el enrutador correctamente
