const express = require('express');
const router = express.Router();

// Define tus rutas
router.get('/', (req, res) => {
    res.render('index'); // Renderiza la vista 'index.ejs'
});

// Define tus rutas
router.get('/about', (req, res) => {
    res.render('about'); // Renderiza la vista 'index.ejs'
});

module.exports = router; // Exporta el enrutador correctamente
