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

module.exports = router;
