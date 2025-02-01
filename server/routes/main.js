const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Cargar variables de entorno

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Gmail requiere este host
  port: process.env.SMTP_PORT || 465, // Usa 465 (SSL) o 587 (STARTTLS)
  secure: process.env.SMTP_PORT == 465, // true si es 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Evita problemas con certificados en localhost
  },
});

/**
 * POST /contact
 * Envía un correo con los datos del formulario de contacto
 */
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).render('contact', {
      currentRoute: '/contact',
      error: 'Todos los campos son obligatorios.',
      name,
      email,
      message
    });
  }

  try {
    await transporter.sendMail({
      from: `"Blog Contact" <${process.env.SMTP_USER}>`, // Usa tu correo Gmail
      to: process.env.SMTP_USER, // Recibirás el mensaje en este mismo correo
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `De: ${name} <${email}>\n\nMensaje:\n${message}`,
      html: `<p><strong>De:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
             <p><strong>Mensaje:</strong></p>
             <p>${message}</p>`
    });

    res.render('contact', {
      currentRoute: '/contact',
      success: 'Tu mensaje ha sido enviado con éxito.'
    });
  } catch (error) {
    console.error("Error enviando correo:", error);
    res.status(500).render('contact', {
      currentRoute: '/contact',
      error: 'Hubo un error al enviar tu mensaje. Intenta de nuevo más tarde.'
    });
  }
});


/**
 * GET /
 * HOME
 */
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "NodeJs Blog",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    };

    let perPage = 10;
    let page = req.query.page || 1;

    const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await Post.countDocuments({});
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', { 
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/'
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * Post :id
 */
router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    };

    res.render('post', { 
      locals,
      data,
      currentRoute: `/post/${slug}`
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * POST /
 * Post - searchTerm
 */
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Validar datos si es necesario
  if (!name || !email || !message) {
    return res.status(400).render('contact', {
      currentRoute: '/contact',
      error: 'Todos los campos son obligatorios.',
    });
  }

  // Aquí puedes procesar los datos, como enviarlos a una base de datos o por correo
  console.log(`Contacto recibido: Nombre: ${name}, Email: ${email}, Mensaje: ${message}`);

  // Renderizar la página de contacto con un mensaje de éxito
  res.render('contact', {
    currentRoute: '/contact',
    success: 'Tu mensaje ha sido enviado con éxito.',
  });
});


/**
 * POST /
 * Post - searchTerm
 */
router.post('/search', async (req, res) => {
  try {
    const locals = {
      title: "Search",
      description: "Simple Blog created with NodeJs, Express & MongoDb."
    };

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
      ]
    });

    res.render("search", {
      data,
      locals,
      currentRoute: '/'
    });

  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * About
 */
router.get('/about', (req, res) => {
  res.render('about', {
    currentRoute: '/about'
  });
});

/**
 * GET /
 * contact
 */
router.get('/contact', (req, res) => {
  res.render('contact', {
    currentRoute: '/contact'
  });
});

/**
 * Insert sample data into the database
 */
async function insertPostData() {
  try {
    await Post.insertMany([
      {
        title: "Building APIs with Node.js",
        body: "Learn how to use Node.js to build RESTful APIs using frameworks like Express.js."
      },
      {
        title: "Deployment of Node.js applications",
        body: "Understand the different ways to deploy your Node.js applications, including on-premises, cloud, and container environments."
      },
      {
        title: "Authentication and Authorization in Node.js",
        body: "Learn how to add authentication and authorization to your Node.js web applications using Passport.js or other authentication libraries."
      },
      {
        title: "Understand how to work with MongoDB and Mongoose",
        body: "Understand how to work with MongoDB and Mongoose, an Object Data Modeling (ODM) library, in Node.js applications."
      },
      {
        title: "Build real-time, event-driven applications in Node.js",
        body: "Learn how to use Socket.io to build real-time, event-driven applications in Node.js."
      },
      {
        title: "Discover how to use Express.js",
        body: "Discover how to use Express.js, a popular Node.js web framework, to build web applications."
      },
      {
        title: "Asynchronous Programming with Node.js",
        body: "Explore the asynchronous nature of Node.js and how it allows for non-blocking I/O operations."
      },
      {
        title: "Learn the basics of Node.js and its architecture",
        body: "Learn the basics of Node.js and its architecture, how it works, and why it is popular among developers."
      },
      {
        title: "NodeJs Limiting Network Traffic",
        body: "Learn how to limit network traffic."
      },
      {
        title: "Learn Morgan - HTTP Request logger for NodeJs",
        body: "Learn Morgan."
      },
    ]);
    console.log("Sample data inserted successfully!");
  } catch (error) {
    console.log("Error inserting sample data:", error);
  }
}

// Uncomment the following line to insert sample data (run only once)
//insertPostData();

module.exports = router;