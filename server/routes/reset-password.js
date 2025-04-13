// GET /reset-password/:token
router.get('/reset-password/:token', async (req, res) => {
  const locals = {
    title: "Reset password",
  };
  const { token } = req.params;
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() } // El token no expiró
      });
  
      if (!user) {
        req.session.error = 'El enlace es inválido o ha expirado.';
        return res.redirect('/auth/forgot-password');
      }
  
      res.render('auth/reset-password', {
        locals,
        pageTitle: 'Restablecer Contraseña',
        description: 'Ingresa una nueva contraseña',
        token
      });
  
    } catch (error) {
      console.error(error);
      req.session.error = 'Error al validar el enlace.';
      res.redirect('/auth/forgot-password');
    }
  });
  
  // POST /reset-password/:token
  router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
  
    if (!password) {
      req.session.error = 'La nueva contraseña es obligatoria.';
      return res.redirect(`/auth/reset-password/${token}`);
    }
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        req.session.error = 'El enlace es inválido o ha expirado.';
        return res.redirect('/auth/forgot-password');
      }
  
      // ✅ Cambiar la contraseña y limpiar el token
      user.password = password; // Hashea la contraseña en producción
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      await user.save();
  
      req.session.success = 'Tu contraseña ha sido restablecida.';
      res.redirect('/auth/signin');
  
    } catch (error) {
      console.error(error);
      req.session.error = 'Error al restablecer la contraseña.';
      res.redirect('/auth/forgot-password');
    }
  });
  