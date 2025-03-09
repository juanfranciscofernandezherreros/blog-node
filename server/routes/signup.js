const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Role = require('../models/Role');


// ✅ GET /register - Renderiza el formulario de registro
router.get('/register', (req, res) => {
  res.render('signup', {
    pageTitle: 'Registro de Usuario',  // Puedes enviar datos a la vista si quieres
    description: 'Crea una cuenta nueva'
  });
});


// ✅ POST /register - Registro de Usuario con Rol por Defecto
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'El usuario o email ya están en uso' });
    }

    const defaultRole = await Role.findOne({ name: 'user' });
    if (!defaultRole) {
      return res.status(500).json({ message: 'Rol por defecto no encontrado. Crea el rol "user" en la base de datos.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      roles: [defaultRole._id]
    });

    await user.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente', user });

  } catch (error) {
    console.error('❌ Error en el registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
