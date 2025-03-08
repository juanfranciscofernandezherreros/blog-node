require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./server/models/Role'); // Importamos el modelo Role

const MONGO_URI = process.env.MONGODB_URI;

async function insertRoles() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGODB_URI en el archivo .env");
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a la base de datos.");

    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log("🔹 Los roles ya existen en la base de datos.");
      return;
    }

    const roles = [
      { name: "admin", description: "Administrador con acceso total" },
      { name: "editor", description: "Puede crear y editar contenido" },
      { name: "user", description: "Usuario con permisos básicos" }
    ];

    await Role.insertMany(roles);
    console.log("✅ Roles insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar roles:", error);
  } finally {
    mongoose.connection.close();
  }
}

insertRoles();
