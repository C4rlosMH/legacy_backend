export const executeAntiZombieProtocolService = async () => {
  try {
    const core = await import('./sentinel.core');
    return await core.executeAntiZombieProtocolLogic();
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('[SENTINEL] El núcleo del sistema está protegido en este entorno.');
      return { warnedCount: 0, purgedCount: 0 };
    }
    throw error;
  }
};