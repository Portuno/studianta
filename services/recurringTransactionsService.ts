import { supabaseService } from './supabaseService';
import { BalanzaProTransaction, RecurringConfig } from '../types';

export class RecurringTransactionsService {
  /**
   * Verifica y crea automáticamente transacciones recurrentes pendientes
   */
  async checkAndCreateRecurringTransactions(userId: string): Promise<BalanzaProTransaction[]> {
    try {
      // Obtener todas las transacciones recurrentes
      const allTransactions = await supabaseService.getBalanzaProTransactions(userId, {
        isRecurring: true,
      });

      const createdTransactions: BalanzaProTransaction[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const transaction of allTransactions) {
        if (!transaction.recurring_config || !transaction.is_recurring) {
          continue;
        }

        const config = transaction.recurring_config as RecurringConfig;
        const startDate = new Date(config.start_date);
        startDate.setHours(0, 0, 0, 0);

        // Verificar si la fecha de inicio ya pasó
        if (startDate > today) {
          continue;
        }

        // Verificar si hay fecha de fin y si ya pasó
        if (config.end_date) {
          const endDate = new Date(config.end_date);
          endDate.setHours(0, 0, 0, 0);
          if (endDate < today) {
            continue;
          }
        }

        // Calcular la próxima fecha de ocurrencia según la frecuencia
        const nextDate = this.calculateNextOccurrence(
          startDate,
          config.frequency,
          today,
          config.end_date ? new Date(config.end_date) : undefined
        );

        if (!nextDate) {
          continue;
        }

        // Verificar si ya existe una transacción para esta fecha
        const existingTransactions = await supabaseService.getBalanzaProTransactions(userId, {
          startDate: nextDate.toISOString().split('T')[0],
          endDate: nextDate.toISOString().split('T')[0],
          isRecurring: true,
        });

        // Buscar si hay una transacción con el mismo monto y método de pago en esta fecha
        const alreadyCreated = existingTransactions.some(
          (t) =>
            t.amount === transaction.amount &&
            t.payment_method === transaction.payment_method &&
            t.type === transaction.type
        );

        if (!alreadyCreated && nextDate <= today) {
          // Crear la nueva transacción
          const newTransaction = await supabaseService.addBalanzaProTransaction(userId, {
            type: transaction.type,
            amount: transaction.amount,
            payment_method: transaction.payment_method,
            is_extra: transaction.is_extra,
            is_recurring: true,
            tags: transaction.tags,
            status: 'Completado',
            recurring_config: config,
            description: transaction.description || `Recurrente: ${transaction.description || 'Transacción recurrente'}`,
            date: nextDate.toISOString().split('T')[0],
          });

          createdTransactions.push(newTransaction);
        }
      }

      return createdTransactions;
    } catch (error) {
      console.error('Error checking recurring transactions:', error);
      return [];
    }
  }

  /**
   * Calcula la próxima fecha de ocurrencia basada en la frecuencia
   */
  private calculateNextOccurrence(
    startDate: Date,
    frequency: 'diaria' | 'semanal' | 'mensual' | 'anual',
    today: Date,
    endDate?: Date
  ): Date | null {
    let nextDate = new Date(startDate);

    while (nextDate <= today) {
      switch (frequency) {
        case 'diaria':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'semanal':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'mensual':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'anual':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }

      // Si hay fecha de fin y la próxima fecha la excede, retornar null
      if (endDate && nextDate > endDate) {
        return null;
      }
    }

    return nextDate <= today ? nextDate : null;
  }

  /**
   * Crea una configuración de transacción recurrente
   */
  async createRecurringTransaction(
    userId: string,
    transaction: Omit<BalanzaProTransaction, 'id' | 'is_recurring'> & {
      recurring_config: RecurringConfig;
    }
  ): Promise<BalanzaProTransaction> {
    return await supabaseService.addBalanzaProTransaction(userId, {
      ...transaction,
      is_recurring: true,
      status: transaction.status || 'Pendiente',
    });
  }
}

export const recurringTransactionsService = new RecurringTransactionsService();
