const express = require('express');
const router = express.Router();
const User = require('../models/User');
const transporter = require('../utils/email');
const { createLog } = require('../middlewares/logger'); // Si quieres registrar el reenvío de activación
const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';

/* ===========================
    GET /resend-activation
=========================== */
router.get('/resend-activation', (req, res) => {
  res.render('auth/resend-activation', {
    pageTitle: 'Reenviar Enlace de Activación',
    description: 'Introduce tu email para recibir nuevamente el enlace de activación',
    success: null,
    error: null
  });
});

/* ===========================
    POST /resend-activation
=========================== */
router.post('/resend-activation', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.render('auth/resend-activation', {
        pageTitle: 'Reenviar Enlace de Activación',
        description: 'Introduce tu email para recibir nuevamente el enlace de activación',
        success: null,
        error: 'El correo electrónico es obligatorio.'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.render('auth/resend-activation', {
        pageTitle: 'Reenviar Enlace de Activación',
        description: 'Introduce tu email para recibir nuevamente el enlace de activación',
        success: null,
        error: 'No existe ninguna cuenta con ese correo electrónico.'
      });
    }

    // ⚠️ Bloqueado = no permitimos activar ni reenviar enlaces
    if (user.isBlocked) {
      return res.render('auth/resend-activation', {
        pageTitle: 'Reenviar Enlace de Activación',
        description: 'Introduce tu email para recibir nuevamente el enlace de activación',
        success: null,
        error: 'Tu cuenta está bloqueada. Contacta con el soporte.'
      });
    }

    if (user.isActive) {
      return res.render('auth/resend-activation', {
        pageTitle: 'Reenviar Enlace de Activación',
        description: 'Introduce tu email para recibir nuevamente el enlace de activación',
        success: null,
        error: 'La cuenta ya está activada.'
      });
    }

    // Generar un nuevo token de activación
    const activationToken = user.generateActivationToken();
    await user.save();

    const activationLink = `${baseUrl}/auth/activate/${activationToken}`;

    // Enviar el email de activación
    await transporter.sendMail({
      from: `"Blog App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Activa tu cuenta',
      html: `
        <h1>Hola, ${user.username}</h1>
        <p>Gracias por registrarte. Haz clic en el siguiente enlace para activar tu cuenta:</p>
        <p><a href="${activationLink}">Activar cuenta</a></p>
        <p>Este enlace expirará en 24 horas.</p>
      `
    });

    console.log(`📧 Email de activación reenviado a: ${user.email}`);

    // Registrar en logs si lo deseas
    await createLog({
      entity: 'User',
      action: 'RESEND_ACTIVATION',
      entityId: user._id,
      performedBy: user._id,
      after: {
        activationToken: user.activationToken,
        activationTokenExpires: user.activationTokenExpires
      }
    });

    res.render('auth/resend-activation', {
      pageTitle: 'Reenviar Enlace de Activación',
      description: 'Introduce tu email para recibir nuevamente el enlace de activación',
      success: 'Te hemos enviado un nuevo enlace de activación a tu correo electrónico.',
      error: null
    });

  } catch (error) {
    console.error('❌ Error al reenviar activación:', error);

    res.render('auth/resend-activation', {
      pageTitle: 'Reenviar Enlace de Activación',
      description: 'Introduce tu email para recibir nuevamente el enlace de activación',
      success: null,
      error: 'Error interno del servidor. Inténtalo de nuevo más tarde.'
    });
  }
});

module.exports = router;
