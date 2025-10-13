import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async createAppointment(data: {
    customerId: string;
    ticketId: string;
    slotType: string;
    slotTime: Date;
    assignedTo: string;
    callPurpose?: string;
  }): Promise<Appointment> {
    const appointment = this.appointmentRepository.create({
      ...data,
      status: 'scheduled',
      attemptNumber: 1,
      callPurpose: data.callPurpose || 'refund_ticket',
    });

    return await this.appointmentRepository.save(appointment);
  }

  async scheduleFollowUp(data: {
    customerId: string;
    slotType: string;
    slotTime: Date;
    callPurpose: string;
    assignedTo?: string;
    assignedToAgentId?: string;
    assignedToDoctorId?: string;
    assignedToHairCoachId?: string;
    notes?: string;
  }): Promise<Appointment> {
    const appointment = this.appointmentRepository.create({
      ...data,
      ticketId: null,
      status: 'scheduled',
      attemptNumber: 0,
    });

    return await this.appointmentRepository.save(appointment);
  }

  async getAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['customer', 'ticket'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async getAppointmentsByTicket(ticketId: string): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { ticketId },
      order: { slotTime: 'DESC' },
    });
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { customerId },
      order: { slotTime: 'DESC' },
      relations: ['ticket'],
    });
  }

  async getUpcomingAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    const now = new Date();
    return await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.customerId = :customerId', { customerId })
      .andWhere('appointment.slotTime > :now', { now })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: ['scheduled', 'rescheduled'],
      })
      .orderBy('appointment.slotTime', 'ASC')
      .getMany();
  }

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);
    appointment.status = 'cancelled';
    return await this.appointmentRepository.save(appointment);
  }

  async markReminderSent(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);

    appointment.reminderSent = true;
    appointment.reminderSentAt = new Date();

    return await this.appointmentRepository.save(appointment);
  }

  async updateAfterCallAttempt(
    appointmentId: string,
    data: {
      isConnected: boolean;
      attemptNumber: number;
      notes?: string;
    },
  ): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);

    appointment.attemptNumber = data.attemptNumber;

    if (data.isConnected) {
      appointment.status = 'completed';
    } else {
      if (data.attemptNumber === 1) {
        appointment.status = 'no_show';

      } else if (data.attemptNumber === 2) {
        appointment.status = 'no_show';

      }
    }

    if (data.notes) {
      appointment.notes = data.notes;
    }

    return await this.appointmentRepository.save(appointment);
  }

  async rescheduleAppointment(
    appointmentId: string,
    newSlotTime: Date,
  ): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);

    appointment.slotTime = newSlotTime;
    appointment.status = 'rescheduled';
    appointment.reminderSent = false;

    return await this.appointmentRepository.save(appointment);
  }

  async getUpcomingAppointments(minutesBefore: number): Promise<Appointment[]> {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + minutesBefore * 60000);

    return await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.slotTime <= :reminderTime', { reminderTime })
      .andWhere('appointment.slotTime > :now', { now })
      .andWhere('appointment.status = :status', { status: 'scheduled' })
      .andWhere('appointment.reminderSent = :reminderSent', {
        reminderSent: false,
      })
      .getMany();
  }
}

