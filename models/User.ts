import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  clerkUserId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'parent' | 'tutor';
  phone: string;
  status: 'active' | 'inactive';
  studentId?: mongoose.Types.ObjectId | null;
  students?: mongoose.Types.ObjectId[];
  subjects?: string[];
  username?: string;
  address?: string;
  name?: string;
  tempPassword?: string;
  requirePasswordChange?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Delete existing model to avoid conflicts
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const UserSchema = new Schema<IUser>(
  {
    clerkUserId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'parent', 'tutor'],
      default: 'teacher',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    students: [{
      type: Schema.Types.ObjectId,
      ref: 'Student',
    }],
    subjects: [{
      type: String,
    }],
    tempPassword: {
      type: String,
    },
    requirePasswordChange: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
