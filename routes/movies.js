const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Buscar películas
router.get('/search', movieController.searchMovies);

// Obtener películas en caché
router.get('/cached', movieController.getCachedMovies);

// Obtener películas populares
router.get('/popular', movieController.getPopularMovies);

// Obtener detalles de una película (debe estar al final)
router.get('/:id', movieController.getMovieDetails);

module.exports = router;