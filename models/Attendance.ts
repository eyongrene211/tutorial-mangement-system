import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  createdAt: Date;
  updatedAt: Date;
}

// Delete existing model
if (mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}

const AttendanceSchema: Schema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to prevent duplicate entries
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
