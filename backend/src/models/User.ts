import mongoose, { Schema, Document, Types } from "mongoose";

export type UserRole = "superadmin" | "admin" | "employee";

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  matricule: string;
  service?: Types.ObjectId;
  role: UserRole;
  active: boolean;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    matricule: { type: String, required: true, trim: true },
    service: { type: Schema.Types.ObjectId, ref: "Service" },
    role: { type: String, enum: ["superadmin", "admin", "employee"], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>("User", userSchema);



