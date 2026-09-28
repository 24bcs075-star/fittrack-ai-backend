const express = require('express');
const {
  addWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  searchWorkouts,
  getWorkoutStats,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply JWT authentication to every workout route
router.use(protect);

// IMPORTANT: Static path routes (/search, /stats) MUST be declared
// BEFORE the dynamic /:id route to prevent Express routing conflicts
router.get('/search', searchWorkouts);
router.get('/stats', getWorkoutStats);

router.route('/').post(addWorkout).get(getWorkouts);

router.route('/:id').get(getWorkoutById).put(updateWorkout).delete(deleteWorkout);

module.exports = router;
