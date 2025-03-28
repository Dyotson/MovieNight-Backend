const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const MovieNight = sequelize.define('MovieNight', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(5),
    allowNull: false,
    unique: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxProposals: {
    type: DataTypes.INTEGER,
    allowNull: true // null significa sin límite
  },
  maxVotesPerUser: {
    type: DataTypes.INTEGER,
    allowNull: true, // null significa sin límite
    defaultValue: null
  }
}, {
  timestamps: true,
  createdAt: true,
  updatedAt: true
});

// Modelo para propuestas de películas
const MovieProposal = sequelize.define('MovieProposal', {
  tmdbId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  posterPath: {
    type: DataTypes.STRING
  },
  overview: {
    type: DataTypes.TEXT
  },
  releaseDate: {
    type: DataTypes.STRING
  },
  votes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  proposedBy: {
    type: DataTypes.STRING
  },
  // Array de usuarios que han votado por esta película
  votersList: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true
});

// Modelo para usuarios (simple, sin autenticación)
const MovieNightUser = sequelize.define('MovieNightUser', {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  movieNightId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Array de IDs de propuestas por las que ha votado el usuario
  votedFor: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    // Crear un índice compuesto para buscar usuarios por nombre y sesión rápidamente
    {
      unique: true,
      fields: ['username', 'movieNightId']
    }
  ]
});

// Establecer relaciones
MovieNight.hasMany(MovieProposal, { as: 'movies', foreignKey: 'movieNightId' });
MovieProposal.belongsTo(MovieNight, { foreignKey: 'movieNightId' });

MovieNight.hasMany(MovieNightUser, { as: 'users', foreignKey: 'movieNightId' });
MovieNightUser.belongsTo(MovieNight, { foreignKey: 'movieNightId' });

module.exports = { MovieNight, MovieProposal, MovieNightUser };