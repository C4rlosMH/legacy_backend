import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: 'email_verification' | 'password_reset';
  createdAt: Date;
  expiresAt: Date;
}

const AuthTokenSchema: Schema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  token: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['email_verification', 'password_reset'], 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  }
});

// Índice TTL: MongoDB borrará el documento automáticamente cuando la fecha actual supere 'expiresAt'
AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthTokenModel = mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);