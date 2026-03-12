import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  banner?: string;
  bio?: string;

  // ==========================================
  // ROL GLOBAL (Agregado para el Sistema)
  // ==========================================
  globalRole: "user" | "system";
  accountStatus: 'active' | 'suspended' | 'banned';
  banReason?: string | undefined;

  // ==========================================
  // NUEVOS CAMPOS: Economía, Membresía y Age Gate
  // ==========================================
  legacyCoins: number;
  premiumStatus: "none" | "active";
  premiumType: "fiat" | "coins" | null;
  premiumExpiresAt?: Date;
  lastDailyClaim?: Date;
  birthDate?: Date;

  isEmailVerified: boolean;
  blockedUsers: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre a mostrar es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder los 100 caracteres"],
    },
    username: {
      type: String,
      required: [true, "El nombre de usuario es obligatorio"],
      unique: true,
      trim: true,
      minlength: [3, "El nombre de usuario debe tener al menos 3 caracteres"],
      maxlength: [
        30,
        "El nombre de usuario no puede exceder los 30 caracteres",
      ],
    },
    email: {
      type: String,
      required: [true, "El correo electrónico es obligatorio"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, ingresa un correo electrónico válido",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
    },
    avatar: { type: String, default: "" },
    banner: { type: String, default: "" },
    bio: {
      type: String,
      maxlength: [300, "La biografía no puede exceder los 300 caracteres"],
      default: "",
    },

    // ==========================================
    // ROL GLOBAL
    // ==========================================
    globalRole: {
      type: String,
      enum: ["user", "system"],
      default: "user",
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active'
    },
    banReason: { type: String, maxlength: 300 },

    // ==========================================
    // CAMPOS DE ECONOMÍA Y LEGACY+
    // ==========================================
    legacyCoins: {
      type: Number,
      default: 100,
      min: 0,
    },
    premiumStatus: {
      type: String,
      enum: ["none", "active"],
      default: "none",
    },
    premiumType: {
      type: String,
      enum: ["fiat", "coins", null],
      default: null,
    },
    premiumExpiresAt: { type: Date },
    lastDailyClaim: { type: Date },
    birthDate: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
