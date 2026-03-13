import mongoose, { Schema, Document } from 'mongoose';

export interface IBlacklist extends Document {
  term: string; // La palabra prohibida, link o cadena maliciosa (text bomb)
  category: 'hate' | 'explicit' | 'self_harm' | 'phishing' | 'text_bomb';
  isActive: boolean; // Para activar o desactivar una regla sin borrarla
}

const BlacklistSchema: Schema = new Schema({
  term: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['hate', 'explicit', 'self_harm', 'phishing', 'text_bomb'] 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const BlacklistModel = mongoose.model<IBlacklist>('Blacklist', BlacklistSchema);