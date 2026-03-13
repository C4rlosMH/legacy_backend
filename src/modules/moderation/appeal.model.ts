import mongoose, { Schema, Document } from 'mongoose';

export interface IAppeal extends Document {
  userId: mongoose.Types.ObjectId;
  appealText: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId; // El administrador de Sentinel que tomó el caso
  reviewerNotes?: string; // Notas internas (ej. "Revisé los logs y fue un error del filtro")
  createdAt: Date;
  updatedAt: Date;
}

const AppealSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Limitamos el texto a 1000 caracteres para evitar que hagan spam con biblias de texto
    appealText: { type: String, required: true, maxlength: 1000, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // Notas invisibles para el usuario, solo para el equipo de Sentinel
    reviewerNotes: { type: String, maxlength: 500, trim: true }
  },
  { timestamps: true }
);

// Índice para asegurar búsquedas rápidas. 
// Un usuario solo debería tener una apelación pendiente a la vez.
AppealSchema.index({ userId: 1, status: 1 });

export const AppealModel = mongoose.model<IAppeal>('Appeal', AppealSchema);