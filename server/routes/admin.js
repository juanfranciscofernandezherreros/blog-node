const express = require('express');
const router = express.Router();

router.get('/admin', (req, res) => {
    res.render('admin/login', { layout: 'layouts/login' }); // ✅ Usando el layout correcto
});


router.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard'); // ✅ Usando el layout correcto
});

router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (email === "admin@example.com" && password === "admin123") {
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { layout: 'layouts/login', error: 'Credenciales incorrectas' });
    }
});


module.exports = router;
