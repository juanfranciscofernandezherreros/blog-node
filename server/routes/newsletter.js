const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard/newsletter
 * Listar suscriptores con paginación y mensajes
 */
// GET /dashboard/newsletter
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const totalSubscribers = await Newsletter.countDocuments();
    const totalPages = Math.ceil(totalSubscribers / limit);
    const skip = (page - 1) * limit;

    const data = await Newsletter.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalSubscribers
    };

    res.render('admin/dashboard-newsletter', {
      title: 'Dashboard - Newsletter',
      data,
      pagination,   // 👈 Esto es la clave para el EJS
      layout: adminLayout,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });

  } catch (error) {
    console.error('Error cargando newsletters:', error);
    res.redirect('/dashboard/newsletter?error=Error cargando los newsletters');
  }
});


/**
 * GET /dashboard/newsletter/add-newsletter
 * Formulario para añadir suscriptor
 */
router.get('/add-newsletter', authenticateToken, authorizeRoles(['admin']), (req, res) => {
  res.render('admin/add-newsletter', {
    title: 'Añadir Newsletter',
    layout: adminLayout
  });
});

/**
 * POST /dashboard/newsletter/add-newsletter
 * Añadir nuevo suscriptor
 */
router.post('/add-newsletter', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.redirect('/dashboard/newsletter?error=El email es obligatorio');
    }

    const existing = await Newsletter.findOne({ email: email.trim().toLowerCase() });

    if (existing) {
      return res.redirect('/dashboard/newsletter?error=Este email ya está suscrito');
    }

    await Newsletter.create({ email: email.trim().toLowerCase() });

    res.redirect('/dashboard/newsletter?success=Suscriptor añadido correctamente');
  } catch (error) {
    console.error('Error al agregar suscriptor:', error);
    res.redirect('/dashboard/newsletter?error=Error interno al agregar suscriptor');
  }
});

/**
 * GET /dashboard/newsletter/edit-newsletter/:id
 * Formulario para editar suscriptor
 */
router.get('/edit-newsletter/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.redirect('/dashboard/newsletter?error=Suscriptor no encontrado');
    }

    res.render('admin/edit-newsletter', {
      title: 'Editar Newsletter',
      layout: adminLayout,
      subscriber
    });
  } catch (error) {
    console.error('Error al obtener suscriptor:', error);
    res.redirect('/dashboard/newsletter?error=Error al cargar el suscriptor');
  }
});

/**
 * POST /dashboard/newsletter/update-newsletter/:id
 * Actualizar suscriptor
 */
router.post('/update-newsletter/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.redirect(`/dashboard/newsletter/edit-newsletter/${req.params.id}?error=El email es obligatorio`);
    }

    await Newsletter.findByIdAndUpdate(req.params.id, { email: email.trim().toLowerCase() });

    res.redirect('/dashboard/newsletter?success=Suscriptor actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar suscriptor:', error);
    res.redirect('/dashboard/newsletter?error=Error al actualizar el suscriptor');
  }
});

/**
 * POST /dashboard/newsletter/delete-newsletter/:id
 * Eliminar suscriptor
 */
router.post('/delete-newsletter/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);

    res.redirect('/dashboard/newsletter?success=Suscriptor eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar suscriptor:', error);
    res.redirect('/dashboard/newsletter?error=Error al eliminar el suscriptor');
  }
});

module.exports = router;
