import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketService, EligibilityEngineService, AppointmentService, CommunicationService } from '../services';
import { EligibilityEngineV2Service } from '../services/eligibility-engine-v2.service';
import {
  CreateTicketDto,
  DoctorDispositionDto,
  HODApprovalDto,
  AgentDispositionDto,
  FinanceProcessingDto,
  CreateAppointmentDto,
  UpdateCallAttemptDto,
} from '../dto';
import { TicketCategory, TicketStatus } from '../enums';

@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly eligibilityEngineService: EligibilityEngineService,
    private readonly eligibilityEngineV2Service: EligibilityEngineV2Service,
    private readonly appointmentService: AppointmentService,
    private readonly communicationService: CommunicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    const result = await this.ticketService.createTicket(createTicketDto);

    const slotTime = new Date();
    slotTime.setDate(slotTime.getDate() + 1);
    slotTime.setHours(10, 0, 0, 0);

    const appointment = await this.appointmentService.createAppointment({
      customerId: result.ticket.customerId,
      ticketId: result.ticket.id,
      slotType: result.ticket.isEligible ? 'doctor' : 'agent',
      slotTime: slotTime,
      assignedTo: result.ticket.assignedTo,
    });

    await this.communicationService.sendTicketCreationMessage(
      result.ticket.id,
      {
        slotTime: appointment.slotTime,
        assignedTo: appointment.assignedTo,
      },
    );

    return {
      ...result,
      appointment,
    };
  }

  @Get()
  async getTickets(
    @Query('category') category?: TicketCategory,
    @Query('status') status?: TicketStatus,
    @Query('customerId') customerId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return await this.ticketService.getTickets({
      category,
      status,
      customerId,
      assignedTo,
    });
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return await this.ticketService.getTicket(id);
  }

  @Get('eligibility/check/:customerId')
  async checkEligibility(@Param('customerId') customerId: string) {
    return await this.eligibilityEngineV2Service.checkEligibility(customerId);
  }

  @Get('refund-breakdown/:customerId')
  async getRefundBreakdown(@Param('customerId') customerId: string) {
    return await this.eligibilityEngineV2Service.getRefundCalculationBreakdown(
      customerId,
    );
  }

  @Get('eligibility/can-reraise/:customerId')
  async canReRaiseTicket(@Param('customerId') customerId: string) {
    return await this.ticketService.canReRaiseTicket(customerId);
  }

  @Post(':id/doctor-disposition')
  async doctorDisposition(
    @Param('id') id: string,
    @Body() doctorDispositionDto: DoctorDispositionDto,
  ) {
    const ticket = await this.ticketService.doctorDisposition(
      id,
      doctorDispositionDto,
    );

    if (doctorDispositionDto.isApproved) {

      const undeliveredOrders = await this.eligibilityEngineV2Service.getUndeliveredOrders(
        ticket.customerId,
      );

      if (undeliveredOrders.length > 0) {
        await this.communicationService.sendUndeliveredOrderNotification(
          ticket.customerId,
          ticket.id,
          undeliveredOrders,
        );
      }

    } else {

      await this.communicationService.sendRefundRejectionMessage(
        ticket.customerId,
        ticket.id,
        ticket.ticketNumber,
        doctorDispositionDto.rejectionReason?.toString() || '',
        doctorDispositionDto.comments,
      );

      const customer = await this.ticketService.getTicket(ticket.id);
      const treatmentPeriod = ticket.subcategory === 'five_months_moneyback' ? 5 :
                              ticket.subcategory === 'eight_months_moneyback' ? 8 : 12;

      await this.communicationService.sendRejectionEmail(
        ticket.customerId,
        ticket.id,
        customer.customer?.name || 'Valued Customer',
        treatmentPeriod,
        doctorDispositionDto.comments,
      );
    }

    return ticket;
  }

  @Post(':id/hod-approval')
  async hodApproval(
    @Param('id') id: string,
    @Body() hodApprovalDto: HODApprovalDto,
  ) {
    const ticket = await this.ticketService.hodApproval(id, hodApprovalDto);

    if (hodApprovalDto.isApproved) {

      const hasNonVoidCOD =
        await this.eligibilityEngineV2Service.hasNonVoidCODOrders(
          ticket.customerId,
        );

      const bankDetailsFormLink = hasNonVoidCOD
        ? `https://traya.health/bank-details/${ticket.id}`
        : undefined;

      await this.communicationService.sendRefundApprovalMessage(
        ticket.customerId,
        ticket.id,
        ticket.approvedRefundAmount || ticket.eligibleRefundAmount,
        hasNonVoidCOD,
        bankDetailsFormLink,
      );
    } else {
      await this.communicationService.sendRefundRejectionMessage(
        ticket.customerId,
        ticket.id,
        ticket.ticketNumber,
        'Not approved by HOD',
        hodApprovalDto.comments,
      );
    }

    return ticket;
  }

  @Post(':id/agent-disposition')
  async agentDisposition(
    @Param('id') id: string,
    @Body() agentDispositionDto: AgentDispositionDto,
  ) {
    const ticket = await this.ticketService.agentDisposition(
      id,
      agentDispositionDto,
    );

    if (agentDispositionDto.isApproved) {
      const hasNonVoidCOD =
        await this.eligibilityEngineV2Service.hasNonVoidCODOrders(
          ticket.customerId,
        );

      const bankDetailsFormLink = hasNonVoidCOD
        ? `https://traya.health/bank-details/${ticket.id}`
        : undefined;

      await this.communicationService.sendRefundApprovalMessage(
        ticket.customerId,
        ticket.id,
        ticket.approvedRefundAmount || ticket.eligibleRefundAmount,
        hasNonVoidCOD,
        bankDetailsFormLink,
      );
    } else {
      await this.communicationService.sendRefundRejectionMessage(
        ticket.customerId,
        ticket.id,
        ticket.ticketNumber,
        agentDispositionDto.rejectionReason || 'Not approved',
        agentDispositionDto.comments,
      );
    }

    return ticket;
  }

  @Post(':id/finance-processing')
  async financeProcessing(
    @Param('id') id: string,
    @Body() financeProcessingDto: FinanceProcessingDto,
  ) {
    return await this.ticketService.financeProcessing(
      id,
      financeProcessingDto,
    );
  }

  @Post(':id/mark-threat')
  async markThreat(
    @Param('id') id: string,
    @Body('threatType') threatType: 'legal' | 'social_media',
  ) {
    return await this.ticketService.markThreat(id, threatType);
  }

  @Post(':id/appointments')
  @HttpCode(HttpStatus.CREATED)
  async createAppointment(
    @Param('id') ticketId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    const appointment = await this.appointmentService.createAppointment({
      ...createAppointmentDto,
      ticketId,
    });

    return appointment;
  }

  @Get(':id/appointments')
  async getAppointments(@Param('id') ticketId: string) {
    return await this.appointmentService.getAppointmentsByTicket(ticketId);
  }

  @Patch('appointments/:appointmentId/call-attempt')
  async updateCallAttempt(
    @Param('appointmentId') appointmentId: string,
    @Body() updateCallAttemptDto: UpdateCallAttemptDto,
  ) {
    const appointment = await this.appointmentService.updateAfterCallAttempt(
      appointmentId,
      updateCallAttemptDto,
    );

    if (!updateCallAttemptDto.isConnected) {
      const ticket = await this.ticketService.getTicket(
        appointment.ticketId,
      );

      if (updateCallAttemptDto.attemptNumber === 1) {
        await this.communicationService.sendFirstAttemptMessage(
          ticket.customerId,
          ticket.id,
        );
      } else if (updateCallAttemptDto.attemptNumber === 2) {
        await this.communicationService.sendSecondAttemptMessage(
          ticket.customerId,
          ticket.id,
          '1800-XXX-XXXX',
        );
      }
    }

    return appointment;
  }

  @Patch('appointments/:appointmentId/reschedule')
  async rescheduleAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body('newSlotTime') newSlotTime: Date,
  ) {
    return await this.appointmentService.rescheduleAppointment(
      appointmentId,
      new Date(newSlotTime),
    );
  }

  @Get(':id/communications')
  async getCommunications(@Param('id') ticketId: string) {
    return await this.communicationService.getCommunicationsByTicket(ticketId);
  }

  @Post(':id/send-reminder')
  async sendSlotReminder(
    @Param('id') ticketId: string,
    @Body('appointmentId') appointmentId: string,
  ) {
    const appointment =
      await this.appointmentService.getAppointment(appointmentId);
    const ticket = await this.ticketService.getTicket(ticketId);

    await this.communicationService.sendSlotReminderMessage(
      ticket.customerId,
      ticket.id,
      appointment.slotTime,
      appointment.assignedTo,
    );

    await this.appointmentService.markReminderSent(appointmentId);

    return { message: 'Reminder sent successfully' };
  }

  @Get(':id/bank-details-status')
  async getBankDetailsStatus(@Param('id') ticketId: string) {
    return await this.ticketService.getBankDetailsStatus(ticketId);
  }

  @Post(':id/undelivered-orders/action')
  async handleUndeliveredOrders(
    @Param('id') ticketId: string,
    @Body('action') action: 'cancel' | 'proceed',
  ) {
    const ticket = await this.ticketService.getTicket(ticketId);

    if (action === 'cancel') {

      return {
        message: 'Undelivered orders will be cancelled. Refund will be processed for delivered orders only.',
        ticketId,
        action: 'cancel'
      };
    } else {

      return {
        message: 'Undelivered orders will proceed. Refund will be processed for delivered orders only.',
        ticketId,
        action: 'proceed'
      };
    }
  }

  @Get('undelivered-orders/:customerId')
  async getUndeliveredOrders(@Param('customerId') customerId: string) {
    return await this.eligibilityEngineV2Service.getUndeliveredOrders(customerId);
  }
}

