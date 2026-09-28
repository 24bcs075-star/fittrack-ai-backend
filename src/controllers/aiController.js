const geminiService = require('../services/geminiService');

// @desc    Get AI workout recommendation
// @route   POST /api/ai/recommendation
// @access  Private
const getWorkoutRecommendation = async (req, res, next) => {
  try {
    const { age, fitnessGoal, experienceLevel } = req.body;

    // Validate inputs
    if (age === undefined || !fitnessGoal || !experienceLevel) {
      return res.status(400).json({
        success: false,
        message: 'Please provide age, fitnessGoal, and experienceLevel',
      });
    }

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid age between 1 and 120',
      });
    }

    const recommendation = await geminiService.generateWorkoutRecommendation(
      parsedAge,
      fitnessGoal,
      experienceLevel
    );

    res.status(200).json({
      success: true,
      message: 'Workout recommendation generated successfully',
      data: {
        recommendation,
        inputs: { age: parsedAge, fitnessGoal, experienceLevel },
      },
    });
  } catch (error) {
    // Pass AI-specific errors to the central error handler
    next(error);
  }
};

// @desc    Get AI fitness insights
// @route   POST /api/ai/insights
// @access  Private
const getFitnessInsights = async (req, res, next) => {
  try {
    const { totalWorkouts, averageWorkoutDuration, totalCaloriesBurned } = req.body;

    // Validate inputs
    if (
      totalWorkouts === undefined ||
      averageWorkoutDuration === undefined ||
      totalCaloriesBurned === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide totalWorkouts, averageWorkoutDuration, and totalCaloriesBurned',
      });
    }

    const insight = await geminiService.generateFitnessInsights(
      totalWorkouts,
      averageWorkoutDuration,
      totalCaloriesBurned
    );

    res.status(200).json({
      success: true,
      message: 'Fitness insights generated successfully',
      data: {
        insight,
        inputs: { totalWorkouts, averageWorkoutDuration, totalCaloriesBurned },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkoutRecommendation,
  getFitnessInsights,
};
