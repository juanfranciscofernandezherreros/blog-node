require('dotenv').config(); // 🔹 Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const Category = require('./server/models/Category'); // Importamos el modelo de Tag

const MONGO_URI = process.env.MONGODB_URI; // 🔹 Obtener la URI de MongoDB desde .env

async function insertCategoryData() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGOD_URI en el archivo .env");
    }

    // 🔹 Conectar a la base de datos antes de ejecutar consultas
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a la base de datos.");

    // Verificar si los tags ya existen para evitar duplicados
    const existingCategory = await Category.countDocuments();
    
    if (existingCategory > 0) {
      console.log("🔹 Los tags ya existen en la base de datos.");
      return;
    }

    // Insertar Category si no existen
    await Category.insertMany([
      { name: "Category1", description: "Category1" },
      { name: "Category2", description: "Category2" },
      { name: "Category3", description: "Category3" },
      { name: "Category4", description: "Category4" },
      { name: "Category5", description: "Category5" },
      { name: "Category6", description: "Category6" }
    ]);

    console.log("✅ Category insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar Category:", error);
  } finally {
    // 🔹 Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los tags
insertCategoryData();
