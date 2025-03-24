require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGO_URI = process.env.MONGODB_URI;

const ROLES = {
  admin: '67cdbc71736fed7002955c39',
  editor: '67cdbc71736fed7002955c3d',
  user: '67cdbc71736fed7002955c40',
};

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('❌ Debes definir MONGODB_URI en el .env');
  }

  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('✅ Conectado a MongoDB');
}

async function insertUsers() {
  try {
    await connectDB();

    const usersData = [
      {
        username: 'superAdminUser',
        email: 'superadmin@example.com',
        password: 'superadmin123',
        roles: [ROLES.admin]
      },
      {
        username: 'editorUser',
        email: 'editor@example.com',
        password: 'editor123',
        roles: [ROLES.editor]
      },
      {
        username: 'regularUser',
        email: 'user@example.com',
        password: 'user123',
        roles: [ROLES.user]
      },
      {
        username: 'multiRoleUser',
        email: 'multi@example.com',
        password: 'multi123',
        roles: [ROLES.user, ROLES.editor]
      }
    ];

    for (const user of usersData) {
      const exists = await User.findOne({ email: user.email });
      if (exists) {
        console.log(`🔹 Usuario ya existe: ${user.email}`);
        continue;
      }

      const newUser = new User({
        username: user.username,
        email: user.email,
        password: user.password, // el modelo lo hashea en pre('save')
        roles: user.roles,
        isActive: true
      });

      await newUser.save(); // Aquí se activa el middleware
      console.log(`✅ Usuario creado: ${user.username} (${user.email})`);
    }

    console.log('🎉 Inserción de usuarios completada');
  } catch (error) {
    console.error('❌ Error en la inserción:', error);
  } finally {
    mongoose.connection.close();
  }
}

insertUsers();
