import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    // There should only be one settings document
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Tutorial Center Settings
    centerName: {
      type: String,
      default: 'Tutorial Center',
    },
    centerEmail: {
      type: String,
    },
    centerPhone: {
      type: String,
    },
    centerAddress: {
      type: String,
    },
    centerLogo: {
      type: String,
    },
    
    // Academic Settings
    subjects: {
      type: [String],
      default: ['Mathematics', 'Physics', 'Chemistry', 'English', 'French', 'Biology', 'History', 'Geography'],
    },
    classLevels: {
      type: [String],
      default: ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower 6', 'Upper 6'],
    },
    academicYear: {
      type: String,
      default: '2025-2026',
    },
    
    // Payment Settings
    currency: {
      type: String,
      default: 'FCFA',
    },
    defaultPaymentAmount: {
      type: Number,
      default: 20000,
    },
    
    // Notification Settings
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    
    // Grading System
    gradingScale: {
      type: String,
      enum: ['percentage', 'gpa', 'letter'],
      default: 'percentage',
    },
    passingGrade: {
      type: Number,
      default: 50,
    },
    
    // System Settings
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY',
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '24h',
    },
    language: {
      type: String,
      enum: ['en', 'fr'],
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
