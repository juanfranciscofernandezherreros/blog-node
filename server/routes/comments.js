const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const adminLayout = '../views/layouts/admin';

/**
 * GET /dashboard/comments
 * Mostrar todos los comentarios en el dashboard
 */
router.get('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard - Comments',
      description: 'Manage your blog comments.'
    };

    const comments = await Comment.find()
      .populate('postId', 'title')        // Trae el título del post relacionado
      .populate('parentId', 'body author') // Trae información del comentario padre si lo hay
      .sort({ createdAt: -1 });            // Ordena del más reciente al más antiguo

    res.render('admin/dashboard-comments', {
      locals,
      data: comments,
      layout: adminLayout
    });
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    res.status(500).send('Error al obtener los comentarios');
  }
});

/**
 * GET /dashboard/comments/add
 * Mostrar formulario para añadir un nuevo comentario
 */
router.get('/add', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const locals = {
      title: 'Añadir Comentario',
      description: 'Escribe un nuevo comentario'
    };

    const posts = await Post.find({}, 'title'); // Solo traemos el título y el _id

    res.render('admin/add-comment', {
      locals,
      posts,
      layout: adminLayout
    });
  } catch (error) {
    console.error('❌ Error al cargar la vista de añadir comentario:', error);
    res.status(500).send('Error al cargar la vista de añadir comentario');
  }
});

/**
 * POST /dashboard/comments
 * Guardar un nuevo comentario
 */
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { author, body, postId } = req.body;

    const newComment = new Comment({
      author,
      body,
      postId: postId || null
    });

    await newComment.save();
    res.redirect('/dashboard/comments');
  } catch (error) {
    console.error('❌ Error al guardar el comentario:', error);
    res.status(500).send('Error al guardar el comentario');
  }
});

/**
 * GET /dashboard/comments/edit/:id
 * Obtener un comentario y cargar el formulario de edición
 */
router.get('/edit/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send('ID de comentario no válido');
    }

    const comment = await Comment.findById(id).populate('postId');
    const posts = await Post.find({}, 'title');

    if (!comment) {
      return res.status(404).send('Comentario no encontrado');
    }

    const locals = {
      title: 'Editar Comentario',
      description: 'Modifica el contenido del comentario'
    };

    res.render('admin/edit-comment', {
      locals,
      comment,
      posts,
      layout: adminLayout
    });
  } catch (error) {
    console.error('❌ Error al cargar el comentario:', error);
    res.status(500).send('Error al cargar la vista de edición');
  }
});

// Obtener todos los comentarios y mostrar en la vista del dashboard
router.get('/dashboard/comments',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
    const locals = {
      title: 'Dashboard - Comments',
      description: 'Manage your blog comments.'
    };

    // Obtener todos los comentarios con datos completos (post y comentario padre)
    const data = await Comment.find()
      .populate('postId', 'title') // Trae el título del post asociado
      .populate('parentId', 'body author') // Trae información del comentario padre
      .sort({ createdAt: -1 }); // Ordena por fecha descendente

    res.render('admin/dashboard-comments', {
      locals,
      data,
      layout: adminLayout
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Error al obtener los comentarios');
  }
});

// Eliminar un comentario
router.delete('/comments/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
      await Comment.findByIdAndDelete(req.params.id);
      res.redirect('/dashboard/comments'); // Redirige al dashboard después de borrar
  } catch (error) {
      console.error(error);
      res.status(500).send('Error al eliminar el comentario');
  }
});

// Mostrar la vista para añadir un nuevo comentario
router.get('/add-comment',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
      const locals = {
          title: 'Añadir Comentario',
          description: 'Escribe un nuevo comentario'
      };

      // Obtener la lista de posts para asociar el comentario (opcional)
      const posts = await Post.find({}, 'title'); // Solo obtener títulos y IDs

      res.render('admin/add-comment', {
          locals,
          posts,  // Pasamos la lista de posts a la vista
          layout: adminLayout
      });

  } catch (error) {
      console.log(error);
      res.status(500).send('Error al cargar la página de agregar comentario');
  }
});

// Guardar un nuevo comentario
router.post('/comments',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
      const { author, body, postId } = req.body;

      // Crear el nuevo comentario
      const newComment = new Comment({
          author,
          body,
          postId: postId || null, // Si el usuario no selecciona un post, será null
      });

      await newComment.save();
      res.redirect('/dashboard/comments'); // Redirigir al listado de comentarios

  } catch (error) {
      console.log(error);
      res.status(500).send('Error al guardar el comentario');
  }
});

// Editar un comentario
router.put('/comments/edit/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
    try {
        const { author, body, postId } = req.body;

        const updatedComment = await Comment.findByIdAndUpdate(req.params.id, {
            author,
            body,
            postId: postId || null, // Si el usuario no selecciona un post, lo deja en null
        }, { new: true });

        if (!updatedComment) {
            return res.status(404).send('Comentario no encontrado');
        }

        res.redirect('/dashboard/comments'); // Redirigir al listado de comentarios después de editar

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al actualizar el comentario');
    }
});

// Obtener un comentario por ID y cargar la vista de edición
router.get('/dashboard/comments/edit/:id',  authenticateToken, authorizeRoles(['admin']) , async (req, res) => {
  try {
      const { id } = req.params;

      // Validar si el ID tiene el formato correcto de MongoDB
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).send('ID de comentario no válido');
      }

      // Buscar el comentario con el ID proporcionado y popular el post asociado
      const comment = await Comment.findById(id).populate('postId');
      const posts = await Post.find({}, 'title'); // Obtener la lista de posts disponibles (opcional)

      if (!comment) {
          return res.status(404).send('Comentario no encontrado');
      }

      const locals = {
          title: 'Editar Comentario',
          description: 'Modifica el contenido del comentario'
      };

      res.render('admin/edit-comment', {
          locals,
          comment,
          posts, // Lista de posts para asociar
      });

  } catch (error) {
      console.error('❌ Error al cargar el comentario:', error);
      res.status(500).send('Error al cargar la página de edición');
  }
});


/**
 * PUT /dashboard/comments/edit/:id
 * Actualizar un comentario existente
 */
router.put('/edit/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { author, body, postId } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(req.params.id, {
      author,
      body,
      postId: postId || null
    }, { new: true });

    if (!updatedComment) {
      return res.status(404).send('Comentario no encontrado');
    }

    res.redirect('/dashboard/comments');
  } catch (error) {
    console.error('❌ Error al actualizar el comentario:', error);
    res.status(500).send('Error al actualizar el comentario');
  }
});

/**
 * DELETE /dashboard/comments/delete/:id
 * Eliminar un comentario
 */
router.delete('/delete/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);

    if (!deletedComment) {
      return res.status(404).send('Comentario no encontrado');
    }

    res.redirect('/dashboard/comments');
  } catch (error) {
    console.error('❌ Error al eliminar el comentario:', error);
    res.status(500).send('Error al eliminar el comentario');
  }
});

module.exports = router;
