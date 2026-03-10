import { config } from '../config';

/**
 * Calcula cuánta XP TOTAL se requiere para alcanzar un nivel específico
 * Fórmula: Base * (Nivel - 1)^Curva
 */
export const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  
  const { baseXP, difficultyCurve } = config.gamification;
  
  // Usamos Math.floor para tener números redondos
  return Math.floor(baseXP * Math.pow(level - 1, difficultyCurve));
};

/**
 * Determina el nivel basado en la XP acumulada
 * Útil cuando el usuario gana mucha XP de golpe y sube varios niveles
 */
export const getLevelFromXP = (xp: number): number => {
  const { maxLevel } = config.gamification;
  let level = 1;

  // Recorremos hasta encontrar el nivel que corresponde a esa XP
  for (let l = 1; l <= maxLevel; l++) {
    if (xp >= getXPForLevel(l)) {
      level = l;
    } else {
      break;
    }
  }

  return level;
};

/**
 * Devuelve el progreso actual hacia el siguiente nivel en porcentaje
 * Útil para la barra de progreso en el Frontend
 */
export const getLevelProgress = (xp: number) => {
  const currentLevel = getLevelFromXP(xp);
  const xpCurrentLevel = getXPForLevel(currentLevel);
  const xpNextLevel = getXPForLevel(currentLevel + 1);
  
  const totalNeeded = xpNextLevel - xpCurrentLevel;
  const currentProgress = xp - xpCurrentLevel;
  
  return Math.min(Math.floor((currentProgress / totalNeeded) * 100), 100);
};