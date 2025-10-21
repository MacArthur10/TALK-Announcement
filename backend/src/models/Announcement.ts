import mongoose, { Schema, Document, Types } from "mongoose";

export type AnnouncementType = "internal" | "public" | "private";
export type AnnouncementStatus = "draft" | "pending" | "approved" | "rejected";

export interface AnnouncementDocument extends Document {
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  service: Types.ObjectId; // owner service
  targetService?: Types.ObjectId; // for private inter-service
  recipient?: Types.ObjectId; // for private announcements
  targetRole?: string; // for internal announcements: 'admin' or 'all'
  targetScope?: 'all' | 'specific'; // for communication service public announcements
  attachments?: string[]; // URLs (Cloudinary/Firebase)
  links?: { url: string; title: string }[]; // Web links
  createdBy: Types.ObjectId; // User
  modifiedBy?: Types.ObjectId; // User who last modified
  modifiedAt?: Date; // Last modification date
}

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["internal", "public", "private"], required: true },
    status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    targetService: { type: Schema.Types.ObjectId, ref: "Service" },
    targetRole: { type: String, enum: ["admin", "all"], default: "all" },
    targetScope: { type: String, enum: ["all", "specific"] },
    attachments: { type: [String], default: [] },
    links: [{
      url: { type: String, required: true },
      title: { type: String, required: true }
    }],
    recipient: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    modifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    modifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const AnnouncementModel = mongoose.model<AnnouncementDocument>(
  "Announcement",
  announcementSchema
);



