const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Movie = sequelize.define('Movie', {
  tmdbId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalTitle: {
    type: DataTypes.STRING
  },
  overview: {
    type: DataTypes.TEXT
  },
  posterPath: {
    type: DataTypes.STRING
  },
  backdropPath: {
    type: DataTypes.STRING
  },
  releaseDate: {
    type: DataTypes.DATE
  },
  genres: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  runtime: {
    type: DataTypes.INTEGER
  },
  voteAverage: {
    type: DataTypes.FLOAT
  },
  popularity: {
    type: DataTypes.FLOAT
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

// Método para verificar si los datos de la película necesitan actualizarse
Movie.prototype.needsUpdate = function() {
  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  const now = new Date();
  const lastUpdated = this.lastUpdated || new Date(0);
  
  // Actualizar si han pasado más de 24 horas desde la última actualización
  return (now - lastUpdated) > oneDayInMs;
};

module.exports = Movie;