const express = require('express');
const { getWorkoutRecommendation, getFitnessInsights } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all AI routes — prevents unauthorized LLM API usage
router.use(protect);

// POST /api/ai/recommendation
router.post('/recommendation', getWorkoutRecommendation);

// POST /api/ai/insights
router.post('/insights', getFitnessInsights);

module.exports = router;
