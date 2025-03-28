require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/config');
const movieNightRoutes = require('./routes/movieNights');
const movieRoutes = require('./routes/movies');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/nights', movieNightRoutes);
app.use('/api/movies', movieRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de MovieNight' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Determinar si estamos en Vercel o en un entorno de desarrollo
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  // En Vercel, sincronizar solo una vez al iniciar - con { force: false, alter: true }
  sequelize.authenticate()
    .then(() => {
      console.log('Conectado a PostgreSQL en Vercel');
      return sequelize.sync({ alter: true });
    })
    .then(() => {
      console.log('Modelos sincronizados en Vercel');
    })
    .catch((err) => {
      console.error('Error en Vercel:', err);
    });
} else {
  // En desarrollo, sincronizamos modelos y arrancamos el servidor
  sequelize.sync()
    .then(() => {
      console.log('Conectado a PostgreSQL y tablas sincronizadas');
      // Iniciar servidor
      app.listen(port, () => {
        console.log(`Servidor MovieNight ejecutándose en http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error('Error conectando a PostgreSQL:', err);
    });
}

// Exportar la aplicación para Vercel
module.exports = app;