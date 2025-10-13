import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Appointment, Ticket, Customer } from '../entities';
import { CommunicationService } from './communication.service';
import { TicketStatus } from '../enums';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private communicationService: CommunicationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendAppointmentReminders() {
    this.logger.debug('Checking for appointments needing reminders...');

    try {
      const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
      const in31Minutes = new Date(now.getTime() + 31 * 60 * 1000);

      const appointmentsNeedingReminders = await this.appointmentRepository.find({
        where: {
          slotTime: Between(in30Minutes, in31Minutes),
          status: 'scheduled',
          reminderSent: false,
        },
        relations: ['customer', 'ticket'],
      });

      this.logger.log(
        `Found ${appointmentsNeedingReminders.length} appointments needing reminders`,
      );

      for (const appointment of appointmentsNeedingReminders) {
        try {

          await this.communicationService.sendSlotReminderMessage(
            appointment.customerId,
            appointment.ticketId,
            appointment.slotTime,
            appointment.assignedTo,
          );

          await this.appointmentRepository.update(appointment.id, {
            reminderSent: true,
            reminderSentAt: new Date(),
          });

          this.logger.log(
            `✅ Sent reminder for appointment ${appointment.id} (Customer: ${appointment.customer?.name}, Slot: ${appointment.slotTime})`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send reminder for appointment ${appointment.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in sendAppointmentReminders:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldAppointments() {
    this.logger.debug('Cleaning up old appointments...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.appointmentRepository.softDelete({
        slotTime: LessThan(thirtyDaysAgo),
        status: 'completed',
      });

      this.logger.log(`Cleaned up ${result.affected} old appointments`);
    } catch (error) {
      this.logger.error('Error in cleanupOldAppointments:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async logSchedulerStatus() {
    const upcomingCount = await this.appointmentRepository.count({
      where: {
        slotTime: Between(new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)),
        status: 'scheduled',
      },
    });

    this.logger.log(
      `📊 Scheduler Status: ${upcomingCount} appointments in next 24 hours`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDNDNotifications() {
    this.logger.debug('Checking for customers to mark as DND...');

    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const ticketsToMarkDND = await this.ticketRepository.find({
        where: {
          status: TicketStatus.REFUND_PROCESSED,
          isDND: false,
          processedAt: Between(fifteenDaysAgo, fourteenDaysAgo),
        },
        relations: ['customer'],
      });

      this.logger.log(
        `Found ${ticketsToMarkDND.length} customers to mark as DND`,
      );

      for (const ticket of ticketsToMarkDND) {
        try {

          await this.communicationService.sendDNDNotification(
            ticket.customerId,
            ticket.id,
          );

          await this.ticketRepository.update(ticket.id, {
            isDND: true,
          });

          await this.customerRepository.update(ticket.customerId, {
            isDND: true,
          });

          this.logger.log(
            `✅ Marked customer ${ticket.customer?.name} as DND (Ticket: ${ticket.ticketNumber})`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process DND for ticket ${ticket.id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in processDNDNotifications:', error);
    }
  }
}

