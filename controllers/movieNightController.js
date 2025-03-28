const { MovieNight, MovieProposal, MovieNightUser } = require('../models/MovieNight');
const { customAlphabet } = require('nanoid');

// Generador de tokens de 5 caracteres (letras y números)
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);

// Crear una nueva sesión de MovieNight
exports.createMovieNight = async (req, res) => {
  try {
    const { name, date, maxProposals, maxVotesPerUser, username } = req.body;
    
    if (!name || !date) {
      return res.status(400).json({ error: 'Nombre y fecha son obligatorios' });
    }
    
    // Generar token único
    let token;
    let tokenExists = true;
    
    // Generar tokens hasta encontrar uno que no exista
    while (tokenExists) {
      token = nanoid();
      const existingNight = await MovieNight.findOne({ where: { token } });
      tokenExists = !!existingNight;
    }
    
    const movieNight = await MovieNight.create({
      name,
      token,
      date: new Date(date),
      maxProposals: maxProposals || null,
      maxVotesPerUser: maxVotesPerUser || null
    });
    
    // Si hay un nombre de usuario proporcionado, registrar al creador como usuario
    if (username) {
      await MovieNightUser.create({
        username,
        movieNightId: movieNight.id,
        votedFor: []
      });
    }
    
    res.status(201).json({
      success: true,
      movieNight: {
        id: movieNight.id,
        name: movieNight.name,
        token: movieNight.token,
        date: movieNight.date,
        maxProposals: movieNight.maxProposals,
        maxVotesPerUser: movieNight.maxVotesPerUser,
        inviteLink: `${req.protocol}://${req.get('host')}/night/${token}`
      }
    });
  } catch (error) {
    console.error('Error al crear MovieNight:', error);
    res.status(500).json({ error: 'Error al crear la sesión de MovieNight' });
  }
};

// Unirse a una sesión de MovieNight
exports.joinMovieNight = async (req, res) => {
  try {
    const { token } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio' });
    }
    
    // Buscar la sesión
    const movieNight = await MovieNight.findOne({ 
      where: { token },
      include: [{
        model: MovieProposal,
        as: 'movies',
        order: [['votes', 'DESC']]
      }]
    });
    
    if (!movieNight) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Comprobar si el usuario ya existe en esta sesión
    let user = await MovieNightUser.findOne({
      where: {
        username,
        movieNightId: movieNight.id
      }
    });
    
    if (!user) {
      // Crear nuevo usuario
      user = await MovieNightUser.create({
        username,
        movieNightId: movieNight.id,
        votedFor: []
      });
    }
    
    // Obtener los votos del usuario
    const userVotes = user.votedFor || [];
    const votesRemaining = movieNight.maxVotesPerUser ? movieNight.maxVotesPerUser - userVotes.length : null;
    
    res.json({
      success: true,
      movieNight: {
        id: movieNight.id,
        name: movieNight.name,
        token: movieNight.token,
        date: movieNight.date,
        maxProposals: movieNight.maxProposals,
        maxVotesPerUser: movieNight.maxVotesPerUser,
        movies: movieNight.movies
      },
      user: {
        username: user.username,
        votedFor: userVotes,
        votesRemaining: votesRemaining
      }
    });
  } catch (error) {
    console.error('Error al unirse a MovieNight:', error);
    res.status(500).json({ error: 'Error al unirse a la sesión de MovieNight' });
  }
};

// Obtener una sesión por token
exports.getMovieNightByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { username } = req.query; // Ahora recibimos el nombre de usuario como query param
    
    const movieNight = await MovieNight.findOne({ 
      where: { token },
      include: [{
        model: MovieProposal,
        as: 'movies',
        order: [['votes', 'DESC']]
      }]
    });
    
    if (!movieNight) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    let userVotes = [];
    let votesRemaining = null;
    
    // Si hay un nombre de usuario, obtener sus votos
    if (username) {
      const user = await MovieNightUser.findOne({
        where: {
          username,
          movieNightId: movieNight.id
        }
      });
      
      if (user) {
        userVotes = user.votedFor || [];
        votesRemaining = movieNight.maxVotesPerUser ? movieNight.maxVotesPerUser - userVotes.length : null;
      } else {
        // Si el usuario no existe, podría unirse en este momento
        votesRemaining = movieNight.maxVotesPerUser || null;
      }
    }
    
    res.json({
      success: true,
      movieNight: {
        id: movieNight.id,
        name: movieNight.name,
        token: movieNight.token,
        date: movieNight.date,
        maxProposals: movieNight.maxProposals,
        maxVotesPerUser: movieNight.maxVotesPerUser,
        movies: movieNight.movies
      },
      userVotes,
      votesRemaining
    });
  } catch (error) {
    console.error('Error al obtener MovieNight:', error);
    res.status(500).json({ error: 'Error al obtener la sesión de MovieNight' });
  }
};

