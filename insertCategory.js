require('dotenv').config(); // 🔹 Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const Category = require('./server/models/Category'); // Importamos el modelo de Category

const MONGO_URI = process.env.MONGODB_URI; // 🔹 Obtener la URI de MongoDB desde .env
const CATEGORIES_JSON = process.env.CATEGORIES_JSON; // 🔹 Obtener las categorías desde .env

async function insertCategoryData() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGODB_URI en el archivo .env");
    }

    if (!CATEGORIES_JSON) {
      throw new Error("⚠️ No se han encontrado categorías en el archivo .env");
    }

    const categories = JSON.parse(CATEGORIES_JSON); // 🔹 Parsear el JSON de categorías

    // 🔹 Conectar a la base de datos antes de ejecutar consultas
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a la base de datos.");

    // Verificar si las categorías ya existen para evitar duplicados
    const existingCategory = await Category.countDocuments();
    
    if (existingCategory > 0) {
      console.log("🔹 Las categorías ya existen en la base de datos.");
      return;
    }

    // Insertar categorías si no existen
    await Category.insertMany(categories);

    console.log("✅ Categorías insertadas correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar categorías:", error);
  } finally {
    // 🔹 Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar las categorías
insertCategoryData();
