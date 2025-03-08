require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User'); // Importamos el modelo User
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGODB_URI;

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

    // Verificar si ya existen usuarios
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("🔹 Los usuarios ya existen en la base de datos.");
      return;
    }

    // Generar contraseñas encriptadas
    const hashedPassword = await bcrypt.hash("password123", 10);

    const users = [
      { username: "admin1", email: "admin1@example.com", password: hashedPassword, role: "admin" },
      { username: "editor1", email: "editor1@example.com", password: hashedPassword, role: "editor" },
      { username: "editor2", email: "editor2@example.com", password: hashedPassword, role: "editor" },
      { username: "user1", email: "user1@example.com", password: hashedPassword, role: "user" },
      { username: "user2", email: "user2@example.com", password: hashedPassword, role: "user" },
    ];

    await User.insertMany(users);
    console.log("✅ Usuarios con roles insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar usuarios:", error);
  } finally {
    mongoose.connection.close();
  }
}

insertUsers();
