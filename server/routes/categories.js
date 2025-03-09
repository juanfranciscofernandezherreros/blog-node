const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard/categories - Mostrar todas las categorías
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const data = await Category.find();
    res.render('admin/dashboard-categories', { title: 'Dashboard - Categories', data, layout: adminLayout });
  } catch (error) {
    console.error(error);
  }
});

/**
 * POST /add-category - Crear nueva categoría
 */
router.post('/add-category', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).send('El nombre de la categoría es obligatorio');

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) return res.status(400).send('Esta categoría ya existe');

    await Category.create({ name: name.trim(), description: description?.trim() || '' });

    res.redirect('/dashboard/categories');
  } catch (error) {
    console.error('Error al crear la categoría:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * DELETE /delete-category/:id - Eliminar categoría
 */
router.delete('/delete-category/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).send('ID no válido');
    
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).send('Categoría no encontrada');

    res.redirect('/dashboard/categories');
  } catch (error) {
    console.error('Error eliminando la categoría:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * GET /dashboard/categories
 * Categories Dashboard
 */
router.get('/dashboard/categories',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard - Categories',
      description: 'Manage your blog categories.'
    }

    // Obtener todas las categorías de la base de datos
    const data = await Category.find();

    res.render('admin/dashboard-categories', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /add-post
 * Admin - Formulario para crear una nueva categoria
 */
router.get('/add-category',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const locals = {
      title: 'Add Category',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    };

    // Obtener todas las categorías y tags de la base de datos
    const categories = await Category.find(); // Busca todas las categorías
    const tags = await Tag.find(); // Busca todos los tags

    res.render('admin/add-category', {
      locals,
      layout: adminLayout,
      categories,  // Pasamos las categorías a la vista
      tags         // Pasamos los tags a la vista
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving data");
  }
});

/**
 * GET /edit-category/:id
 * Admin - Formulario para editar una categoría
 */
router.get('/edit-category/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).send('Categoría no encontrada');
    }

    res.render('admin/edit-category', {
      title: 'Editar Categoría',
      category,
      layout: adminLayout
    });

  } catch (error) {
    console.error('Error obteniendo la categoría:', error);
    res.status(500).send('Error interno del servidor');
  }
});

/**
 * POST /add-category
 * Admin - Crear Nueva Categoría
 */
router.post('/add-category',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validar que el campo nombre no esté vacío
    if (!name) {
      return res.status(400).send('El nombre de la categoría es obligatorio');
    }

    // Verificar si la categoría ya existe
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).send('Esta categoría ya existe');
    }

    // Crear nueva categoría
    const newCategory = new Category({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    await newCategory.save();
    res.redirect('/dashboard/categories'); // Redirigir a la lista de categorías

  } catch (error) {
    console.error('Error al crear la categoría:', error);
    res.status(500).send('Error interno del servidor');
  }
});

module.exports = router;
