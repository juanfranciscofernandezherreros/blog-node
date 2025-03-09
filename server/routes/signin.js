const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Role = require('../models/Role');


// ✅ GET /register - Renderiza el formulario de registro
router.get('/signin', (req, res) => {
  res.render('signin', {
    pageTitle: 'Iniciar sesion',  // Puedes enviar datos a la vista si quieres
    description: 'Iniciar sesion'
  });
});


// POST /signin - Inicio de sesión de usuario
router.post('/signin', async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
  
      // Validación básica
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'Usuario/Email y contraseña son obligatorios' });
      }
  
      // Buscar el usuario por username o email
      const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
      }).populate('roles');
  
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      // Comparar contraseñas
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
  
      // Si todo va bien, envía respuesta de éxito
      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          roles: user.roles.map(role => role.name)
        }
      });
  
    } catch (error) {
      console.error('❌ Error en el inicio de sesión:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });
  
module.exports = router;
