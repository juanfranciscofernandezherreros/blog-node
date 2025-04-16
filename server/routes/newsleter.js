const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const Category = require('../models/Category');
const Tags = require('../models/Tags');
const User = require('../models/User');

// GET /newsletter
router.get('/', async (req, res) => {
  try {
    const locals = {
      title: "Suscripción al newsletter",
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null
    };

    // Limpiar mensajes después de usarlos
    req.session.successMessage = null;
    req.session.errorMessage = null;

    const categories = await Category.find();
    const tags = await Tags.find();
    const authors = await User.find();

    res.render('partials/newsletter', {
      locals,
      categories,
      tags,
      authors,
      user: req.user || null
    });
  } catch (error) {
    console.error('Error al cargar la vista de newsletter:', error);
    res.status(500).send('Error interno al cargar la vista de newsletter');
  }
});

// POST /newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  const { email, userIds = [], categoryIds = [], tagIds = [] } = req.body;

  try {
    let subscription = await Newsletter.findOne({ email });

    if (!subscription) {
      subscription = new Newsletter({
        email,
        subscribedToUsers: userIds,
        subscribedToCategories: categoryIds,
        subscribedToTags: tagIds
      });

      await subscription.save();

      req.session.successMessage = "Suscripción exitosa.";
    } else {
      req.session.errorMessage = "Ya estás suscrito con este correo.";
    }

    return res.redirect('/newsletter/');
  } catch (error) {
    console.error('Error al suscribirse:', error);
    req.session.errorMessage = "Error interno al suscribirse.";
    return res.redirect('/newsletter/');
  }
});

module.exports = router;
