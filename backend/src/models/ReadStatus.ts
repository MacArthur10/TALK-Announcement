import mongoose, { Schema, Document, Types } from "mongoose";

export interface ReadStatusDocument extends Document {
  user: Types.ObjectId;
  announcement: Types.ObjectId;
  isDeleted: boolean;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const readStatusSchema = new Schema<ReadStatusDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    announcement: { type: Schema.Types.ObjectId, ref: "Announcement", required: true },
    isDeleted: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure unique constraint for user-announcement pairs
readStatusSchema.index({ user: 1, announcement: 1 }, { unique: true });

export const ReadStatusModel = mongoose.model<ReadStatusDocument>(
  "ReadStatus",
  readStatusSchema
);