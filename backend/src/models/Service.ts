import mongoose, { Schema, Document } from "mongoose";

export interface ServiceDocument extends Document {
  name: string;
  description?: string;
}

const serviceSchema = new Schema<ServiceDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.model<ServiceDocument>("Service", serviceSchema);



