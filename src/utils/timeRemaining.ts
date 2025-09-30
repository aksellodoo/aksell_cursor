
import { formatInTimeZone } from 'date-fns-tz';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
}

export const calculateTimeRemaining = (deadline: string): TimeRemaining => {
  const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
  
  try {
    // Data atual no fuso horário do Brasil
    const now = new Date();
    const nowInBrazil = new Date(formatInTimeZone(now, BRAZIL_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
    
    // Data limite no fuso horário do Brasil
    const deadlineDate = new Date(deadline);
    const deadlineInBrazil = new Date(formatInTimeZone(deadlineDate, BRAZIL_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
    
    // Calcular diferença em milissegundos
    const diffMs = deadlineInBrazil.getTime() - nowInBrazil.getTime();
    
    // Se já passou do prazo
    if (diffMs <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        isExpired: true
      };
    }
    
    // Converter para dias, horas e minutos
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      days,
      hours,
      minutes,
      isExpired: false
    };
  } catch (error) {
    console.error('Erro ao calcular tempo restante:', error);
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true
    };
  }
};
