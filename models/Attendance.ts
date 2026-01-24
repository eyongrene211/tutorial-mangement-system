import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject: string;
  remarks?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: [true, 'Status is required'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    remarks: {
      type: String,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorded by is required'],
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ student: 1, date: 1, subject: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
