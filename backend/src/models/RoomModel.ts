import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomDoc extends Document {
  roomId: string;
  name: string;
  theme: string;
  videoId: string;
  videoTitle: string;
  isPrivate: boolean;
  hostName: string;
  hostEmail?: string;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoomDoc>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    theme: {
      type: String,
      default: 'fantasy',
    },
    videoId: {
      type: String,
      default: '1La4QzGeaaQ',
    },
    videoTitle: {
      type: String,
      default: 'Watch Party',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    hostName: {
      type: String,
      default: 'Explorer',
    },
    hostEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    participantCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const RoomMongoModel = mongoose.model<IRoomDoc>('Room', RoomSchema);
