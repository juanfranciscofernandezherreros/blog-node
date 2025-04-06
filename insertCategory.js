require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./server/models/Category'); // Modelo Category
const Tag = require('./server/models/Tags'); // Modelo Tag

const MONGO_URI = process.env.MONGODB_URI;

const tags = [
  { name: "Anotaciones en Spring Boot" },
  { name: "Controladores REST" },
  { name: "Swagger / OpenAPI" },
  { name: "Manejo de Excepciones" },
  { name: "Docker" },
  { name: "Spring Boot Actuator" },
  { name: "Spring Cloud" },
  { name: "JWT" },
  { name: "Spring Security" },
  { name: "OAuth2" },
  { name: "@ControllerAdvice" },
  { name: "CI/CD con Jenkins" }
];

const categories = [
  {
    name: "Desarrollo de APIs REST con Spring Boot",
    description: "Aprende a construir APIs REST seguras y bien documentadas"
  },
  {
    name: "Introducción a Microservicios",
    description: "Conceptos clave y herramientas para trabajar con microservicios"
  },
  {
    name: "Seguridad en Aplicaciones Web",
    description: "Autenticación, autorización y mejores prácticas de seguridad"
  },
  {
    name: "DevOps y CI/CD",
    description: "Automatización de despliegues, integración y entrega continua"
  }
];

const RELACIONES = {
  "Desarrollo de APIs REST con Spring Boot": [
    "Anotaciones en Spring Boot",
    "Controladores REST",
    "Swagger / OpenAPI",
    "Manejo de Excepciones"
  ],
  "Introducción a Microservicios": [
    "Docker",
    "Spring Boot Actuator",
    "Spring Cloud"
  ],
  "Seguridad en Aplicaciones Web": [
    "JWT",
    "Spring Security",
    "OAuth2",
    "@ControllerAdvice"
  ],
  "DevOps y CI/CD": [
    "Docker",
    "CI/CD con Jenkins"
  ]
};

// 🔹 Mostrar Categorías con Tags relacionados
async function showCategoriesWithTags() {
  try {
    const categories = await Category.find().populate('tags');

    console.log("\n📂 Categorías y sus Tags relacionados:");
    for (const category of categories) {
      const tagNames = category.tags.map(tag => tag.name).join(', ');
      console.log(`🔸 ${category.name}: [${tagNames}]`);
    }
  } catch (err) {
    console.error("❌ Error al mostrar categorías con tags:", err);
  }
}

async function insertDataAndRelateTags() {
  try {
    if (!MONGO_URI) throw new Error("❌ Falta MONGODB_URI en el archivo .env");

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a MongoDB");

    // 🔹 Insertar Tags
    for (const tag of tags) {
      const exists = await Tag.findOne({ name: tag.name });
      if (!exists) {
        await Tag.create(tag);
        console.log(`🟢 Tag insertado: ${tag.name}`);
      } else {
        console.log(`🔹 Tag ya existe: ${tag.name}`);
      }
    }

    // 🔹 Insertar Categorías y Relacionar Tags
    for (const category of categories) {
      const existingCategory = await Category.findOne({ name: category.name });

      if (existingCategory) {
        console.log(`🔹 Categoría ya existe: ${category.name}`);
        continue;
      }

      const tagNames = RELACIONES[category.name] || [];
      const tagDocs = await Tag.find({ name: { $in: tagNames } });
      const tagIds = tagDocs.map(tag => tag._id);

      await Category.create({
        name: category.name,
        description: category.description,
        tags: tagIds
      });

      console.log(`🟢 Categoría insertada con ${tagIds.length} tags: ${category.name}`);
    }

    console.log("✅ Todo insertado y relacionado correctamente.");

    await showCategoriesWithTags(); // Mostrar relaciones

  } catch (err) {
    console.error("❌ Error durante la inserción:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexión a MongoDB cerrada.");
  }
}

insertDataAndRelateTags();
