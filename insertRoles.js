require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./server/models/Role');

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

    // Definimos los roles
    const rolesData = [
      { name: 'admin', description: 'Administrador del sistema, acceso total.' },
      { name: 'editor', description: 'Editor de contenido, puede modificar posts.' },
      { name: 'user', description: 'Usuario regular con acceso básico.' },
      { name: 'student', description: 'Estudiante en la plataforma, acceso a cursos.' },
      { name: 'instructor', description: 'Instructor que puede gestionar cursos y estudiantes.' }
    ];

    // Insertar roles solo si no existen
    for (const role of rolesData) {
      const existingRole = await Role.findOne({ name: role.name });
      if (!existingRole) {
        await Role.create(role);
        console.log(`✅ Rol creado: ${role.name}`);
      } else {
        console.log(`🔹 El rol "${role.name}" ya existe.`);
      }
    }

    console.log("🎯 Todos los roles han sido verificados e insertados correctamente.");

  } catch (error) {
    console.error("❌ Error al insertar roles:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los roles
insertRoles();
