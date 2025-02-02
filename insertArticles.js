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

    // 🟢 Obtener las categorías disponibles
    const categories = await Category.find();
    if (categories.length === 0) {
      throw new Error("❌ No hay categorías disponibles en la base de datos.");
    }

    // 🟢 Obtener los tags disponibles
    const tags = await Tag.find();
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

    // 🔹 Crear un post para cada categoría disponible
    const posts = categories.map((category, index) => ({
      title: `Artículo sobre ${category.name}`,
      body: `Este es un artículo detallado sobre ${category.name}. Exploramos los conceptos más importantes y las mejores prácticas.`,
      category: category._id, // Asignamos una categoría diferente a cada post
      tags: tags.slice(index % tags.length, (index % tags.length) + 3).map(tag => tag._id), // Asignamos hasta 3 tags
      author: user._id, // Referencia al usuario
    }));

    // Insertar los posts generados
    await Post.insertMany(posts);

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
