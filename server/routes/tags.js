const express = require('express');
const router = express.Router();
const Tag = require('../models/Tags');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard/tags - Mostrar todas las etiquetas
 */
/**
 * GET /dashboard/tags - Mostrar todas las etiquetas
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    // Parámetros de query para paginación y búsqueda
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const nameFilter = req.query.name || '';

    // Filtro por nombre de la etiqueta
    const query = {};
    if (nameFilter) {
      query.name = { $regex: nameFilter, $options: 'i' }; // Búsqueda insensible a mayúsculas
    }

    // Contar el total de resultados para calcular la paginación
    const totalTags = await Tag.countDocuments(query);
    const totalPages = Math.ceil(totalTags / limit);
    const skip = (page - 1) * limit;

    // Buscar etiquetas con paginación y ordenadas (opcional)
    const tags = await Tag.find(query)
      .sort({ createdAt: -1 }) // Orden por fecha de creación (opcional)
      .skip(skip)
      .limit(limit);

    // Datos para la paginación en la vista
    const pagination = {
      page,
      limit,
      totalPages,
      totalItems: totalTags,
    };

    // Renderizar la vista de etiquetas con paginación y filtros
    res.render('admin/dashboard-tags', {
      title: 'Dashboard - Tags',
      tags,
      pagination,
      query: { name: nameFilter },
      layout: adminLayout
    });

  } catch (error) {
    console.error('Error al obtener las etiquetas:', error);
    res.status(500).render('error', {
      message: 'Error al cargar las etiquetas',
      error
    });
  }
});


/**
 * GET /dashboard/tags
 * Tags Dashboard
 */
router.get('/dashboard/tags',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard - Tags',
      description: 'Manage your blog tags.'
    }

    // Obtener todas las etiquetas de la base de datos
    const data = await Tag.find();

    res.render('admin/dashboard-tags', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * DELETE /delete-tag/:id
 * Eliminar etiqueta
 */
router.delete('/delete-tag/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/tags');
  } catch (error) {
    console.error('Error eliminando la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /add-tag
 * Admin - Formulario para añadir una nueva etiqueta
 */
router.get('/add-tag',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    res.render('admin/add-tags', { title: 'Añadir Etiqueta', layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post('/add-tag',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).send('El nombre de la etiqueta es obligatorio');
    }

    const existingTag = await Tag.findOne({ name: name.trim() });
    if (existingTag) {
      return res.status(400).send('El tag ya existe');
    }

    await Tag.create({ name: name.trim(), description: description?.trim() });

    res.redirect('/dashboard/tags');
  } catch (error) {
    console.error('Error creando la etiqueta:', error);
    if (error.code === 11000) {
      return res.status(400).send('El tag ya existe');
    }
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * POST /add-tag - Crear nueva etiqueta
 */
router.post('/add-tag', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).send('El nombre de la etiqueta es obligatorio');

    const existingTag = await Tag.findOne({ name: name.trim() });
    if (existingTag) return res.status(400).send('El tag ya existe');

    await Tag.create({ name: name.trim(), description: description?.trim() || '' });

    res.redirect('/dashboard/tags');
  } catch (error) {
    console.error('Error creando la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * DELETE /delete-tag/:id - Eliminar etiqueta
 */
router.delete('/delete-tag/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/tags');
  } catch (error) {
    console.error('Error eliminando la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /edit-tag/:id
 * Admin - Formulario para editar una etiqueta
 */
router.get('/edit-tag/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).send('Etiqueta no encontrada');
    }

    res.render('admin/edit-tag', { title: 'Editar Etiqueta', tag, layout: adminLayout });

  } catch (error) {
    console.error('Error obteniendo la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * PUT /edit-tag/:id
 * Admin - Actualizar etiqueta
 */
router.put('/edit-tag/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send('El nombre de la etiqueta es obligatorio');
    }

    await Tag.findByIdAndUpdate(req.params.id, { name: name.trim() });

    res.redirect('/dashboard/tags');
  } catch (error) {
    console.error('Error actualizando la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /edit-tag/:id
 * Admin - Formulario para editar una etiqueta
 */
router.get('/edit-tag/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).send('Etiqueta no encontrada');
    }

    res.render('admin/edit-tag', { 
      title: 'Editar Etiqueta', 
      tag, 
      layout: adminLayout 
    });

  } catch (error) {
    console.error('Error obteniendo la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});


/**
 * PUT /edit-category/:id
 * Admin - Actualizar Categoría
 */
router.put('/edit-category/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).send('El nombre de la categoría es obligatorio');
    }

    await Category.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.redirect('/dashboard/categories');
  } catch (error) {
    console.error('Error actualizando la categoría:', error);
    res.status(500).send('Error interno del servidor');
  }
});


module.exports = router;
