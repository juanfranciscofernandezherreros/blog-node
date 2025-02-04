require('dotenv').config(); // Cargar variables de entorno
const mongoose = require('mongoose');
const Newsletter = require('./server/models/Newsletter'); // Importar el modelo

const MONGO_URI = process.env.MONGODB_URI; // Obtener la URI de MongoDB desde .env

async function insertNewsletterEmails() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGODB_URI en el archivo .env");
    }

    // Conectar a la base de datos
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a la base de datos.");

    // Verificar si ya hay registros en la colección
    const existingEmails = await Newsletter.countDocuments();
    
    if (existingEmails > 0) {
      console.log("🔹 Ya hay correos registrados en la base de datos.");
      return;
    }

    // Lista de emails para insertar
    const emails = [
      { email: "email1@example.com" },
      { email: "email2@example.com" },
      { email: "email3@example.com" },
      { email: "email4@example.com" },
      { email: "email5@example.com" },
      { email: "email6@example.com" },
      { email: "email7@example.com" },
      { email: "email8@example.com" },
      { email: "email9@example.com" },
      { email: "email10@example.com" }
    ];

    // Insertar los emails en la base de datos
    await Newsletter.insertMany(emails);
    console.log("✅ Emails insertados correctamente en la newsletter.");
  } catch (error) {
    console.error("❌ Error al insertar emails:", error);
  } finally {
    // Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los emails
insertNewsletterEmails();
