require('dotenv').config(); // 🔹 Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const Tags = require('./server/models/Tags'); // Importamos el modelo de Tag

const MONGO_URI = process.env.MONGODB_URI; // 🔹 Obtener la URI de MongoDB desde .env

async function insertTagData() {
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
    const existingTags = await Tags.countDocuments();
    
    if (existingTags > 0) {
      console.log("🔹 Los tags ya existen en la base de datos.");
      return;
    }

    // Insertar Tags si no existen
    await Tags.insertMany([
      { name: "Travel", description: "Artículos sobre viajes" },
      { name: "Adventure", description: "Exploraciones y aventuras" },
      { name: "Food", description: "Comida y recetas" },
      { name: "Lifestyle", description: "Consejos de vida" },
      { name: "Business", description: "Noticias de negocios" },
      { name: "Freelancing", description: "Trabajo autónomo y remoto" }
    ]);

    console.log("✅ Tags insertados correctamente.");
  } catch (error) {
    console.error("❌ Error al insertar tags:", error);
  } finally {
    // 🔹 Cierra la conexión después de la inserción
    mongoose.connection.close();
  }
}

// Ejecutar la función para insertar los tags
insertTagData();
