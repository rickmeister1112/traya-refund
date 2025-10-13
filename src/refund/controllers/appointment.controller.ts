import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppointmentService } from '../services/appointment.service';
import { ScheduleFollowUpDto } from '../dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('follow-up')
  @HttpCode(HttpStatus.CREATED)
  async scheduleFollowUp(@Body() dto: ScheduleFollowUpDto) {
    const appointment = await this.appointmentService.scheduleFollowUp(dto);

    return {
      message: 'Follow-up call scheduled successfully',
      appointment,
    };
  }

  @Get('customer/:customerId')
  async getCustomerAppointments(@Param('customerId') customerId: string) {
    const appointments = await this.appointmentService.getAppointmentsByCustomer(customerId);

    return {
      count: appointments.length,
      appointments,
    };
  }

  @Get('customer/:customerId/upcoming')
  async getUpcomingAppointments(@Param('customerId') customerId: string) {
    const appointments = await this.appointmentService.getUpcomingAppointmentsByCustomer(customerId);

    return {
      count: appointments.length,
      appointments,
    };
  }

  @Get(':id')
  async getAppointment(@Param('id') id: string) {
    return await this.appointmentService.getAppointment(id);
  }

  @Patch(':id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body('newSlotTime') newSlotTime: Date,
  ) {
    const appointment = await this.appointmentService.rescheduleAppointment(
      id,
      new Date(newSlotTime),
    );

    return {
      message: 'Appointment rescheduled successfully',
      appointment,
    };
  }

  @Patch(':id/cancel')
  async cancelAppointment(@Param('id') id: string) {
    const appointment = await this.appointmentService.cancelAppointment(id);

    return {
      message: 'Appointment cancelled successfully',
      appointment,
    };
  }
}

