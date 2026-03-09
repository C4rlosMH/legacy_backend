import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  scope: "global" | "community";
  type: "direct" | "private_group" | "public_group";
  communityId?: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  participants: mongoose.Types.ObjectId[];
  admins?: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;

  // NUEVOS CAMPOS PARA SOLICITUDES
  status: "pending" | "accepted" | "rejected";
  initiatorId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema: Schema = new Schema(
  {
    scope: { type: String, enum: ["global", "community"], required: true },
    type: {
      type: String,
      enum: ["direct", "private_group", "public_group"],
      required: true,
    },
    communityId: { type: Schema.Types.ObjectId, ref: "Community" },
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },

    // CONFIGURACIÓN DE LOS NUEVOS CAMPOS
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    initiatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);
