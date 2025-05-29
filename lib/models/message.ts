import mongoose from 'mongoose';

export interface IMessage {
  _id?: string; // Optional for new messages
  sender: string;
  content: string;
  contentType: 'text' | 'image' | 'video' | 'document' | 'gif' | 'sticker';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  read: boolean;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  sender: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'video', 'document', 'gif', 'sticker'],
    default: 'text',
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);