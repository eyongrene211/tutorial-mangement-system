import mongoose from 'mongoose';

// ✅ CRITICAL: Delete the model from cache before redefining
if (mongoose.models.Student) {
  delete mongoose.models.Student;
}

const StudentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'], // ✅ MUST be capitalized
      required: [true, 'Gender is required'],
    },
    classLevel: {
      type: String,
      enum: [
        'Form 1',
        'Form 2',
        'Form 3',
        'Form 4',
        'Form 5',
        'Lower Sixth',
        'Upper Sixth',
      ],
      required: [true, 'Class level is required'],
      index: true,
    },
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    parentInfo: {
      name: {
        type: String,
        required: [true, 'Parent name is required'],
      },
      phone: {
        type: String,
        required: [true, 'Parent phone is required'],
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
StudentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
StudentSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Indexes
StudentSchema.index({ lastName: 1, firstName: 1 });
StudentSchema.index({ 'parentInfo.phone': 1 });
StudentSchema.index({ 'parentInfo.email': 1 });
StudentSchema.index({ status: 1, classLevel: 1 });

// ✅ Use mongoose.models pattern to prevent recompilation
export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
