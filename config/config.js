const { Sequelize } = require('sequelize');

// Permitir un tiempo de conexión más largo para entornos serverless
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Aumentar timeouts para entornos serverless
    connectTimeout: 60000
  },
  pool: {
    max: 2, // Limitar el número de conexiones para Vercel
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;