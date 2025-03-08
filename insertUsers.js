require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./server/models/User');
const Role = require('./server/models/Role');

const MONGO_URI = process.env.MONGODB_URI;

async function insertUsers() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGODB_URI en el archivo .env");
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a la base de datos.");

    // CREAR ROLES SI NO EXISTEN
    const rolesData = [
      { name: 'admin', description: 'Administrador del sistema' },
      { name: 'editor', description: 'Editor de contenido' },
      { name: 'user', description: 'Usuario regular' },
      { name: 'student', description: 'Estudiante en la plataforma' },
      { name: 'instructor', description: 'Instructor de cursos' }
    ];

    // Insertar roles solo si no existen
    for (const role of rolesData) {
      const existingRole = await Role.findOne({ name: role.name });
      if (!existingRole) {
        await Role.create(role);
        console.log(`✅ Rol creado: ${role.name}`);
      }
    }

    // Obtener los roles creados
    const adminRole = await Role.findOne({ name: 'admin' });
    const editorRole = await Role.findOne({ name: 'editor' });
    const userRole = await Role.findOne({ name: 'user' });
    const studentRole = await Role.findOne({ name: 'student' });
    const instructorRole = await Role.findOne({ name: 'instructor' });

    // Verificar si los usuarios ya existen
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("🔹 Los usuarios ya existen en la base de datos.");
      return;
    }

    // Generar contraseñas encriptadas
    const hashedPassword = await bcrypt.hash("password123", 10);

    // CREAR USUARIOS
    const users = [
      { username: "superAdmin", email: "admin@example.com", password: hashedPassword, roles: [adminRole._id, editorRole._id] },
      { username: "contentEditor", email: "editor@example.com", password: hashedPassword, roles: [editorRole._id] },
      { username: "regularUser", email: "user@example.com", password: hashedPassword, roles: [userRole._id] },
      { username: "studentInstructor", email: "studentInstructor@example.com", password: hashedPassword, roles: [studentRole._id, instructorRole._id] },
      { username: "dualRoleUser", email: "dual@example.com", password: hashedPassword, roles: [userRole._id, editorRole._id] },
      { username: "studentUser", email: "student@example.com", password: hashedPassword, roles: [studentRole._id] },
      { username: "instructorUser", email: "instructor@example.com", password: hashedPassword, roles: [instructorRole._id] }
    ];

    // Insertar usuarios en la base de datos
    await User.insertMany(users);
    console.log("✅ Usuarios insertados correctamente.");

  } catch (error) {
    console.error("❌ Error al insertar usuarios:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los usuarios
insertUsers();
