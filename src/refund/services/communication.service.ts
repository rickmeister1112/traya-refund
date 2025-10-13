import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Communication, Ticket } from '../entities';
import { CommunicationType } from '../enums';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Communication)
    private communicationRepository: Repository<Communication>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async sendTicketCreationMessage(
    ticketId: string,
    slotDetails?: {
      slotTime: Date;
      assignedTo: string;
    },
  ): Promise<Communication> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['customer'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isEligible = ticket.isEligible;
    const assignedTeam = isEligible ? 'doctor' : 'escalation agent';

    let slotInfo = '';
    if (slotDetails) {
      const slotDate = slotDetails.slotTime.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const slotTime = slotDetails.slotTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      slotInfo = `\n- Slot Scheduled: ${slotDate} at ${slotTime}`;
    }

    const message = `Dear ${ticket.customer.name},

Thank you for raising your money-back refund request. We have successfully received and assigned your case.

Ticket Details:
- Ticket ID: ${ticket.ticketNumber}
- Subcategory: ${ticket.subcategory}
- Assigned to: ${assignedTeam}
- Estimated TAT: ${ticket.estimatedTAT} hours${slotInfo}

${isEligible ? 'Your case meets the eligibility criteria and has been assigned to our doctor for review.' : 'Your case has been assigned to our escalation team for review.'}

${slotDetails ? `You will receive a reminder 30 minutes before your scheduled call.` : 'We will contact you soon to schedule a call.'}

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId: ticket.customerId,
      ticketId: ticket.id,
      type: CommunicationType.WHATSAPP,
      subject: 'Money Back Refund Request Created',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendSlotReminderMessage(
    customerId: string,
    ticketId: string,
    slotTime: Date,
    doctorName: string,
  ): Promise<Communication> {
    const message = `Dear Customer,

This is a reminder for your scheduled call with ${doctorName}.

Slot Time: ${slotTime.toLocaleString()}

The doctor will call you at the scheduled time to discuss your money-back refund case.

Please ensure you are available to take the call.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Appointment Reminder',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendFirstAttemptMessage(
    customerId: string,
    ticketId: string,
  ): Promise<Communication> {
    const message = `Dear Customer,

We have called you for discussing the money-back refund case but were unable to connect.

We will attempt again after 15 minutes to discuss the issue and provide a complete solution for your case.

Please be available for the call.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Call Attempt - Unable to Connect',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendSecondAttemptMessage(
    customerId: string,
    ticketId: string,
    ivrNumber: string,
  ): Promise<Communication> {
    const message = `Dear Customer,

We called you regarding the money-back refund issue but we were not able to connect.

You can:
1. Book a different slot again from the app
2. Connect with the agent by replying to this message
3. Call our IVR number: ${ivrNumber}

We are here to help you.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Call Attempt - Unable to Connect',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendRefundApprovalMessage(
    customerId: string,
    ticketId: string,
    refundAmount: number,
    hasNonVoidCOD: boolean,
    bankDetailsFormLink?: string,
  ): Promise<Communication> {
    let message = `Dear Customer,

Great news! Your money-back refund request has been approved and the Finance team will process it.

Refund Amount: ₹${refundAmount}

Estimated TAT for Refund Processing: 7-10 business days

`;

    if (hasNonVoidCOD && bankDetailsFormLink) {
      message += `Since you have COD orders, please fill in your bank details using the link below:
${bankDetailsFormLink}

Once you submit your bank details, our finance team will process the refund within the estimated TAT.`;
    } else {
      message += `We will refund the amount to the account number linked to your transactions. Our finance team will process this refund.`;
    }

    message += `

Thank you for your patience.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Refund Approved',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendRefundRejectionMessage(
    customerId: string,
    ticketId: string,
    ticketNumber: string,
    rejectionReason: string,
    comments: string,
  ): Promise<Communication> {
    const message = `Dear Customer,

We have reviewed your money-back refund request.

Ticket ID: ${ticketNumber}
Status: Rejected

Reason: ${rejectionReason}

Details: ${comments}

If you have any questions, please feel free to reach out to us.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Refund Request Update',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendUndeliveredOrderNotification(
    customerId: string,
    ticketId: string,
    undeliveredOrders: any[],
  ): Promise<Communication> {
    const orderDetails = undeliveredOrders
      .map(
        (o, idx) =>
          `${idx + 1}. Order #${o.id?.slice(0, 8) || 'N/A'}: ₹${o.amount || 0}`,
      )
      .join('\n');

    const totalUndelivered = undeliveredOrders.reduce(
      (sum, o) => sum + Number(o.amount || 0),
      0,
    );

    const message = `Dear Customer,

Regarding your money-back refund request:

We found the following undelivered orders in your account:

${orderDetails}

Total Amount (Undelivered): ₹${totalUndelivered}

Important: These undelivered orders are NOT eligible for refund.

You have two options:
1. Cancel these orders → Refund will be processed only for delivered orders
2. Keep these orders → Proceed with purchase (no refund for undelivered items)

Please select your preferred option from the app or contact our support team.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Undelivered Orders - Action Required',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendRejectionEmail(
    customerId: string,
    ticketId: string,
    customerName: string,
    treatmentPeriod: number,
    specificReasons: string,
  ): Promise<Communication> {

    const { getRejectionEmailTemplate, getRejectionEmailPlainText } =
      await import('../templates/rejection-email.template');

    const htmlContent = getRejectionEmailTemplate({
      customerName,
      treatmentPeriod,
      specificReasons,
    });

    const plainTextContent = getRejectionEmailPlainText({
      customerName,
      treatmentPeriod,
      specificReasons,
    });

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.EMAIL,
      subject: 'Refund Request Update - Traya',
      message: htmlContent,
      metadata: JSON.stringify({
        plainText: plainTextContent,
        htmlEmail: true,
      }),
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async sendDNDNotification(
    customerId: string,
    ticketId: string,
  ): Promise<Communication> {
    const message = `Dear Customer,

As we have processed your refund, we are placing you in Do Not Disturb (DND) mode so that you don't receive irrelevant communication from our side.

If you need any assistance in the future, you can always reach out to us through the app.

Thank you for being a part of Traya.

Best regards,
Team Traya`;

    const communication = this.communicationRepository.create({
      customerId,
      ticketId,
      type: CommunicationType.WHATSAPP,
      subject: 'Account placed in DND',
      message,
      status: 'pending',
    });

    return await this.communicationRepository.save(communication);
  }

  async markAsSent(
    communicationId: string,
    externalId?: string,
  ): Promise<Communication> {
    const communication = await this.communicationRepository.findOne({
      where: { id: communicationId },
    });

    if (!communication) {
      throw new NotFoundException('Communication not found');
    }

    communication.isSent = true;
    communication.sentAt = new Date();
    communication.status = 'sent';
    if (externalId) {
      communication.externalId = externalId;
    }

    return await this.communicationRepository.save(communication);
  }

  async getCommunicationsByTicket(ticketId: string): Promise<Communication[]> {
    return await this.communicationRepository.find({
      where: { ticketId },
      order: { createdAt: 'DESC' },
    });
  }
}

