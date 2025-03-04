const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
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