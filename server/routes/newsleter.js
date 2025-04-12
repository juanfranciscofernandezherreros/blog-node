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
      title: "Suscripcion al newsletter",
    };
    // Opcional: puedes cargar categorías, tags, usuarios, etc. desde la base de datos
    const categories = await Category.find(); // asegúrate de importar este modelo si lo usas
    const tags = await Tags.find();
    const authors = await User.find(); // opcional

    res.render('newsletter', {
      locals,
      categories,
      tags,
      authors,
      user: req.user || null // si usas autenticación
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
    // Verificamos si ya existe una suscripción con ese email
    let subscription = await Newsletter.findOne({ email });

    if (!subscription) {
      // Si no existe, la creamos
      subscription = new Newsletter({
        email,
        subscribedToUsers: userIds,
        subscribedToCategories: categoryIds,
        subscribedToTags: tagIds
      });
    } else {
      // Si existe, actualizamos las suscripciones evitando duplicados
      subscription.subscribedToUsers = Array.from(new Set([
        ...subscription.subscribedToUsers.map(id => id.toString()),
        ...userIds
      ]));

      subscription.subscribedToCategories = Array.from(new Set([
        ...subscription.subscribedToCategories.map(id => id.toString()),
        ...categoryIds
      ]));

      subscription.subscribedToTags = Array.from(new Set([
        ...subscription.subscribedToTags.map(id => id.toString()),
        ...tagIds
      ]));
    }

    await subscription.save();

    return res.status(200).json({ message: 'Suscripción actualizada correctamente', subscription });
  } catch (error) {
    console.error('Error al suscribirse:', error);
    return res.status(500).json({ message: 'Error interno al suscribirse' });
  }
});



module.exports = router;
