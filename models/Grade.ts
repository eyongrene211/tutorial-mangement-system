import mongoose from 'mongoose';

// Clear model cache
if (mongoose.models.Grade) {
  delete mongoose.models.Grade;
}

const GradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    testDate: {
      type: Date,
      required: [true, 'Test date is required'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
    },
    maxScore: {
      type: Number,
      required: [true, 'Max score is required'],
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    testType: {
      type: String,
      enum: ['quiz', 'exam', 'homework', 'assignment'],
      default: 'exam',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
GradeSchema.index({ student: 1, subject: 1, testDate: -1 });
GradeSchema.index({ testDate: -1 });

export default mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
