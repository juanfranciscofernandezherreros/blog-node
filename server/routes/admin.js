const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Newsletter = require('../models/Newsletter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Category = require('../models/Category'); // Importa el modelo
const Tag = require('../models/Tags'); // Importa el modelo
const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET;


/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next ) => {
  const token = req.cookies.token;

  if(!token) {
    return res.status(401).json( { message: 'Unauthorized'} );
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch(error) {
    res.status(401).json( { message: 'Unauthorized'} );
  }
}


/**
 * GET /
 * Admin - Login Page
*/
router.get('/admin', async (req, res) => {
  try {
    const locals = {
      title: "Admin",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    }

    res.render('admin/index', { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /dashboard/newsletter
 * Mostrar todos los suscriptores
 */
router.get('/dashboard/newsletter', authMiddleware, async (req, res) => {
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
router.post('/dashboard/newsletter/add', async (req, res) => {
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
 * GET /dashboard/newsletter/edit/:id
 * Obtener un suscriptor para editar
 */
router.get('/dashboard/newsletter/edit/:id', async (req, res) => {
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
router.post('/dashboard/newsletter/update/:id', async (req, res) => {
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
router.delete('/dashboard/newsletter/:id', async (req, res) => {
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
router.delete('/dashboard/newsletter/:id', async (req, res) => {
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
 * POST /
 * Admin - Check Login
*/
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne( { username } );

    if(!user) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid) {
      return res.status(401).json( { message: 'Invalid credentials' } );
    }

    const token = jwt.sign({ userId: user._id}, jwtSecret );
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');

  } catch (error) {
    console.log(error);
  }
});


/**
 * GET /
 * Admin Dashboard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    }

    const data = await Post.find();
    res.render('admin/dashboard', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
  }

});

/**
 * GET /dashboard/tags
 * Tags Dashboard
 */
router.get('/dashboard/tags', authMiddleware, async (req, res) => {
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
router.delete('/delete-tag/:id', authMiddleware, async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/tags');
  } catch (error) {
    console.error('Error eliminando la etiqueta:', error);
    res.status(500).send('Error interno del servidor');
  }
});


/**
 * GET /dashboard/categories
 * Categories Dashboard
 */
router.get('/dashboard/categories', authMiddleware, async (req, res) => {
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
 * GET /add-tag
 * Admin - Formulario para añadir una nueva etiqueta
 */
router.get('/add-tag', authMiddleware, async (req, res) => {
  try {
    res.render('admin/add-tags', { title: 'Añadir Etiqueta', layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /add-newsletter
 * Admin - Formulario para añadir una nueva etiqueta
 */
router.get('/add-newsletter', authMiddleware, async (req, res) => {
  try {
    res.render('admin/add-newsletter', { title: 'Añadir Newsletter', layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post('/add-newsletter', authMiddleware, async (req, res) => {
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

router.delete('/delete-newsletter/:email', authMiddleware, async (req, res) => {
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


router.post('/add-tag', authMiddleware, async (req, res) => {
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
 * GET /add-post
 * Admin - Formulario para crear un nuevo post
 */
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: 'Add Post',
      description: 'Simple Blog created with NodeJs, Express & MongoDb.'
    };

    // Obtener todas las categorías y tags de la base de datos
    const categories = await Category.find(); // Busca todas las categorías
    const tags = await Tag.find(); // Busca todos los tags

    res.render('admin/add-post', {
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
 * GET /add-post
 * Admin - Formulario para crear una nueva categoria
 */
router.get('/add-category', authMiddleware, async (req, res) => {
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
router.get('/edit-category/:id', authMiddleware, async (req, res) => {
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
 * GET /edit-tag/:id
 * Admin - Formulario para editar una etiqueta
 */
router.get('/edit-tag/:id', authMiddleware, async (req, res) => {
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
router.put('/edit-tag/:id', authMiddleware, async (req, res) => {
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
router.get('/edit-tag/:id', authMiddleware, async (req, res) => {
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
router.put('/edit-category/:id', authMiddleware, async (req, res) => {
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


/**
 * POST /add-post
 * Admin - Crear Nuevo Post
 */
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    // Validación básica
    if (!req.body.title || !req.body.summary || !req.body.body || !req.body.category || !req.body.publishDate) {
      return res.status(400).send('Todos los campos son obligatorios');
    }

    // Verifica si `tags` es un array o una cadena
    let tagsArray = [];
    if (Array.isArray(req.body.tags)) {
      tagsArray = req.body.tags; // Ya es un array, lo asignamos directamente
    } else if (typeof req.body.tags === 'string') {
      tagsArray = req.body.tags.split(",").map(tag => tag.trim()); // Convertir de string a array
    }

    const newPost = {
      title: req.body.title.trim(),
      summary: req.body.summary.trim(),
      body: req.body.body.trim(),
      category: req.body.category,
      tags: tagsArray, // Guardamos el array limpio de tags
      author: req.userId, 
      publishDate: new Date(req.body.publishDate),
    };

    await Post.create(newPost);
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Error creando post:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /add-category
 * Admin - Crear Nueva Categoría
 */
router.post('/add-category', authMiddleware, async (req, res) => {
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

/**
 * DELETE /delete-category/:id
 * Eliminar Categoría
 */
router.delete('/delete-category/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).send('Categoría no encontrada');
    }

    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/categories');

  } catch (error) {
    console.error('Error eliminando la categoría:', error);
    res.status(500).send('Error interno del servidor');
  }
});



/**
 * GET /edit-post/:id
 * Admin - Editar un post existente
 */
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const locals = {
      title: "Edit Post",
      description: "Edit an existing blog post",
    };

    // Obtener el post por ID
    const data = await Post.findOne({ _id: req.params.id });

    // Obtener todas las categorías y tags de la base de datos
    const categories = await Category.find();
    const tags = await Tag.find();

    res.render('admin/edit-post', {
      locals,
      data,
      layout: adminLayout,
      categories, // Pasamos las categorías a la vista
      tags,       // Pasamos los tags a la vista
      selectedTags: data.tags // Enviar los tags actuales del post
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving data");
  }
});


/**
 * PUT /edit-post/:id
 * Admin - Actualizar un post existente
 */
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    let tagsArray = [];
    if (Array.isArray(req.body.tags)) {
      tagsArray = req.body.tags; // Si es un array, lo usamos directamente
    } else if (typeof req.body.tags === 'string') {
      tagsArray = req.body.tags.split(",").map(tag => tag.trim()); // Si es string, lo convertimos en array
    }

    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      summary: req.body.summary,
      body: req.body.body,
      category: req.body.category,
      tags: tagsArray, // Guardar los tags en el post
      updatedAt: Date.now()
    });

    res.redirect(`/dashboard`);

  } catch (error) {
    console.log(error);
    res.status(500).send('Error updating post');
  }
});



// router.post('/admin', async (req, res) => {
//   try {
//     const { username, password } = req.body;
    
//     if(req.body.username === 'admin' && req.body.password === 'password') {
//       res.send('You are logged in.')
//     } else {
//       res.send('Wrong username or password');
//     }

//   } catch (error) {
//     console.log(error);
//   }
// });


/**
 * POST /
 * Admin - Register
*/
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({ username, password:hashedPassword });
      res.status(201).json({ message: 'User Created', user });
    } catch (error) {
      if(error.code === 11000) {
        res.status(409).json({ message: 'User already in use'});
      }
      res.status(500).json({ message: 'Internal server error'})
    }

  } catch (error) {
    console.log(error);
  }
});


/**
 * DELETE /
 * Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {

  try {
    await Post.deleteOne( { _id: req.params.id } );
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }

});


/**
 * GET /logout
 * Cierra la sesión del usuario
 */
router.get('/dashboard/logout', (req, res) => {
  res.clearCookie('token'); // Elimina la cookie del token
  res.redirect('/admin'); // Redirige al login
});


/**
 * GET /logout
 * Cierra la sesión del usuario
 */
router.get('dashboard/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) }); // Expira la cookie del token
  res.redirect('/login');
});


module.exports = router;