// Proponer una película
exports.proposeMovie = async (req, res) => {
  try {
    const { token } = req.params;
    const { movie, proposedBy } = req.body;
    
    if (!proposedBy) {
      return res.status(400).json({ error: 'Se requiere un nombre de usuario para proponer una película' });
    }
    
    const movieNight = await MovieNight.findOne({ 
      where: { token },
      include: [{
        model: MovieProposal,
        as: 'movies'
      }]
    });
    
    if (!movieNight) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Verificar si se alcanzó el límite de propuestas
    if (movieNight.maxProposals && movieNight.movies.length >= movieNight.maxProposals) {
      return res.status(400).json({ error: 'Se alcanzó el límite de propuestas para esta sesión' });
    }
    
    // Verificar si la película ya fue propuesta
    const existingMovie = movieNight.movies.find(m => m.tmdbId === movie.tmdbId);
    
    if (existingMovie) {
      return res.status(400).json({ error: 'Esta película ya ha sido propuesta' });
    }
    
    // Buscar o crear el usuario
    let user = await MovieNightUser.findOne({
      where: {
        username: proposedBy,
        movieNightId: movieNight.id
      }
    });
    
    if (!user) {
      user = await MovieNightUser.create({
        username: proposedBy,
        movieNightId: movieNight.id,
        votedFor: []
      });
    }
    
    // Verificar si el usuario alcanzó su límite de votos
    const votedFor = user.votedFor || [];
    
    if (movieNight.maxVotesPerUser && votedFor.length >= movieNight.maxVotesPerUser) {
      return res.status(400).json({ 
        error: `Has alcanzado tu límite de ${movieNight.maxVotesPerUser} votos para esta sesión` 
      });
    }
    
    // Agregar la película
    const movieProposal = await MovieProposal.create({
      movieNightId: movieNight.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      posterPath: movie.poster_path,
      overview: movie.overview,
      releaseDate: movie.release_date,
      votes: 1, // El proponente da el primer voto
      proposedBy,
      votersList: [proposedBy] // Registrar al proponente como primer votante
    });
    
    // Actualizar los votos del usuario
    votedFor.push(movieProposal.id);
    await user.update({ votedFor });
    
    // Calcular votos restantes
    const votesRemaining = movieNight.maxVotesPerUser ? movieNight.maxVotesPerUser - votedFor.length : null;
    
    // Recargar la sesión con las películas actualizadas
    const updatedMovieNight = await MovieNight.findOne({ 
      where: { token },
      include: [{
        model: MovieProposal,
        as: 'movies',
        order: [['votes', 'DESC']]
      }]
    });
    
    res.json({
      success: true,
      message: 'Película propuesta correctamente',
      movieNight: {
        id: movieNight.id,
        name: movieNight.name,
        movies: updatedMovieNight.movies
      },
      userVotes: votedFor,
      votesRemaining
    });
  } catch (error) {
    console.error('Error al proponer película:', error);
    res.status(500).json({ error: 'Error al proponer la película' });
  }
};

