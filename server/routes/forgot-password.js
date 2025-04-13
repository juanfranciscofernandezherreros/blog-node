const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const transporter = require('../utils/email');
const User = require('../models/User');
const { createLog } = require('../middlewares/logger');

const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';

/* ===========================
    GET /forgot-password
=========================== */
router.get('/forgot-password', (req, res) => {
  const message = req.query.message;
  const locals = {
    title: "Reset password",
  };
  res.render('auth/forgot-password', {
    locals,
    pageTitle: 'Recuperar Contraseña',
    description: 'Introduce tu email para recuperar tu contraseña',
    success: message || null,
    error: null
  });
});

/* ===========================
    POST /forgot-password
=========================== */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validación básica
    if (!email) {
      return res.render('forgot-password', {
        pageTitle: 'Recuperar Contraseña',
        description: 'Introduce tu email para recuperar tu contraseña',
        error: 'El email es obligatorio',
        success: null
      });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('forgot-password', {
        pageTitle: 'Recuperar Contraseña',
        description: 'Introduce tu email para recuperar tu contraseña',
        error: 'No se encontró ninguna cuenta con ese correo',
        success: null
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hora

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;

    await user.save();

    // Guardar log de solicitud de recuperación
    await createLog({
      entity: 'User',
      action: 'FORGOT_PASSWORD',
      entityId: user._id,
      performedBy: user._id,
      after: {
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpires: user.resetPasswordExpires
      }
    });

    console.log('✅ Solicitud de recuperación registrada y log guardado');

    // Enviar email de recuperación
    const resetLink = `${baseUrl}/auth/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Blog App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Recupera tu contraseña',
      html: `
        <h1>Hola, ${user.username}</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para restablecerla:</p>
        <p><a href="${resetLink}">Restablecer contraseña</a></p>
        <p>Este enlace expirará en 1 hora.</p>
      `
    });

    console.log(`📧 Email de recuperación enviado a: ${user.email}`);

    res.redirect('/auth/forgot-password?message=Te hemos enviado un enlace para restablecer tu contraseña.');

  } catch (error) {
    console.error('❌ Error en forgot-password:', error);

    res.status(500).render('forgot-password', {
      pageTitle: 'Recuperar Contraseña',
      description: 'Introduce tu email para recuperar tu contraseña',
      error: 'Error interno del servidor',
      success: null
    });
  }
});

/* ===========================
    GET /reset-password/:token
=========================== */
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;



  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/auth/forgot-password?message=El enlace es inválido o ha expirado.');
    }

    res.render('auth/reset-password', {
      pageTitle: 'Restablecer Contraseña',
      description: 'Introduce tu nueva contraseña',
      token,
      success: null,
      error: null
    });

  } catch (error) {
    console.error('❌ Error en GET reset-password:', error);
    res.redirect('auth/forgot-password?message=Error al procesar el enlace.');
  }
});

/* ===========================
    POST /reset-password/:token
=========================== */
/* ===========================
    POST /reset-password/:token
=========================== */
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    // Validaciones básicas
    if (!password || !confirmPassword) {
      return res.render('auth/reset-password', { // corregido: 'auth/reset-password'
        pageTitle: 'Restablecer Contraseña',
        description: 'Introduce tu nueva contraseña',
        token,
        error: 'Todos los campos son obligatorios',
        success: null
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/reset-password', {
        pageTitle: 'Restablecer Contraseña',
        description: 'Introduce tu nueva contraseña',
        token,
        error: 'Las contraseñas no coinciden',
        success: null
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect('/auth/forgot-password?message=El enlace es inválido o ha expirado.');
    }

    const oldPassword = user.password;

    // ⚠️ Solo asigna el password sin hashearlo
    user.password = password; // Tu pre-save hook lo encripta automáticamente
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Guardar log del cambio de contraseña
    await createLog({
      entity: 'User',
      action: 'RESET_PASSWORD',
      entityId: user._id,
      performedBy: user._id,
      before: { password: oldPassword },
      after: { password: user.password }
    });

    console.log('✅ Contraseña restablecida y log guardado');

    res.redirect('/auth/signin?message=Tu contraseña se ha restablecido con éxito.');

  } catch (error) {
    console.error('❌ Error en POST reset-password:', error);

    res.status(500).render('auth/reset-password', {
      pageTitle: 'Restablecer Contraseña',
      description: 'Introduce tu nueva contraseña',
      token,
      error: 'Error interno del servidor',
      success: null
    });
  }
});

module.exports = router;
