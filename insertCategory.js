require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./server/models/Category');
const Tag = require('./server/models/Tags');

const MONGO_URI = process.env.MONGODB_URI;

const tags = [
  { name: "Variables y Tipos de Datos" },
  { name: "Operadores" },
  { name: "Control de Flujo" },
  { name: "Funciones y Métodos" },
  { name: "Arrays y Colecciones" },
  { name: "Programación Orientada a Objetos" },
  { name: "Encapsulamiento" },
  { name: "Herencia" },
  { name: "Polimorfismo" },
  { name: "Listas, Pilas y Colas" },
  { name: "Árboles y Grafos" },
  { name: "HashMap y HashSet" },
  { name: "Algoritmos de Búsqueda y Ordenación" },
  { name: "Recursividad" },
  { name: "Big-O Notation" },
  { name: "Generics" },
  { name: "Streams y Lambda" },
  { name: "Optional" },
  { name: "Date and Time API" },
  { name: "Enum y Anotaciones" },
  { name: "Concurrencia y Multihilos" },
  { name: "Java Memory Model" },
  { name: "Garbage Collection" },
  { name: "Servlets y JSP" },
  { name: "Spring Boot" },
  { name: "Controladores REST" },
  { name: "Spring Web MVC" },
  { name: "Validación de Formularios" },
  { name: "Swagger / OpenAPI" },
  { name: "Spring Security" },
  { name: "JWT" },
  { name: "OAuth2" },
  { name: "@ControllerAdvice" },
  { name: "Spring Boot Actuator" },
  { name: "Spring Cloud" },
  { name: "Eureka y Feign" },
  { name: "API Gateway" },
  { name: "Docker" },
  { name: "Jenkins y Pipelines" },
  { name: "CI/CD" },
  { name: "JUnit 5" },
  { name: "Mockito" },
  { name: "Spring Test" },
  { name: "TDD" },
  { name: "JDBC" },
  { name: "JPA / Hibernate" },
  { name: "Spring Data JPA" },
  { name: "MongoDB con Spring Boot" },
  { name: "Consumo de APIs REST" },
  { name: "RestTemplate y WebClient" },
  { name: "Jackson" },
  { name: "JAXB" },
  { name: "SOAP con JAX-WS" },
  { name: "Clean Code" },
  { name: "SOLID" },
  { name: "Arquitectura Hexagonal" },
  { name: "DDD" },
  { name: "Patrones de Diseño" },
  { name: "JavaFX" }
];

const categories = [
  {
    name: "Fundamentos de Java",
    description: "Aprende los conceptos básicos del lenguaje Java"
  },
  {
    name: "Estructuras de Datos y Algoritmos",
    description: "Domina estructuras de datos y algoritmos usando Java"
  },
  {
    name: "Java Avanzado",
    description: "Temas más complejos para desarrolladores intermedios"
  },
  {
    name: "Desarrollo Web con Java",
    description: "Aprende a construir aplicaciones web usando Java"
  },
  {
    name: "Seguridad en Java",
    description: "Conceptos y herramientas para proteger tus aplicaciones Java"
  },
  {
    name: "Microservicios con Java",
    description: "Aprende a construir sistemas distribuidos con Java"
  },
  {
    name: "DevOps con Java",
    description: "Herramientas para integrar, desplegar y escalar aplicaciones Java"
  },
  {
    name: "Pruebas en Java",
    description: "Técnicas y frameworks para realizar pruebas automáticas"
  },
  {
    name: "Persistencia de Datos con Java",
    description: "Manejo de bases de datos en aplicaciones Java"
  },
  {
    name: "Java y APIs Externas",
    description: "Integraciones y consumo de servicios externos"
  },
  {
    name: "Buenas Prácticas y Arquitectura",
    description: "Mejora la calidad y mantenibilidad de tu código"
  },
  {
    name: "Java para el Mundo Real",
    description: "Aplicaciones empresariales, sistemas legacy y más"
  }
];

const RELACIONES = {
  "Fundamentos de Java": [
    "Variables y Tipos de Datos",
    "Operadores",
    "Control de Flujo",
    "Funciones y Métodos",
    "Arrays y Colecciones",
    "Programación Orientada a Objetos",
    "Encapsulamiento",
    "Herencia",
    "Polimorfismo"
  ],
  "Estructuras de Datos y Algoritmos": [
    "Listas, Pilas y Colas",
    "Árboles y Grafos",
    "HashMap y HashSet",
    "Algoritmos de Búsqueda y Ordenación",
    "Recursividad",
    "Big-O Notation"
  ],
  "Java Avanzado": [
    "Generics",
    "Streams y Lambda",
    "Optional",
    "Date and Time API",
    "Enum y Anotaciones",
    "Concurrencia y Multihilos",
    "Java Memory Model",
    "Garbage Collection"
  ],
  "Desarrollo Web con Java": [
    "Servlets y JSP",
    "Spring Boot",
    "Controladores REST",
    "Spring Web MVC",
    "Validación de Formularios",
    "Swagger / OpenAPI"
  ],
  "Seguridad en Java": [
    "Spring Security",
    "JWT",
    "OAuth2",
    "@ControllerAdvice"
  ],
  "Microservicios con Java": [
    "Spring Boot",
    "Spring Boot Actuator",
    "Spring Cloud",
    "Eureka y Feign",
    "API Gateway"
  ],
  "DevOps con Java": [
    "Docker",
    "Jenkins y Pipelines",
    "CI/CD"
  ],
  "Pruebas en Java": [
    "JUnit 5",
    "Mockito",
    "Spring Test",
    "TDD"
  ],
  "Persistencia de Datos con Java": [
    "JDBC",
    "JPA / Hibernate",
    "Spring Data JPA",
    "MongoDB con Spring Boot"
  ],
  "Java y APIs Externas": [
    "Consumo de APIs REST",
    "RestTemplate y WebClient",
    "Jackson",
    "JAXB",
    "SOAP con JAX-WS"
  ],
  "Buenas Prácticas y Arquitectura": [
    "Clean Code",
    "SOLID",
    "Arquitectura Hexagonal",
    "DDD",
    "Patrones de Diseño"
  ],
  "Java para el Mundo Real": [
    "JavaFX"
  ]
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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

    for (const tag of tags) {
      const exists = await Tag.findOne({ name: tag.name });
      if (!exists) {
        await Tag.create({ ...tag, slug: slugify(tag.name) });
        console.log(`🟢 Tag insertado: ${tag.name}`);
      } else {
        console.log(`🔹 Tag ya existe: ${tag.name}`);
      }
    }

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
        tags: tagIds,
        slug: slugify(category.name)
      });

      console.log(`🟢 Categoría insertada con ${tagIds.length} tags: ${category.name}`);
    }

    console.log("✅ Todo insertado y relacionado correctamente.");
    await showCategoriesWithTags();
  } catch (err) {
    console.error("❌ Error durante la inserción:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexión a MongoDB cerrada.");
  }
}

insertDataAndRelateTags();
