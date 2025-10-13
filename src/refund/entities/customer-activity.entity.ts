import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from './user.entity';

export enum ActivityType {
  PRESCRIPTION_CREATED = 'prescription_created',
  PRESCRIPTION_UPDATED = 'prescription_updated',
  KIT_CHANGED = 'kit_changed',
  TIMELINE_UPDATED = 'timeline_updated',
  ORDER_PLACED = 'order_placed',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUND_APPROVED = 'refund_approved',
  REFUND_REJECTED = 'refund_rejected',
  REFUND_PROCESSED = 'refund_processed',
  CALL_SCHEDULED = 'call_scheduled',
  CALL_COMPLETED = 'call_completed',
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  PROFILE_UPDATED = 'profile_updated',
  BANK_DETAILS_ADDED = 'bank_details_added',
  COMMUNICATION_SENT = 'communication_sent',
  NOTE_ADDED = 'note_added',
}

@Entity('customer_activities')
export class CustomerActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType: string;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({ type: 'uuid', nullable: true })
  performedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedByUserId' })
  performedByUser: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  performedBy: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue: string;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}

