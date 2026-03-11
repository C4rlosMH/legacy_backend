import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../users/user.model';
import { config } from '../../config';

export const injectSentinelProtocol = async () => {
  try {
    const { sentinelId, sentinelEmail, sentinelUsername, sentinelPassword } = config.governance;

    if (!sentinelId || sentinelId === '000000000000000000000000') {
      console.warn('[SENTINEL] Advertencia: No se ha configurado SYSTEM_SENTINEL_ID en el .env');
      return;
    }

    const sentinelExists = await UserModel.findById(sentinelId);

    if (!sentinelExists) {
      console.log('[SENTINEL] Protocolo de Inyección activado: Creando entidad del sistema...');

      const passwordToHash = (sentinelPassword as string);
      const hashedPassword = await bcrypt.hash(passwordToHash, 10);

      await UserModel.create({
        _id: new mongoose.Types.ObjectId(sentinelId as string),
        name: 'Legacy Sentinel',
        
        username: (sentinelUsername as string),
        email: (sentinelEmail as string),
        
        passwordHash: hashedPassword, 
        bio: 'Cuenta oficial automatizada del sistema Legacy. Encargada de la moderación y gobernanza de los mundos.',

        globalRole: 'system' as 'system', 
        legacyCoins: 999999, 
        premiumStatus: 'active' as 'active',
        premiumType: 'fiat' as 'fiat'
      });

      console.log('[SENTINEL] Entidad del sistema creada e inyectada exitosamente.');
    } else {
      console.log('[SENTINEL] Entidad del sistema en línea y operativa.');
    }
  } catch (error) {
    console.error('[SENTINEL] Error crítico al inyectar el sistema:', error);
  }
};