require('dotenv').config(); // 🔹 Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Post = require('./server/models/Post');
const Category = require('./server/models/Category');
const Tag = require('./server/models/Tags');
const User = require('./server/models/User');

const MONGO_URI = process.env.MONGODB_URI; // 🔹 Obtener la URI de MongoDB desde .env
const SALT_ROUNDS = 10; // 🔹 Cantidad de rondas de encriptación para bcrypt

async function createUsers() {
  const existingUsers = await User.find();
  if (existingUsers.length >= 5) {
    console.log("🔹 Ya existen usuarios en la base de datos.");
    return existingUsers;
  }

  console.log("🟢 Creando usuarios nuevos con contraseñas encriptadas...");

  const usersData = [
    { username: "user1", email: "user1@example.com", password: "password1" },
    { username: "user2", email: "user2@example.com", password: "password2" },
    { username: "user3", email: "user3@example.com", password: "password3" },
    { username: "user4", email: "user4@example.com", password: "password4" },
    { username: "user5", email: "user5@example.com", password: "password5" }
  ];

  // Hashear las contraseñas
  const hashedUsers = await Promise.all(usersData.map(async (user) => ({
    ...user,
    password: await bcrypt.hash(user.password, SALT_ROUNDS)
  })));

  const createdUsers = await User.insertMany(hashedUsers);
  return createdUsers;
}

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

    // 🟢 Crear usuarios si no existen
    const users = await createUsers();
    if (users.length === 0) {
      throw new Error("❌ No se pudieron crear usuarios.");
    }

    // Verificar si ya existen posts
    const existingPosts = await Post.countDocuments();
    if (existingPosts > 0) {
      console.log("🔹 Ya existen posts en la base de datos.");
      return;
    }

    console.log("🟢 Creando posts y asignándolos a distintos usuarios...");

    // 🔹 Crear posts asignando a distintos autores
    const posts = categories.map((category, index) => {
      const author = users[index % users.length]; // Seleccionar distintos usuarios como autores
      return {
        title: `Artículo sobre ${category.name}`,
        body: `Este es un artículo detallado sobre ${category.name}. Exploramos los conceptos más importantes y las mejores prácticas.`,
        category: category._id,
        tags: tags.slice(index % tags.length, (index % tags.length) + 3).map(tag => tag._id),
        author: author._id, // Asignamos un usuario al post
      };
    });

    // Insertar los posts generados
    const insertedPosts = await Post.insertMany(posts);

    // 🔹 Asociar posts a algunos usuarios
    const userWithPosts = users[0]; // Seleccionamos al primer usuario para asignarle posts
    userWithPosts.posts = insertedPosts.map(post => post._id);
    await userWithPosts.save();

    console.log("✅ Posts insertados correctamente y asignados a usuarios.");

  } catch (error) {
    console.error("❌ Error al insertar posts:", error);
  } finally {
    // 🔹 Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los posts
insertPostData();
