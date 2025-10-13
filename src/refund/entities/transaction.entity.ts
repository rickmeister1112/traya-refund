import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { PaymentMode, TransactionType } from '../enums';

/**
 * Transaction Entity (Legacy)
 * 
 * NOTE: This is the legacy transaction tracking entity.
 * For new payment tracking, use PaymentTransaction entity instead.
 * 
 * This entity is kept for backward compatibility and summary-level tracking.
 * Consider migrating to PaymentTransaction for detailed payment event tracking.
 */
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  transactionNumber: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMode,
  })
  paymentMode: PaymentMode;

  // Updated to use enum instead of plain string
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  transactionType: TransactionType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentGateway: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentGatewayTransactionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankAccountNumber: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ type: 'boolean', default: false })
  isRefund: boolean;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