// Votar por una película
exports.voteForMovie = async (req, res) => {
  try {
    const { token, tmdbId } = req.params;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Se requiere un nombre de usuario para votar' });
    }
    
    const movieNight = await MovieNight.findOne({ 
      where: { token },
      include: [{
        model: MovieProposal,
        as: 'movies'
      }]
    });
    
    if (!movieNight) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Encontrar la película
    const movie = movieNight.movies.find(m => m.tmdbId === parseInt(tmdbId));
    
    if (!movie) {
      return res.status(404).json({ error: 'Película no encontrada en esta sesión' });
    }
    
    // Buscar o crear el usuario
    let user = await MovieNightUser.findOne({
      where: {
        username,
        movieNightId: movieNight.id
      }
    });
    
    if (!user) {
      user = await MovieNightUser.create({
        username,
        movieNightId: movieNight.id,
        votedFor: []
      });
    }
    
    // Verificar si el usuario ya votó por esta película
    const votedFor = user.votedFor || [];
    const votersList = movie.votersList || [];
    
    if (votedFor.includes(movie.id) || votersList.includes(username)) {
      return res.status(400).json({ error: 'Ya has votado por esta película' });
    }
    
    // Verificar si el usuario alcanzó su límite de votos
    if (movieNight.maxVotesPerUser && votedFor.length >= movieNight.maxVotesPerUser) {
      return res.status(400).json({ 
        error: `Has alcanzado tu límite de ${movieNight.maxVotesPerUser} votos para esta sesión` 
      });
    }
    
    // Incrementar votos
    movie.votes += 1;
    votersList.push(username);
    await movie.update({ 
      votes: movie.votes,
      votersList
    });
    
    // Actualizar los votos del usuario
    votedFor.push(movie.id);
    await user.update({ votedFor });
    
    // Calcular votos restantes
    const votesRemaining = movieNight.maxVotesPerUser ? movieNight.maxVotesPerUser - votedFor.length : null;
    
    // Recargar todas las películas ordenadas por votos
    const updatedProposals = await MovieProposal.findAll({
      where: { movieNightId: movieNight.id },
      order: [['votes', 'DESC']]
    });
    
    res.json({
      success: true,
      message: 'Voto registrado correctamente',
      movie: movie,
      movies: updatedProposals,
      userVotes: votedFor,
      votesRemaining
    });
  } catch (error) {
    console.error('Error al votar por película:', error);
    res.status(500).json({ error: 'Error al registrar el voto' });
  }
};

// Obtener usuarios de una sesión
exports.getMovieNightUsers = async (req, res) => {
  try {
    const { token } = req.params;
    
    const movieNight = await MovieNight.findOne({ 
      where: { token }
    });
    
    if (!movieNight) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    const users = await MovieNightUser.findAll({
      where: { movieNightId: movieNight.id },
      order: [['joinedAt', 'ASC']]
    });
    
    res.json({
      success: true,
      users: users.map(user => ({
        username: user.username,
        joinedAt: user.joinedAt,
        votedCount: user.votedFor ? user.votedFor.length : 0,
        votesRemaining: movieNight.maxVotesPerUser ? movieNight.maxVotesPerUser - (user.votedFor ? user.votedFor.length : 0) : null
      }))
    });
  } catch (error) {
    console.error('Error al obtener usuarios de MovieNight:', error);
    res.status(500).json({ error: 'Error al obtener usuarios de la sesión' });
  }
};

// Nueva función para obtener las estadísticas de votación
exports.getVotingStats = async (req, res) => {
  try {
    const { token } = req.params;
    
    const movieNight = await MovieNight.findOne({ 
      where: { token },
      include: [{
        model: MovieProposal,
        as: 'movies',
        order: [['votes', 'DESC']]
      }]
    });
    
    if (!movieNight) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    const users = await MovieNightUser.findAll({
      where: { movieNightId: movieNight.id }
    });
    
    const totalUsers = users.length;
    const totalVotes = users.reduce((sum, user) => sum + (user.votedFor ? user.votedFor.length : 0), 0);
    const usersVoted = users.filter(user => user.votedFor && user.votedFor.length > 0).length;
    
    // Películas más votadas
    const topMovies = movieNight.movies
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 3)
      .map(movie => ({
        title: movie.title,
        votes: movie.votes,
        percentOfUsers: totalUsers > 0 ? Math.round((movie.votes / totalUsers) * 100) : 0
      }));
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        usersVoted,
        totalVotes,
        averageVotesPerUser: totalUsers > 0 ? (totalVotes / totalUsers).toFixed(1) : 0,
        percentUsersVoted: totalUsers > 0 ? Math.round((usersVoted / totalUsers) * 100) : 0,
        topMovies,
        maxVotesPerUser: movieNight.maxVotesPerUser,
        movieNightEndsIn: movieNight.date ? new Date(movieNight.date) - new Date() : null
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de votación:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de votación' });
  }
};