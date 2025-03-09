const express = require('express');
const User = require('../models/User'); 
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Ruta al layout (opcional si usas layouts en EJS)
const adminLayout = '../views/layouts/admin'; // Asegúrate que este path es correcto

/**
 * ✅ GET /user
 * Muestra el perfil del usuario autenticado (Solo autenticados pueden acceder)
 */
router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log(`📌 Perfil solicitado por el usuario autenticado: ${req.user.username}`);
    
    res.render('profile', {
      pageTitle: 'Perfil de Usuario',
      description: 'Aquí puedes ver la información de tu cuenta',
      layout: adminLayout,  // ✅ Solo si usas express-ejs-layouts o un motor que soporte layouts
      user: req.user
    });

  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).render('500', {
      pageTitle: 'Error interno',
      description: 'Ocurrió un error al obtener el perfil'
    });
  }
});

module.exports = router;
