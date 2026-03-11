import mongoose, { Schema, Document } from 'mongoose';

export interface IInsurrection extends Document {
  communityId: mongoose.Types.ObjectId;
  initiatorId: mongoose.Types.ObjectId;

  // NUEVO: Alcance de la votación
  scope: 'staff' | 'public';
  
  // Estado actual del proceso democrático
  status: 'active' | 'success' | 'failed';
  
  // Arrays para guardar quién ya votó y evitar votos dobles
  votesFor: mongoose.Types.ObjectId[];
  votesAgainst: mongoose.Types.ObjectId[];
  
  // La "fotografía" matemática del momento en que inició
  requiredVotesToWin: number;
  totalEligibleVotersAtStart: number;
  
  // Cuándo termina el periodo de votación (Ej. 72 horas después de iniciar)
  expiresAt: Date;

  // Protocolo de Sucesión
  successionQueue: mongoose.Types.ObjectId[]; // Los 5 mejores candidatos
  invitedCandidate?: mongoose.Types.ObjectId | undefined; // A quién se le ofrece el puesto ahora
  candidateInvitationExpiresAt?: Date | undefined; // Cuándo caduca su oportunidad (24 hrs)
  
  createdAt: Date;
  updatedAt: Date;
}

const InsurrectionSchema: Schema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
    initiatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    scope: { 
      type: String, 
      enum: ['staff', 'public'], 
      required: true 
    },
    
    status: { 
      type: String, 
      enum: ['active', 'success', 'failed'], 
      default: 'active' 
    },
    
    votesFor: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    votesAgainst: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    
    requiredVotesToWin: { type: Number, required: true },
    totalEligibleVotersAtStart: { type: Number, required: true },
    
    expiresAt: { type: Date, required: true },
    
    successionQueue: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    invitedCandidate: { type: Schema.Types.ObjectId, ref: 'User' },
    candidateInvitationExpiresAt: { type: Date }
  },
  { timestamps: true }
);

// Índice compuesto vital: Nos permite saber al instante si un universo ya tiene un proceso en curso
InsurrectionSchema.index({ communityId: 1, status: 1 });
// Índice para que los Cron Jobs encuentren rápido las votaciones que ya expiraron
InsurrectionSchema.index({ status: 1, expiresAt: 1 });

export const InsurrectionModel = mongoose.model<IInsurrection>('Insurrection', InsurrectionSchema);