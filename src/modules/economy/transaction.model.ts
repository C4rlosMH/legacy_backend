// Ruta: src/modules/economy/transaction.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'mint_fiat' | 'mint_ads' | 'mint_faucet' | 'tip_post' | 'store_purchase' | 'treasury_award' | 'world_creation';
  senderId?: mongoose.Types.ObjectId; // Null si el sistema imprime el dinero
  receiverId?: mongoose.Types.ObjectId; // User o Community (Tesorería)
  communityId?: mongoose.Types.ObjectId; // Si ocurrió dentro de un mundo
  amount: number; // Monto bruto
  taxBurned: number; // El 30% que se quema (si aplica)
  netAmount: number; // Lo que realmente llega
  referenceId?: mongoose.Types.ObjectId; // ID del post, wiki o item
  description: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['mint_fiat', 'mint_ads', 'mint_faucet', 'tip_post', 'store_purchase', 'treasury_award', 'world_creation'],
      required: true
    },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    receiverId: { type: Schema.Types.ObjectId, refPath: 'receiverModel' },
    receiverModel: { type: String, enum: ['User', 'Community'] },
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    amount: { type: Number, required: true, min: 1 },
    taxBurned: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    description: { type: String, required: true, maxlength: 200 }
  },
  { timestamps: { updatedAt: false } } // Solo necesitamos createdAt para un ledger inmutable
);

// Índices para historial rápido
TransactionSchema.index({ senderId: 1, createdAt: -1 });
TransactionSchema.index({ receiverId: 1, createdAt: -1 });
TransactionSchema.index({ communityId: 1, type: 1 });

export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);