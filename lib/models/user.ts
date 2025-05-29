import mongoose from 'mongoose';

export interface IUser {
  userId: string;
  name: string;
  email: string;
  isAdmin: boolean;
  lastSeen: Date;
  online: boolean;
}

const UserSchema = new mongoose.Schema<IUser>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  online: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);