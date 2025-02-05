require('dotenv').config(); // 🔹 Cargar variables de entorno desde .env
const mongoose = require('mongoose');
const Tags = require('./server/models/Tags'); // Importamos el modelo de Tag

const MONGO_URI = process.env.MONGODB_URI; // 🔹 Obtener la URI de MongoDB desde .env
const TAGS_JSON = process.env.TAGS_JSON; // 🔹 Obtener los tags desde .env

async function insertTagData() {
  try {
    if (!MONGO_URI) {
      throw new Error("⚠️ No se ha encontrado la variable MONGODB_URI en el archivo .env");
    }

    if (!TAGS_JSON) {
      throw new Error("⚠️ No se han encontrado tags en el archivo .env");
    }

    const tags = JSON.parse(TAGS_JSON); // 🔹 Parsear el JSON de tags

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

    // Insertar tags si no existen
    await Tags.insertMany(tags);

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
