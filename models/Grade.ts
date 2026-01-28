import mongoose from 'mongoose';

const GradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
    },
    testType: {
      type: String,
      required: [true, 'Test type is required'],
      enum: ['quiz', 'exam', 'homework', 'assignment'],
      default: 'quiz',
    },
    testDate: {
      type: Date,
      required: [true, 'Test date is required'],
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
    },
    maxScore: {
      type: Number,
      required: [true, 'Max score is required'],
      min: [1, 'Max score must be at least 1'],
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    term: {
      type: String,
      default: 'Term 1',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
GradeSchema.index({ student: 1, subject: 1, testDate: -1 });

const Grade = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);

export default Grade;
