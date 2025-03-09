const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard/newsletter - Mostrar todos los suscriptores
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const data = await Newsletter.find();
    res.render('admin/dashboard-newsletter', { title: 'Dashboard - Newsletter', data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * POST /dashboard/newsletter/add - Añadir un nuevo suscriptor
 */
router.post('/newsletter/add', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    if (!email) return res.status(400).send('El email es obligatorio');

    if (await Newsletter.findOne({ email })) return res.status(400).send('Este email ya está suscrito');

    await Newsletter.create({ email });

    res.redirect('/dashboard/newsletter');
  } catch (error) {
    console.error('Error al agregar suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * DELETE /dashboard/newsletter/:id - Eliminar suscriptor
 */
router.delete('/newsletter/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.redirect('/newsletter');
  } catch (error) {
    console.error('Error al eliminar suscriptor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/**
 * GET /dashboard/newsletter
 * Mostrar todos los suscriptores
 */
router.get('/newsletter',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard - Newsletter',
      description: 'Manage your blog categories.'
    }

    // Obtener todas las categorías de la base de datos
    const data = await Newsletter.find();

    res.render('admin/dashboard-newsletter', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * POST /dashboard/newsletter/add
 * Añadir un nuevo suscriptor
 */
router.post('/newsletter/add', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send('El email es obligatorio');
    }

    // Evitar duplicados
    const exists = await Newsletter.findOne({ email });
    if (exists) {
      return res.status(400).send('Este email ya está suscrito');
    }

    await Newsletter.create({ email });

    res.redirect('/dashboard/newsletter');

  } catch (error) {
    console.error('Error al agregar suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /dashboard/newsletter
 * Mostrar todos los suscriptores
 */
router.get('/newsletter',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const data = await Newsletter.find();
    res.render('admin/dashboard-newsletter', { title: 'Users dashboard', data, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

/**
 * POST /dashboard/newsletter/add
 * Añadir un nuevo suscriptor
 */
router.post('/newsletter/add',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send('El email es obligatorio');
    if (await Newsletter.findOne({ email })) return res.status(400).send('Este email ya está suscrito');
    await Newsletter.create({ email });
    res.redirect('/dashboard/newsletter');
  } catch (error) {
    console.error('Error al agregar suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /dashboard/newsletter/edit/:id
 * Obtener un suscriptor para editar
 */
router.get('/newsletter/edit/:id',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);
    if (!subscriber) return res.status(404).send('Suscriptor no encontrado');
    res.render('admin/edit-newsletter', { subscriber, layout: adminLayout });
  } catch (error) {
    console.error('Error al obtener suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * PUT /dashboard/newsletter/update/:id
 * Actualizar un suscriptor
 */
router.put('/newsletter/update/:id',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send('El email es obligatorio');
    await Newsletter.findByIdAndUpdate(req.params.id, { email });
    res.redirect('/dashboard/newsletter');
  } catch (error) {
    console.error('Error al actualizar suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * DELETE /delete-newsletter/:email
 * Eliminar suscriptor
 */
router.delete('/delete-newsletter/:email',  authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: 'El email es obligatorio' });
    const deletedSubscriber = await Newsletter.findOneAndDelete({ email });
    if (!deletedSubscriber) return res.status(404).json({ success: false, message: 'Suscriptor no encontrado' });
    res.redirect('/dashboard/newsletter');
  } catch (error) {
    console.error('Error al eliminar suscriptor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});


/**
 * GET /dashboard/newsletter/edit/:id
 * Obtener un suscriptor para editar
 */
router.get('/newsletter/edit/:id', authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).send('Suscriptor no encontrado');
    }

    res.render('admin/edit-newsletter', { subscriber });

  } catch (error) {
    console.error('Error al obtener suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * POST /dashboard/newsletter/update/:id
 * Actualizar un suscriptor
 */
router.post('/newsletter/update/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send('El email es obligatorio');
    }

    await Newsletter.findByIdAndUpdate(req.params.id, { email });

    res.redirect('/dashboard/newsletter');

  } catch (error) {
    console.error('Error al actualizar suscriptor:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * DELETE /dashboard/newsletter/:id
 * Eliminar suscriptor
 */
router.delete('/newsletter/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Suscriptor eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar suscriptor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/**
 * DELETE /dashboard/newsletter/:id
 * Eliminar suscriptor del Newsletter
 */
router.delete('/newsletter/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Suscriptor no encontrado' });
    }

    res.json({ success: true, message: 'Suscriptor eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar suscriptor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/**
 * GET /add-newsletter
 * Admin - Formulario para añadir una nueva etiqueta
 */
router.get('/add-newsletter',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    res.render('admin/add-newsletter', { title: 'Añadir Newsletter', layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post('/add-newsletter',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send('El email es obligatorio');
    }

    const existingSubscriber = await Newsletter.findOne({ email: email.trim() });
    if (existingSubscriber) {
      return res.status(400).send('Este email ya está suscrito');
    }

    await Newsletter.create({ email: email.trim() });

    res.redirect('/dashboard/newsletter');
  } catch (error) {
    console.error('Error agregando suscriptor:', error);
    if (error.code === 11000) {
      return res.status(400).send('Este email ya está suscrito');
    }
    res.status(500).send('Error interno del servidor');
  }
});

router.delete('/delete-newsletter/:email',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es obligatorio' });
    }

    const deletedSubscriber = await Newsletter.findOneAndDelete({ email });

    if (!deletedSubscriber) {
      return res.status(404).json({ success: false, message: 'Suscriptor no encontrado' });
    }

    res.redirect('/dashboard/newsletter');

  } catch (error) {
    console.error('Error al eliminar suscriptor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});


module.exports = router;
