const express = require('express');
const router = express.Router();
const movieNightController = require('../controllers/movieNightController');

// Crear una sesión de MovieNight
router.post('/', movieNightController.createMovieNight);

// Unirse a una sesión de MovieNight
router.post('/:token/join', movieNightController.joinMovieNight);

// Obtener una sesión por token
router.get('/:token', movieNightController.getMovieNightByToken);

// Proponer una película
router.post('/:token/propose', movieNightController.proposeMovie);

// Votar por una película
router.post('/:token/vote/:tmdbId', movieNightController.voteForMovie);

// Obtener usuarios de una sesión
router.get('/:token/users', movieNightController.getMovieNightUsers);

// Obtener estadísticas de votación
router.get('/:token/stats', movieNightController.getVotingStats);

module.exports = router;