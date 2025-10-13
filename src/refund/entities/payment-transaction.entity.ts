import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from './customer.entity';
import { PaymentMode, PaymentStatus, TransactionType } from '../enums';

/**
 * PaymentTransaction Entity
 * 
 * Tracks all payment-related financial transactions (similar to OrderHistory for orders)
 * This includes:
 * - Customer payments (CREDIT)
 * - Refunds to customers (DEBIT)
 * - Payment gateway transactions
 * - Wallet transactions
 * - Manual adjustments
 * 
 * Key Differences from Transaction entity:
 * - PaymentTransaction: Granular payment event tracking (one entry per payment event)
 * - Transaction: Legacy/summary transaction records
 * 
 * Use Cases:
 * - Calculate total money received from customer
 * - Calculate total refunds given to customer
 * - Track payment gateway settlements
 * - Audit trail for financial reconciliation
 * - Support for partial refunds
 */
@Entity('payment_transactions')
@Index(['customerId', 'transactionType'])
@Index(['paymentStatus'])
@Index(['transactionDate'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Unique transaction reference number (e.g., "TXN-20250113-0001")
  @Column({ type: 'varchar', length: 100, unique: true })
  transactionNumber: string;

  // Customer reference
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  // Related order number (if payment is for an order)
  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  orderNumber: string;

  // Related ticket ID (if this is a refund transaction)
  @Column({ type: 'uuid', nullable: true })
  @Index()
  ticketId: string;

  // Transaction Type: CREDIT (money in) or DEBIT (money out)
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  // Amount of this transaction
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // Payment mode used
  @Column({
    type: 'enum',
    enum: PaymentMode,
  })
  paymentMode: PaymentMode;

  // Current status of the payment
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  // Payment Gateway Details
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentGateway: string; // e.g., 'razorpay', 'paytm', 'phonepe'

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  paymentGatewayTransactionId: string; // Gateway's transaction ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentGatewayOrderId: string; // Gateway's order ID

  // Bank/UPI Details (for refunds)
  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountNumber: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bankIfscCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankAccountHolderName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  upiId: string; // For UPI refunds

  // Refund-specific fields
  @Column({ type: 'uuid', nullable: true })
  originalTransactionId: string; // Reference to original payment transaction being refunded

  @Column({ type: 'varchar', length: 255, nullable: true })
  refundReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refundReferenceNumber: string; // Bank/Gateway refund reference

  // Settlement & Reconciliation
  @Column({ type: 'boolean', default: false })
  isSettled: boolean; // Has the payment been settled by gateway?

  @Column({ type: 'timestamp', nullable: true })
  settledAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  settlementReferenceNumber: string;

  // Processing metadata
  @Column({ type: 'text', nullable: true })
  gatewayResponse: string; // JSON string of gateway response

  @Column({ type: 'text', nullable: true })
  metadata: string; // Additional JSON metadata

  @Column({ type: 'text', nullable: true })
  remarks: string; // Internal remarks/notes

  // Failure tracking
  @Column({ type: 'varchar', length: 500, nullable: true })
  failureReason: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  // Audit fields
  @Column({ type: 'uuid', nullable: true })
  processedBy: string; // User ID who processed this transaction

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp' })
  transactionDate: Date; // Actual date of transaction (can be backdated)

  // Soft delete support
  @Column({ type: 'boolean', default: false })
  isVoid: boolean; // Transaction cancelled/reversed

  @Column({ type: 'varchar', length: 500, nullable: true })
  voidReason: string;

  @Column({ type: 'timestamp', nullable: true })
  voidedAt: Date;

  // Standard timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

