import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Ticket,
  Customer,
  BankDetails,
  Transaction,
} from '../entities';
import {
  TicketCategory,
  TicketStatus,
  TicketSource,
  TicketSubcategory,
  RejectionReason,
  PaymentMode,
  TransactionType,
} from '../enums';
import { EligibilityEngineV2Service } from './eligibility-engine-v2.service';
import { FinanceProcessingDto } from '../dto/finance-processing.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(BankDetails)
    private bankDetailsRepository: Repository<BankDetails>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private eligibilityEngineV2Service: EligibilityEngineV2Service,
  ) {}

  async createTicket(data: {
    customerId: string;
    source: TicketSource;
    reason: string;
    raisedBy?: string;
    engagementId?: string;
  }): Promise<{
    ticket: Ticket;
    eligibilityResult: any;
  }> {

    const customer = await this.customerRepository.findOne({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const eligibilityResult =
      await this.eligibilityEngineV2Service.checkEligibility(data.customerId);

    const category = eligibilityResult.isEligible
      ? TicketCategory.CATEGORY_A
      : TicketCategory.CATEGORY_B;

    let subcategory: TicketSubcategory;
    if (eligibilityResult.recommendedTreatmentPeriod === 5) {
      subcategory = TicketSubcategory.FIVE_MONTHS_MONEYBACK;
    } else if (eligibilityResult.recommendedTreatmentPeriod === 8) {
      subcategory = TicketSubcategory.EIGHT_MONTHS_MONEYBACK;
    } else {
      subcategory = TicketSubcategory.TWELVE_MONTHS_MONEYBACK;
    }

    const ticketNumber = `TKT-MB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    let assignedTo: string;
    let assignedToRole: string;
    let status: TicketStatus;

    if (category === TicketCategory.CATEGORY_A) {

      assignedTo = 'doctor@traya.health';
      assignedToRole = 'doctor';
      status = TicketStatus.ASSIGNED_TO_DOCTOR;
    } else {

      assignedTo = 'complaints@traya.health';
      assignedToRole = 'complaints_agent';
      status = TicketStatus.ASSIGNED_TO_COMPLAINTS;
    }

    const ticket = this.ticketRepository.create({
      ticketNumber,
      customerId: data.customerId,
      prescriptionId: eligibilityResult.prescriptionId,
      category,
      subcategory,
      source: data.source,
      status,
      reason: data.reason,
      isEligible: eligibilityResult.isEligible,
      ineligibilityReason: eligibilityResult.reasons.join(' | '),
      eligibleRefundAmount: eligibilityResult.eligibleRefundAmount,
      assignedTo,
      assignedToRole,
      estimatedTAT: category === TicketCategory.CATEGORY_A ? 24 : 48,
      engagementId: data.engagementId,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    return {
      ticket: savedTicket,
      eligibilityResult,
    };
  }

  async getTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['customer', 'prescription', 'appointments', 'communications'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async getTickets(filters?: {
    category?: TicketCategory;
    status?: TicketStatus;
    customerId?: string;
    assignedTo?: string;
  }): Promise<Ticket[]> {
    const where: any = {};

    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;

    return await this.ticketRepository.find({
      where,
      relations: ['customer', 'prescription'],
      order: { createdAt: 'DESC' },
    });
  }

  async doctorDisposition(
    ticketId: string,
    data: {
      isApproved: boolean;
      rejectionReason?: RejectionReason;
      comments: string;
      approvedAmount?: number;
      freeKitsOffered?: number;
      processedBy: string;
    },
  ): Promise<Ticket> {
    const ticket = await this.getTicket(ticketId);

    ticket.doctorComments = data.comments;
    ticket.processedBy = data.processedBy;
    ticket.processedAt = new Date();

    if (data.isApproved) {

      ticket.isApproved = true;
      ticket.approvedRefundAmount = data.approvedAmount || ticket.eligibleRefundAmount;
      ticket.status = TicketStatus.ASSIGNED_TO_HOD;
      ticket.assignedTo = 'hod@traya.health';
      ticket.assignedToRole = 'hod';
    } else {

      ticket.isRejected = true;
      ticket.rejectionReason = data.rejectionReason;
      ticket.rejectionComments = data.comments;

      if (
        data.rejectionReason ===
        RejectionReason.DOCTOR_SUGGESTED_EXTRA_MEDICINE
      ) {
        ticket.status = TicketStatus.CLOSED;

      } else {
        ticket.status = TicketStatus.REJECTED;
      }
    }

    if (data.freeKitsOffered) {
      ticket.freeKitsOffered = data.freeKitsOffered;
    }

    return await this.ticketRepository.save(ticket);
  }

  async hodApproval(
    ticketId: string,
    data: {
      isApproved: boolean;
      comments: string;
      processedBy: string;
    },
  ): Promise<Ticket> {
    const ticket = await this.getTicket(ticketId);

    ticket.hodComments = data.comments;

    if (data.isApproved) {

      const hasNonVoidCOD =
        await this.eligibilityEngineV2Service.hasNonVoidCODOrders(
          ticket.customerId,
        );

      if (hasNonVoidCOD) {

      }

      ticket.status = TicketStatus.ASSIGNED_TO_FINANCE;
      ticket.assignedTo = 'finance@traya.health';
      ticket.assignedToRole = 'finance';
    } else {
      ticket.isRejected = true;
      ticket.status = TicketStatus.REJECTED;
    }

    return await this.ticketRepository.save(ticket);
  }

  async agentDisposition(
    ticketId: string,
    data: {
      isApproved: boolean;
      rejectionReason?: string;
      comments: string;
      approvedAmount?: number;
      freeKitsOffered?: number;
      bookDoctorSlot?: boolean;
      processedBy: string;
    },
  ): Promise<Ticket> {
    const ticket = await this.getTicket(ticketId);

    ticket.agentComments = data.comments;
    ticket.processedBy = data.processedBy;
    ticket.processedAt = new Date();

    if (data.isApproved) {

      ticket.isApproved = true;
      ticket.approvedRefundAmount = data.approvedAmount || ticket.eligibleRefundAmount;

      const hasNonVoidCOD =
        await this.eligibilityEngineV2Service.hasNonVoidCODOrders(
          ticket.customerId,
        );

      if (hasNonVoidCOD) {

      }

      ticket.status = TicketStatus.ASSIGNED_TO_FINANCE;
      ticket.assignedTo = 'finance@traya.health';
      ticket.assignedToRole = 'finance';
    } else {
      ticket.isRejected = true;
      ticket.rejectionComments = data.comments;
      ticket.status = TicketStatus.REJECTED;
    }

    if (data.freeKitsOffered) {
      ticket.freeKitsOffered = data.freeKitsOffered;
    }

    if (data.bookDoctorSlot) {

      ticket.agentComments += '\n[Medical consultation slot requested - to be booked]';
      ticket.status = TicketStatus.PENDING_MEDICAL_CONSULTATION;
    }

    return await this.ticketRepository.save(ticket);
  }

  async financeProcessing(
    ticketId: string,
    data: FinanceProcessingDto,
  ): Promise<Ticket> {
    const ticket = await this.getTicket(ticketId);

    ticket.financeComments = data.comments;

    if (data.isProcessed) {
      ticket.status = TicketStatus.APPROVED;
      ticket.closedAt = new Date();

      const refundAmount = ticket.approvedRefundAmount || ticket.eligibleRefundAmount;

      const transactionNumber = data.transactionNumber || `REF-${ticket.ticketNumber}-${Date.now()}`;

      const refundTransaction = this.transactionRepository.create({
        transactionNumber,
        customerId: ticket.customerId,
        amount: refundAmount,
        paymentMode: PaymentMode.PREPAID,
        transactionType: TransactionType.REFUND, // Refund to customer
        isRefund: true,
        isProcessed: true,
        processedAt: new Date(),
        paymentGatewayTransactionId: data.paymentGatewayTransactionId,
        bankAccountNumber: data.bankAccountNumber,
        metadata: JSON.stringify({
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          processedBy: data.processedBy,
          comments: data.comments,
          approvedAmount: refundAmount,
        }),
      });

      await this.transactionRepository.save(refundTransaction);

      ticket.isDND = false;
    }

    return await this.ticketRepository.save(ticket);
  }

  async markThreat(
    ticketId: string,
    threatType: 'legal' | 'social_media',
  ): Promise<Ticket> {
    const ticket = await this.getTicket(ticketId);

    if (threatType === 'legal') {
      ticket.isLegalThreat = true;
    } else {
      ticket.isSocialMediaThreat = true;
    }

    ticket.assignedTo = 'complaints@traya.health';
    ticket.assignedToRole = 'complaints_agent';

    return await this.ticketRepository.save(ticket);
  }

  async canReRaiseTicket(customerId: string): Promise<{
    canRaise: boolean;
    reason: string;
  }> {
    const previousTicket = await this.ticketRepository.findOne({
      where: {
        customerId,
        isRejected: true,
        rejectionReason: RejectionReason.DOCTOR_SUGGESTED_EXTRA_MEDICINE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!previousTicket) {
      return { canRaise: true, reason: '' };
    }

    const daysSinceRejection = Math.floor(
      (new Date().getTime() - new Date(previousTicket.processedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysSinceRejection <= 45) {
      return {
        canRaise: true,
        reason: 'Customer can re-raise within 45 days of initial rejection.',
      };
    } else {
      return {
        canRaise: false,
        reason: 'Eligibility period has expired (45 days).',
      };
    }
  }

  async getBankDetailsStatus(ticketId: string): Promise<{
    hasDetails: boolean;
    isFilled: boolean;
    formLink?: string;
  }> {
    const ticket = await this.getTicket(ticketId);

    const bankDetails = await this.bankDetailsRepository.findOne({
      where: {
        customerId: ticket.customerId,
        ticketId: ticket.id,
      },
    });

    if (!bankDetails) {
      return {
        hasDetails: false,
        isFilled: false,
      };
    }

    return {
      hasDetails: true,
      isFilled: bankDetails.isFormFilled,
      formLink: bankDetails.formLink,
    };
  }
}

