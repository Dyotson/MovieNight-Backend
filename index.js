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

// Sincronizar modelos con la base de datos y luego iniciar servidor
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