import dotenv from 'dotenv';

// Aseguramos que las variables de entorno se carguen antes de exportarlas
dotenv.config();

export const config = {
  app: {
    name: process.env.APP_NAME,
    port: parseInt(process.env.PORT as string, 10),
  },
  db: {
    uri: process.env.MONGO_URI,
  },
  api: {
    // Definimos el prefijo global con su versión
    prefix: '/api/v1',
  },
  security: {
    bcryptSaltRounds: 12,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  },
  limits: {
    maxBioLength: 160,
    maxUsernameLength: 30,
  },
  economy: {
    transactionTaxRate: Number(process.env.ECONOMY_TAX_RATE),   // Impuesto del % para transacciones P2P
    worldCreationCost: 100,     // Costo de crear una nueva comunidad
    welcomeGrant: 100,          // Legacy Coins regaladas al registrarse
  },
  gamification: {
    maxLevel: 20,           // Podrás cambiar esto a 30, 50, 100 después
    baseXP: 100,            // XP necesaria para nivel 2
    difficultyCurve: Number(process.env.GAMIFICATION_DIFFICULTY_CURVE),   // Qué tan rápido sube la dificultad
  },
  permissions: {
    minLevelToPost: 5,         // Nivel para Blogs/Hilos
    minLevelToSendImages: 6,   // Nivel para Multimedia
    minLevelToCreateChat: 8,   // Nivel para salas públicas
    minLevelToVote: 10,        // Nivel para gobernanza
    minLevelToTip: 5,          // Nivel para enviar/recibir propinas
  },
  governance: {
    insurrectionApprovalThreshold: Number(process.env.GOVERNANCE_INSURRECTION_THRESHOLD), 
    staffMutinyApprovalThreshold: Number(process.env.GOVERNANCE_STAFF_MUTINY_THRESHOLD),
    minStaffForMutiny: Number(process.env.GOVERNANCE_MIN_STAFF_FOR_MUTINY),
    minEligibleVotersForInsurrection: 15, 
    daysToConsiderInactive: 30, 
    sentinelCriticalInactivityDays: 60, 
    sentinelPurgeWarningDays: 14 ,
    sentinelId: process.env.SYSTEM_SENTINEL_ID,
    sentinelEmail: process.env.SYSTEM_SENTINEL_EMAIL,
    sentinelUsername: process.env.SYSTEM_SENTINEL_USERNAME,
    sentinelPassword: process.env.SYSTEM_SENTINEL_PASSWORD,
    sentinelMinAbsoluteMembers: Number(process.env.GOVERNANCE_MIN_ABSOLUTE_MEMBERS),
    sentinelMinAbsolutePosts: Number(process.env.GOVERNANCE_MIN_ABSOLUTE_POSTS),
    sentinelDynamicVitalityPercentage: Number(process.env.GOVERNANCE_DYNAMIC_VITALITY_PERCENTAGE),
  },
  communityRules: {
    minDaysToList: Number(process.env.COMMUNITY_MIN_DAYS_TO_LIST),
    minMembersToList: Number(process.env.COMMUNITY_MIN_MEMBERS_TO_LIST),
    minActivityToList: Number(process.env.COMMUNITY_MIN_ACTIVITY_TO_LIST),
    minDescLength: Number(process.env.COMMUNITY_MIN_DESC_LENGTH),
    defaultThemeColor: process.env.COMMUNITY_DEFAULT_THEME_COLOR,
    minTreasuryToList: Number(process.env.COMMUNITY_MIN_TREASURY_TO_LIST),
    minStaffToList: Number(process.env.COMMUNITY_MIN_STAFF_TO_LIST),
    minWikisToList: Number(process.env.COMMUNITY_MIN_WIKIS_TO_LIST),
    maxDisplayTitles: 5,
  },
  upload: {
    // URL base publica del servidor para armar las URLs de las imagenes.
    // Debe coincidir con la IP y puerto del backend accesibles desde el movil.
    serverUrl: process.env.SERVER_URL || 'http://192.168.2.221:2700',
  },
};