import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formatar data/hora no timezone de São Paulo
 */
export const formatInSaoPauloTimezone = (date: Date, formatStr: string = 'dd/MM/yyyy HH:mm'): string => {
  return formatInTimeZone(date, SAO_PAULO_TIMEZONE, formatStr);
};

/**
 * Converter horário de São Paulo para UTC
 */
export const convertSaoPauloToUTC = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const today = new Date();
  const saoPauloDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
  return fromZonedTime(saoPauloDate, SAO_PAULO_TIMEZONE);
};

/**
 * Converter UTC para horário de São Paulo
 */
export const convertUTCToSaoPaulo = (utcDate: Date): Date => {
  return toZonedTime(utcDate, SAO_PAULO_TIMEZONE);
};

/**
 * Obter horário atual de São Paulo formatado
 */
export const getCurrentSaoPauloTime = (): string => {
  return formatInSaoPauloTimezone(new Date(), 'HH:mm');
};

/**
 * Verificar se o horário atual de São Paulo corresponde a um dos horários agendados
 */
export const isScheduledTimeReached = (schedule: string[]): boolean => {
  const currentSaoPauloTime = getCurrentSaoPauloTime();
  return schedule.includes(currentSaoPauloTime);
};

/**
 * Calcular próxima execução baseada no schedule em horário de São Paulo
 */
export const calculateNextScheduledExecution = (schedule: string[]): Date | null => {
  if (!schedule || schedule.length === 0) return null;

  const now = new Date();
  const saoPauloNow = convertUTCToSaoPaulo(now);
  const currentTime = format(saoPauloNow, 'HH:mm');

  // Ordenar horários
  const sortedSchedule = [...schedule].sort();

  // Procurar próximo horário hoje
  for (const time of sortedSchedule) {
    if (time > currentTime) {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledTime = new Date(saoPauloNow.getFullYear(), saoPauloNow.getMonth(), saoPauloNow.getDate(), hours, minutes, 0);
      return fromZonedTime(scheduledTime, SAO_PAULO_TIMEZONE);
    }
  }

  // Se não há horário hoje, usar primeiro horário de amanhã
  const [hours, minutes] = sortedSchedule[0].split(':').map(Number);
  const tomorrow = new Date(saoPauloNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const scheduledTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), hours, minutes, 0);
  return fromZonedTime(scheduledTime, SAO_PAULO_TIMEZONE);
};