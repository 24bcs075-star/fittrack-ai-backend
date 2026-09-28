const mongoose = require('mongoose');
const Workout = require('../models/Workout');

// @desc    Add a new workout
// @route   POST /api/workouts
// @access  Private
const addWorkout = async (req, res, next) => {
  try {
    const { workoutName, category, duration, caloriesBurned, workoutDate } = req.body;

    // Validate required fields
    if (!workoutName || !category || duration === undefined || caloriesBurned === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide workoutName, category, duration, and caloriesBurned',
      });
    }

    // Create workout — user always comes from the JWT, never from the request body
    const workout = await Workout.create({
      workoutName,
      category,
      duration,
      caloriesBurned,
      workoutDate: workoutDate || new Date(),
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Workout added successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workouts for the authenticated user (with pagination)
// @route   GET /api/workouts
// @access  Private
const getWorkouts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    const [workouts, total] = await Promise.all([
      Workout.find(filter).sort({ workoutDate: -1 }).skip(skip).limit(limit),
      Workout.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Workouts retrieved successfully',
      data: workouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout statistics for the authenticated user
// @route   GET /api/workouts/stats
// @access  Private
const getWorkoutStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate overall stats and per-category breakdown in a single pipeline
    const [overallStats] = await Workout.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          averageDuration: { $avg: '$duration' },
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          averageCaloriesBurned: { $avg: '$caloriesBurned' },
        },
      },
    ]);

    const categoryBreakdown = await Workout.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Recent workouts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Workout.find({
      user: userId,
      workoutDate: { $gte: sevenDaysAgo },
    })
      .sort({ workoutDate: -1 })
      .select('workoutName category duration caloriesBurned workoutDate');

    const stats = overallStats
      ? {
          totalWorkouts: overallStats.totalWorkouts,
          totalDuration: Math.round(overallStats.totalDuration),
          averageDuration: Math.round(overallStats.averageDuration * 10) / 10,
          totalCaloriesBurned: Math.round(overallStats.totalCaloriesBurned),
          averageCaloriesBurned: Math.round(overallStats.averageCaloriesBurned * 10) / 10,
        }
      : {
          totalWorkouts: 0,
          totalDuration: 0,
          averageDuration: 0,
          totalCaloriesBurned: 0,
          averageCaloriesBurned: 0,
        };

    res.status(200).json({
      success: true,
      message: 'Workout statistics retrieved successfully',
      data: {
        ...stats,
        workoutsByCategory: categoryBreakdown.map((cat) => ({
          category: cat._id,
          count: cat.count,
          totalDuration: cat.totalDuration,
          totalCaloriesBurned: cat.totalCaloriesBurned,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search workouts by name, category, or date range
// @route   GET /api/workouts/search
// @access  Private
const searchWorkouts = async (req, res, next) => {
  try {
    const { name, category, date, from, to } = req.query;

    // Build query strictly scoped to the authenticated user
    const filter = { user: req.user._id };
    const conditions = [];

    if (name) {
      conditions.push({ workoutName: { $regex: name, $options: 'i' } });
    }

    if (category) {
      conditions.push({ category: { $regex: category, $options: 'i' } });
    }

    // Exact date search (single day)
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const start = new Date(parsedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsedDate);
        end.setHours(23, 59, 59, 999);
        filter.workoutDate = { $gte: start, $lte: end };
      }
    }

    // Date range search
    if (from || to) {
      filter.workoutDate = filter.workoutDate || {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        if (!isNaN(fromDate.getTime())) {
          filter.workoutDate.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        if (!isNaN(toDate.getTime())) {
          filter.workoutDate.$lte = toDate;
        }
      }
    }

    if (conditions.length > 0) {
      filter.$or = conditions;
    }

    const workouts = await Workout.find(filter).sort({ workoutDate: -1 });

    res.status(200).json({
      success: true,
      message: `Found ${workouts.length} workout(s) matching your search`,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single workout by ID
// @route   GET /api/workouts/:id
// @access  Private
const getWorkoutById = async (req, res, next) => {
  try {
    // Find by both _id and user to enforce ownership in a single query
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workout retrieved successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a workout
// @route   PUT /api/workouts/:id
// @access  Private
const updateWorkout = async (req, res, next) => {
  try {
    // Verify ownership before any update
    const existingWorkout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!existingWorkout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    // Strip fields that must never be changed via API
    const { user, _id, ...allowedUpdates } = req.body;

    const workout = await Workout.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Workout updated successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
// @access  Private
const deleteWorkout = async (req, res, next) => {
  try {
    // findOneAndDelete verifies ownership atomically
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  searchWorkouts,
  getWorkoutStats,
};
