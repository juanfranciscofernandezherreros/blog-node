require('dotenv').config(); // Cargar variables de entorno

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Please check your .env file.');
    }

    mongoose.set('strictQuery', false); // Opcional, según tu versión de Mongoose
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Salir con error
  }
};

module.exports = connectDB;
