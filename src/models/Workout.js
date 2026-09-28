const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workout must belong to a user'],
      index: true,
    },
    workoutName: {
      type: String,
      required: [true, 'Please add a workout name'],
      trim: true,
      maxlength: [100, 'Workout name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a workout category'],
      enum: {
        values: [
          'Strength',
          'Cardio',
          'Flexibility',
          'HIIT',
          'Yoga',
          'Sports',
          'Running',
          'Cycling',
          'Walking',
          'Other',
        ],
        message: '"{VALUE}" is not a supported workout category',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Please add the workout duration in minutes'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    caloriesBurned: {
      type: Number,
      required: [true, 'Please specify calories burned'],
      min: [0, 'Calories burned cannot be negative'],
    },
    workoutDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient per-user sorted queries
workoutSchema.index({ user: 1, workoutDate: -1 });
workoutSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Workout', workoutSchema);
