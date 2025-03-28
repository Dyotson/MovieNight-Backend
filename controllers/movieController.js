const axios = require('axios');
const Movie = require('../models/Movie');
const { Op } = require('sequelize');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Función auxiliar para convertir datos de TMDB a nuestro formato
const formatMovieData = (tmdbMovie) => {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    originalTitle: tmdbMovie.original_title,
    overview: tmdbMovie.overview,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
    genres: tmdbMovie.genres || [],
    runtime: tmdbMovie.runtime,
    voteAverage: tmdbMovie.vote_average,
    popularity: tmdbMovie.popularity,
    lastUpdated: new Date()
  };
};

// Buscar películas
exports.searchMovies = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }
    
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
        language: 'en-US',
        include_adult: false
      }
    });
    
    // Guardar o actualizar películas en nuestra base de datos
    if (response.data.results && response.data.results.length > 0) {
      for (const tmdbMovie of response.data.results) {
        try {
          let movie = await Movie.findOne({ where: { tmdbId: tmdbMovie.id } });
          
          if (movie) {
            if (movie.needsUpdate()) {
              // Actualizar película existente con datos completos
              const detailsResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbMovie.id}`, {
                params: {
                  api_key: TMDB_API_KEY,
                  language: 'en-US'
                }
              });
              
              await movie.update(formatMovieData(detailsResponse.data));
            }
          } else {
            // Crear nueva entrada con datos básicos
            await Movie.create({
              tmdbId: tmdbMovie.id,
              title: tmdbMovie.title,
              originalTitle: tmdbMovie.original_title,
              overview: tmdbMovie.overview,
              posterPath: tmdbMovie.poster_path,
              backdropPath: tmdbMovie.backdrop_path,
              releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
              voteAverage: tmdbMovie.vote_average,
              popularity: tmdbMovie.popularity
            });
          }
        } catch (err) {
          console.error(`Error al guardar película en caché: ${err.message}`);
          // Continuar con las demás películas aunque haya error
        }
      }
    }
    
    res.json({
      success: true,
      results: response.data.results
    });
  } catch (error) {
    console.error('Error al buscar películas:', error);
    res.status(500).json({ error: 'Error al buscar películas' });
  }
};

// Obtener detalles de una película
exports.getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tmdbId = parseInt(id);
    let movieData;
    let needsFreshData = true;
    
    // Buscar primero en nuestra base de datos
    const cachedMovie = await Movie.findOne({ where: { tmdbId } });
    
    if (cachedMovie && !cachedMovie.needsUpdate()) {
      // Si tenemos datos actualizados, usamos esos
      needsFreshData = false;
      movieData = {
        id: cachedMovie.tmdbId,
        title: cachedMovie.title,
        original_title: cachedMovie.originalTitle,
        overview: cachedMovie.overview,
        poster_path: cachedMovie.posterPath,
        backdrop_path: cachedMovie.backdropPath,
        release_date: cachedMovie.releaseDate ? cachedMovie.releaseDate.toISOString().split('T')[0] : null,
        genres: cachedMovie.genres,
        runtime: cachedMovie.runtime,
        vote_average: cachedMovie.voteAverage,
        popularity: cachedMovie.popularity
      };
    }
    
    if (needsFreshData) {
      // Si no tenemos datos o están desactualizados, consultamos la API
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          append_to_response: 'videos,credits'
        }
      });
      
      movieData = response.data;
      
      // Actualizar o crear entrada en base de datos
      if (cachedMovie) {
        await cachedMovie.update(formatMovieData(movieData));
      } else {
        await Movie.create(formatMovieData(movieData));
      }
    }
    
    res.json({
      success: true,
      movie: movieData
    });
  } catch (error) {
    console.error('Error al obtener detalles de película:', error);
    res.status(500).json({ error: 'Error al obtener detalles de la película' });
  }
};

// Obtener películas populares
exports.getPopularMovies = async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });
    
    // Guardar o actualizar películas populares en caché
    if (response.data.results && response.data.results.length > 0) {
      // Procesamos las películas en paralelo
      await Promise.all(response.data.results.map(async (tmdbMovie) => {
        try {
          let movie = await Movie.findOne({ where: { tmdbId: tmdbMovie.id } });
          
          if (movie) {
            if (movie.needsUpdate()) {
              await movie.update(formatMovieData(tmdbMovie));
            }
          } else {
            await Movie.create(formatMovieData(tmdbMovie));
          }
        } catch (err) {
          console.error(`Error al guardar película popular en caché: ${err.message}`);
        }
      }));
    }
    
    res.json({
      success: true,
      results: response.data.results
    });
  } catch (error) {
    console.error('Error al obtener películas populares:', error);
    res.status(500).json({ error: 'Error al obtener películas populares' });
  }
};

// Nueva función: Obtener películas del caché local
exports.getCachedMovies = async (req, res) => {
  try {
    const { limit = 20, sort = 'popularity' } = req.query;
    
    // Aplicamos ordenamiento según el parámetro
    let order = [];
    if (sort === 'popularity') {
      order = [['popularity', 'DESC']];
    } else if (sort === 'rating') {
      order = [['voteAverage', 'DESC']];
    } else if (sort === 'date') {
      order = [['releaseDate', 'DESC']];
    }
    
    const movies = await Movie.findAll({
      order,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: movies.length,
      results: movies.map(movie => ({
        id: movie.tmdbId,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.posterPath,
        release_date: movie.releaseDate ? movie.releaseDate.toISOString().split('T')[0] : null,
        vote_average: movie.voteAverage
      }))
    });
  } catch (error) {
    console.error('Error al obtener películas del caché:', error);
    res.status(500).json({ error: 'Error al obtener películas' });
  }
};