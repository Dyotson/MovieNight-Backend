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

// Ruta para forzar migración (solo para administradores)
app.post('/api/admin/migrate', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  
  // Verificar autenticación básica para seguridad
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    // Importar y ejecutar la migración
    const runMigrations = require('./migrations/vercel-migration');
    const result = await runMigrations();
    
    if (result.success) {
      res.json({ success: true, message: 'Migración completada con éxito' });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error durante la migración', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error ejecutando migración:', error);
    res.status(500).json({ success: false, error: 'Error durante la migración' });
  }
});

// Rutas
app.use('/api/nights', movieNightRoutes);
app.use('/api/movies', movieRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de MovieNight' });
});

// Manejo de errores específico para tablas faltantes
app.use((err, req, res, next) => {
  // Detectar error específico de tabla no existente
  if (err.name === 'SequelizeDatabaseError' && 
      err.parent && 
      err.parent.code === '42P01') {
    console.error('Error de tabla no existente:', err.parent.table);
    return res.status(500).json({ 
      error: 'La base de datos necesita inicialización. Por favor, ejecute la migración.',
      code: 'DB_TABLES_MISSING'
    });
  }
  
  // Otros errores
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Determinar si estamos en Vercel o en un entorno de desarrollo
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  // En Vercel, solo autenticamos y no usamos sync directamente
  // La sincronización se hace en el script de migración
  sequelize.authenticate()
    .then(() => {
      console.log('Conectado a PostgreSQL en Vercel');
    })
    .catch((err) => {
      console.error('Error de conexión en Vercel:', err);
    });
} else {
  // En desarrollo, sincronizamos modelos y arrancamos el servidor
  sequelize.sync({ alter: true })
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

// Para entornos serverless como Vercel
module.exports = app;