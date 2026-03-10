import { UserModel } from '../users/user.model';
import { TransactionModel } from './transaction.model';
import { PostModel } from '../posts/post.model';
import { WikiModel } from '../wikis/wiki.model';
import { config } from '../../config';

export const claimDailyRewardService = async (userId: string) => {
  const user = await UserModel.findById(userId);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const now = new Date();
  const lastClaim = user.lastDailyClaim;

  if (lastClaim) {
    const isSameDay = 
      lastClaim.getDate() === now.getDate() &&
      lastClaim.getMonth() === now.getMonth() &&
      lastClaim.getFullYear() === now.getFullYear();

    if (isSameDay) {
      throw new Error('Ya reclamaste tu recompensa diaria de Legacy Coins hoy. Vuelve mañana.');
    }
  }

  let rewardAmount = 10;

  if (user.premiumStatus === 'active' && user.premiumType === 'fiat') {
    rewardAmount = 50;
  }

  user.legacyCoins += rewardAmount;
  user.lastDailyClaim = now;
  await user.save();

  await TransactionModel.create({
    type: 'mint_faucet',
    receiverId: user._id,
    receiverModel: 'User',
    amount: rewardAmount,
    taxBurned: 0,
    netAmount: rewardAmount,
    description: `Recompensa diaria de conexión (${user.premiumStatus === 'active' && user.premiumType === 'fiat' ? 'Legacy+' : 'Estándar'})`
  });

  return {
    reward: rewardAmount,
    newBalance: user.legacyCoins,
    message: `Has recibido ${rewardAmount} Legacy Coins en tu billetera.`
  };
};

interface TipContentDTO {
  senderId: string;
  targetType: 'post' | 'wiki';
  targetId: string;
  amount: number;
}

export const tipContentService = async (data: TipContentDTO) => {
  if (data.amount <= 0) {
    throw new Error('El monto de la donación debe ser mayor a 0 Legacy Coins.');
  }

  const sender = await UserModel.findById(data.senderId);
  if (!sender) throw new Error('Usuario remitente no encontrado.');
  
  if (sender.legacyCoins < data.amount) {
    throw new Error(`Fondos insuficientes. Tienes ${sender.legacyCoins} LC, pero intentas donar ${data.amount} LC.`);
  }

  let receiverId: string;
  let communityId: string | undefined;

  if (data.targetType === 'post') {
    const post = await PostModel.findById(data.targetId);
    if (!post) throw new Error('La publicación no existe.');
    if (!post.authorId) throw new Error('No se puede donar a una publicación anónima.');
    if (post.authorId.toString() === data.senderId) throw new Error('No puedes donar a tus propias publicaciones.');
    
    receiverId = post.authorId.toString();
    communityId = post.communityId?.toString();
  } else {
    const wiki = await WikiModel.findById(data.targetId);
    if (!wiki) throw new Error('La wiki no existe.');
    if (!wiki.authorId) throw new Error('No se puede donar a una wiki del sistema.');
    if (wiki.authorId.toString() === data.senderId) throw new Error('No puedes donar a tus propias wikis.');
    
    receiverId = wiki.authorId.toString();
    communityId = wiki.communityId?.toString();
  }

  const receiver = await UserModel.findById(receiverId);
  if (!receiver) throw new Error('El autor ya no existe.');

  const taxBurned = Math.round(data.amount * config.economy.transactionTaxRate);
  const netAmount = data.amount - taxBurned;

  sender.legacyCoins -= data.amount;       
  receiver.legacyCoins += netAmount;       

  await Promise.all([ sender.save(), receiver.save() ]);

  // SOLUCIÓN AL ERROR DE LA IMAGEN: Construcción de objeto limpio
  const transactionData: any = {
    type: 'tip_post',
    senderId: sender._id,
    receiverId: receiver._id,
    receiverModel: 'User',
    amount: data.amount,
    taxBurned,
    netAmount,
    referenceId: data.targetId,
    description: `Donación P2P a un(a) ${data.targetType}`
  };

  // Solo inyectamos communityId si existe, evitando el 'undefined'
  if (communityId) {
    transactionData.communityId = communityId;
  }

  await TransactionModel.create(transactionData);

  return {
    message: `Has donado ${data.amount} LC. Tras el impuesto, el creador recibió ${netAmount} LC.`,
    newBalance: sender.legacyCoins
  };
};