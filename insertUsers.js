require('dotenv').config(); // Cargar variables de entorno
const mongoose = require('mongoose');
const User = require('./server/models/User'); // Importamos el modelo User
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI; // Obtener la URI de MongoDB

async function insertUsers() {
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

    // Verificar si los usuarios ya existen
    const existingUsers = await User.countDocuments();
    
    if (existingUsers > 0) {
      console.log("🔹 Los usuarios ya existen en la base de datos.");
      return;
    }

    // Generar contraseñas encriptadas
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);

    // Crear 10 usuarios con datos de prueba
    const users = [
      { username: "user1", email: "user1@example.com", password: hashedPassword },
      { username: "user2", email: "user2@example.com", password: hashedPassword },
      { username: "user3", email: "user3@example.com", password: hashedPassword },
      { username: "user4", email: "user4@example.com", password: hashedPassword },
      { username: "user5", email: "user5@example.com", password: hashedPassword },
      { username: "user6", email: "user6@example.com", password: hashedPassword },
      { username: "user7", email: "user7@example.com", password: hashedPassword },
      { username: "user8", email: "user8@example.com", password: hashedPassword },
      { username: "user9", email: "user9@example.com", password: hashedPassword },
      { username: "user10", email: "user10@example.com", password: hashedPassword }
    ];

    // Insertar los usuarios en la base de datos
    await User.insertMany(users);
    console.log("✅ Usuarios insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar usuarios:", error);
  } finally {
    // Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los usuarios
insertUsers();
