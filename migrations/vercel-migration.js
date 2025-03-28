const { Sequelize } = require('sequelize');
require('dotenv').config();

async function runMigrations() {
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sequelize.authenticate();
    console.log('Conexión establecida con éxito.');

    // Forzar la creación de tablas
    const { MovieNight, MovieProposal, MovieNightUser } = require('../models/MovieNight');
    const Movie = require('../models/Movie');

    // Sincronizar cada modelo explícitamente
    await Movie.sync({ alter: true });
    await MovieNight.sync({ alter: true });
    await MovieProposal.sync({ alter: true });
    await MovieNightUser.sync({ alter: true });

    console.log('Tablas creadas/actualizadas correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('No se pudieron crear las tablas:', error);
    process.exit(1);
  }
}

runMigrations();