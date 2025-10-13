import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Doctor } from './doctor.entity';
import { User } from './user.entity';
import {
  TicketCategory,
  TicketStatus,
  TicketSource,
  TicketSubcategory,
  RejectionReason,
} from '../enums';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  ticketNumber: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.tickets)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  prescriptionId: string;

  @ManyToOne('CustomerPrescription', { nullable: true })
  @JoinColumn({ name: 'prescriptionId' })
  prescription: any;

  @Column({
    type: 'enum',
    enum: TicketCategory,
  })
  category: TicketCategory;

  @Column({
    type: 'enum',
    enum: TicketSubcategory,
  })
  subcategory: TicketSubcategory;

  @Column({
    type: 'enum',
    enum: TicketSource,
  })
  source: TicketSource;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  ineligibilityReason: string;

  @Column({ type: 'boolean', default: false })
  isEligible: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  eligibleRefundAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedRefundAmount: number;

  @Column({ type: 'boolean', default: false })
  isApproved: boolean;

  @Column({ type: 'boolean', default: false })
  isRejected: boolean;

  @Column({
    type: 'enum',
    enum: RejectionReason,
    nullable: true,
  })
  rejectionReason: RejectionReason;

  @Column({ type: 'text', nullable: true })
  rejectionComments: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  assignedToRole: string;

  @Column({ type: 'uuid', nullable: true })
  assignedToDoctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.assignedTickets, { nullable: true })
  @JoinColumn({ name: 'assignedToDoctorId' })
  assignedToDoctor: Doctor;

  @Column({ type: 'uuid', nullable: true })
  assignedToUserId: string;

  @ManyToOne(() => User, (user) => user.assignedTickets, { nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedToUser: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToFinanceId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  processedBy: string;

  @Column({ type: 'uuid', nullable: true })
  processedByDoctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.processedTickets, { nullable: true })
  @JoinColumn({ name: 'processedByDoctorId' })
  processedByDoctor: Doctor;

  @Column({ type: 'uuid', nullable: true })
  processedByHODId: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'processedByHODId' })
  processedByHOD: Doctor;

  @Column({ type: 'uuid', nullable: true })
  processedByUserId: string;

  @ManyToOne(() => User, (user) => user.processedTickets, { nullable: true })
  @JoinColumn({ name: 'processedByUserId' })
  processedByUser: User;

  @Column({ type: 'uuid', nullable: true })
  processedByFinanceId: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  doctorComments: string;

  @Column({ type: 'text', nullable: true })
  agentComments: string;

  @Column({ type: 'text', nullable: true })
  hodComments: string;

  @Column({ type: 'text', nullable: true })
  financeComments: string;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ type: 'text', nullable: true })
  callSummary: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  engagementId: string;

  @Column({ type: 'int', default: 0 })
  freeKitsOffered: number;

  @Column({ type: 'boolean', default: false })
  isLegalThreat: boolean;

  @Column({ type: 'boolean', default: false })
  isSocialMediaThreat: boolean;

  @Column({ type: 'boolean', default: false })
  isDND: boolean;

  @Column({ type: 'int', default: 0 })
  estimatedTAT: number;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @OneToMany('Appointment', 'ticket')
  appointments: any[];

  @OneToMany('Communication', 'ticket')
  communications: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

