require('dotenv').config(); // 🔹 Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const Post = require('./server/models/Post');
const Category = require('./server/models/Category');
const Tag = require('./server/models/Tags');
const User = require('./server/models/User'); // Asegúrate de que existe el usuario

const MONGO_URI = process.env.MONGODB_URI; // 🔹 Obtener la URI de MongoDB desde .env

async function insertPostData() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGODB_URI en el archivo .env");
    }

    // 🔹 Conectar a la base de datos
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a la base de datos.");

    // 🟢 Obtener una categoría existente
    const category = await Category.findOne();
    if (!category) {
      throw new Error("❌ No hay categorías disponibles en la base de datos.");
    }

    // 🟢 Obtener algunos tags existentes
    const tags = await Tag.find().limit(3); // Selecciona hasta 3 tags aleatorios
    if (tags.length === 0) {
      throw new Error("❌ No hay tags disponibles en la base de datos.");
    }

    // 🟢 Obtener un usuario existente
    const user = await User.findOne();
    if (!user) {
      throw new Error("❌ No hay usuarios en la base de datos. Crea un usuario primero.");
    }

    // Verificar si ya existen posts
    const existingPosts = await Post.countDocuments();
    if (existingPosts > 0) {
      console.log("🔹 Ya existen posts en la base de datos.");
      return;
    }

    // 🔹 Insertar Posts referenciando Categorías y Tags existentes
    await Post.insertMany([
      {
        title: "Introducción a Spring Boot",
        body: "Aprende cómo funciona Spring Boot y cómo simplifica el desarrollo de aplicaciones Java.",
        category: category._id, // Referencia a categoría existente
        tags: tags.map(tag => tag._id), // Referencia a tags existentes
        author: user._id // Referencia a usuario existente
      },
      {
        title: "Spring Security con JWT",
        body: "Implementación de autenticación con JWT en una aplicación Spring Boot.",
        category: category._id,
        tags: tags.map(tag => tag._id),
        author: user._id
      },
      {
        title: "Microservicios con Spring Cloud",
        body: "Arquitectura basada en microservicios con Spring Cloud y Eureka.",
        category: category._id,
        tags: tags.map(tag => tag._id),
        author: user._id
      }
    ]);

    console.log("✅ Posts insertados correctamente.");

  } catch (error) {
    console.error("❌ Error al insertar posts:", error);
  } finally {
    // 🔹 Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los posts
insertPostData();
