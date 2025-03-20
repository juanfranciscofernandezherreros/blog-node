const express = require('express');
const router = express.Router();

const User = require('../models/User');

// GET /activate/:token
router.get('/activate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // ✅ Buscar el usuario que tenga el token y que no haya expirado
    const user = await User.findOne({
      activationToken: token,
      activationTokenExpires: { $gt: Date.now() }
    });

    // ✅ Si no hay usuario o el token expiró
    if (!user) {
      return res.status(400).render('activation-failed', {
        pageTitle: 'Activación fallida',
        description: 'El enlace es inválido o ha expirado.',
        error: 'Enlace de activación no válido o expirado. Solicita un nuevo registro o contacto con el soporte.'
      });
    }

    // ✅ Activar al usuario
    user.isActive = true;
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;

    await user.save();

    console.log(`✅ Usuario ${user.username} activado correctamente`);

    res.render('activation-success', {
      pageTitle: 'Cuenta activada',
      description: '¡Tu cuenta ha sido activada! Ya puedes iniciar sesión.',
      success: '¡Activación exitosa! Ahora puedes iniciar sesión en la plataforma.'
    });

  } catch (error) {
    console.error('❌ Error en activación de usuario:', error);
    res.status(500).render('500', {
      pageTitle: 'Error del servidor',
      description: 'Ocurrió un error inesperado.'
    });
  }
});

module.exports = router;
